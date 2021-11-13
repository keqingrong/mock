import { debounce } from 'lodash';
import path from 'path';
import address from 'address';
import Koa from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';
import koaBody from 'koa-body';
import logger from 'koa-logger';
import json from 'koa-json';
// @ts-ignore
import jsonp from 'koa-safe-jsonp';
import koaStatic from 'koa-static';
import { logError, logSuccess, logWarning } from '@keqingrong/mock-shared';
import {
  addInternalRoutes,
  scanRoutes,
  registerRoutes,
  watchRoutes,
} from './route';
import { isBasePathExists } from './utils';
import type { MockServerConfig } from './types';

const __DEV__ = process.env.NODE_ENV === 'development';

export const serve = async (config: MockServerConfig) => {
  __DEV__ && console.log('[mock] config', config);

  if (!isBasePathExists(config.basePath)) {
    throw new Error(`The basePath "${config.basePath}" does not exist`);
  }

  const app = new Koa();
  const router = new Router();
  const publicBasePath = path.resolve(__dirname, '../public');

  jsonp(app, {
    callback: 'callback',
    limit: 50,
  });

  /**
   * logger 最外层调用
   * json pretty 次外层，方便格式化 response
   * cors 次次外层，收到请求优先处理 CORS
   * 先调用 koa-body 再调用 koa-router
   */
  app.use(logger());
  if (config.pretty) {
    app.use(
      json({
        pretty: true,
        spaces: 2,
      })
    );
  }
  app.use(
    cors({
      credentials: true,
    })
  );
  app.use(
    koaBody({
      multipart: true,
    })
  );
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.use(koaStatic(publicBasePath));

  addInternalRoutes(router);

  try {
    // 自动扫描 apis 文件夹下 JS、JSON，添加为 route
    const { jsPaths, jsonPaths } = await scanRoutes(config.basePath);
    registerRoutes(router, {
      rootPath: config.basePath,
      jsPaths,
      jsonPaths,
      legacy: config.legacy,
    });
  } catch (err) {
    logError(err);
  }

  // 监控 apis 文件变化
  if (config.watch) {
    logSuccess(`[mock] Watch "${config.basePath}"`);

    const onRoutesChange = async (filePath: string) => {
      const { jsPaths, jsonPaths } = await scanRoutes(filePath);
      const routePaths = [...jsPaths, ...jsonPaths];
      routePaths.forEach(routePath => {
        logWarning(
          `[mock:onRoutesChange] "${require.resolve(routePath)}" will be reload`
        );
        delete require.cache[require.resolve(routePath)];
      });
      registerRoutes(router, {
        rootPath: config.basePath,
        jsPaths,
        jsonPaths,
        legacy: config.legacy,
      });
    };

    const onRoutesChangeDebounced = debounce(onRoutesChange, 1000);

    watchRoutes(config.basePath, onRoutesChangeDebounced);
  }

  app.on('error', (err, ctx) => {
    logError('[mock] server error', err, ctx);
  });

  app.listen(config.port);

  logSuccess(`[mock] Mock server is running at ${config.port}`);
  logSuccess(`[mock] LOCAL http://localhost:${config.port}`);
  logSuccess(`[mock] LAN  http://${address.ip()}:${config.port}`);

  return {
    app,
    router,
  };
};
