import fs from 'fs';
import path from 'path';
import { mock } from 'mockjs';
import chokidar from 'chokidar';
import json5 from 'json5';
import { isFunction } from 'lodash';
import {
  log,
  logWarning,
  walkdir,
  filterJSON,
  filterJavaScript,
  appendLeadingSlash,
} from '@keqingrong/mock-shared';
import Router from '@koa/router';
import { generateRoutePath, parseJSDocURL } from './utils';
import type { RegisterRoutesOptions, MockRoute } from './types';

/**
 * 检查 router 是否已经注册过指定 path 的 route
 */
export const isRoutePathRegistered = (router: Router, routePath: string) =>
  router.stack.map(item => item.path).includes(routePath);

/**
 * 增加内部 route
 */
export const addInternalRoutes = (router: Router) => {
  router.get('/mock-api/list', async (ctx, _next) => {
    // TODO: 支持过滤
    ctx.body = {
      code: 0,
      data: router.stack.map(item => ({
        path: item.path,
        methods: item.methods,
      })),
      msg: 'OK',
    };
  });
};

/**
 * 自动扫描 basePath 文件或文件夹下的 JS、JSON
 */
export const scanRoutes = async (basePath: string) => {
  const apiFilePaths: string[] = [];
  const stats = fs.statSync(basePath);
  if (stats.isFile()) {
    apiFilePaths.push(basePath);
  } else {
    const folderPath = stats.isDirectory() ? basePath : path.basename(basePath);
    const folderPaths = await walkdir(folderPath);
    apiFilePaths.push(...folderPaths);
  }

  const jsPaths = apiFilePaths.filter(filterJavaScript);
  const jsonPaths = apiFilePaths.filter(filterJSON);

  return {
    jsPaths,
    jsonPaths,
  };
};

/**
 * 移除 routes
 */
export const removeRoutes = (router: Router, routePath: string) => {
  const targetRoute = router.stack.reduce(
    (prev, curr, currIndex) => {
      if (curr.path === routePath) {
        prev.count++;
        if (prev.index === -1) {
          prev.index = currIndex;
        }
      }
      return prev;
    },
    { count: 0, index: -1 }
  );
  router.stack.splice(targetRoute.index, targetRoute.count);
};

/**
 * 注册 route
 * TODO: Router 泛型支持
 */
export const registerRoutes = (
  router: Router,
  {
    rootPath,
    jsPaths = [],
    jsonPaths = [],
    legacy = false,
  }: RegisterRoutesOptions
) => {
  // JS 模块
  jsPaths.forEach(jsPath => {
    const createRoute = require(jsPath);
    if (isFunction(createRoute)) {
      const route = createRoute({ router, mock });

      // 1. 自定义，要求自定义 route 不能返回对象
      if (!route) {
        // TODO: 检查已经注册的路由
        log(`[mock:registerRoutes] Create a custom route: see "${jsPath}"`);
        return;
      }

      // 2. mockjs 简化用法
      if (route && !isFunction(route.middleware)) {
        const routePath = generateRoutePath(jsPath, rootPath);
        const method = 'all';

        // 路由替换
        if (isRoutePathRegistered(router, routePath)) {
          logWarning(
            `[mock:registerRoutes] Route "${routePath}" has already been registered, it will be reload`
          );
          removeRoutes(router, routePath);
        }

        router[method](routePath, ctx => {
          ctx.jsonp = mock(route);
        });
        log(
          `[mock:registerRoutes] Create a JS route: ${method.toUpperCase()} ${routePath}`
        );
      }

      // 3. 标准用法
      // 支持在一个模块中同时定义多个 route
      const routes: MockRoute[] = Array.isArray(route) ? route : [route];
      routes.forEach(routeItem => {
        if (routeItem.middleware) {
          const routePath =
            routeItem.path || generateRoutePath(jsPath, rootPath);
          const method = routeItem.method || 'all';

          // 路由替换
          if (isRoutePathRegistered(router, routePath)) {
            logWarning(
              `[mock:registerRoutes] Route "${routePath}" has already been registered, it will be reload`
            );
            removeRoutes(router, routePath);
          }

          // 支持 method 定义为数组
          if (Array.isArray(method)) {
            method.forEach(methodItem => {
              router[methodItem](routePath, routeItem.middleware);
            });
          } else {
            router[method](routePath, routeItem.middleware);
          }

          log(
            `[mock:registerRoutes] Create a JS route: ${
              Array.isArray(method)
                ? method.map(m => m.toUpperCase()).join('/')
                : method.toUpperCase()
            } ${routePath}`
          );
        }
      });
    } else {
      // TODO: 支持 Promise ？
      logWarning(`[mock:registerRoutes] Please check the module "${jsPath}"`);
    }
  });

  // JSON 模块
  jsonPaths.forEach(jsonPath => {
    // 支持 JSON/JSONC/JSON5
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const json = json5.parse(content);
    let routePath = '';

    // 兼容 express-mockjs
    // 如果 JSON 名为 data.json，则尝试解析 JSDoc，若失败根据父级路径生成接口路径
    if (legacy && path.basename(jsonPath) === 'data.json') {
      const commentURL = parseJSDocURL(content);
      if (commentURL) {
        routePath = appendLeadingSlash(commentURL);
      } else {
        routePath = generateRoutePath(path.resolve(jsonPath, '..'), rootPath);
      }
    } else {
      routePath = generateRoutePath(jsonPath, rootPath);
    }

    // 路由替换
    if (isRoutePathRegistered(router, routePath)) {
      logWarning(
        `[mock:registerRoutes] Route "${routePath}" has already been registered, it will be reload`
      );
      removeRoutes(router, routePath);
    }

    router.all(routePath, ctx => {
      ctx.jsonp = mock(json);
    });
    log(`[mock:registerRoutes] Create a JSON route: ${routePath}`);
  });
};

type Listener = (path: string, stats?: fs.Stats) => void;

/**
 * 监控 rootPath 文件夹下的 JS、JSON 文件变化
 */
export const watchRoutes = (rootPath: string, listener: Listener) => {
  const watcher = chokidar.watch(rootPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  });

  watcher.on('change', (path, stats) => {
    if (filterJavaScript(path) || filterJSON(path)) {
      listener(path, stats);
    }
  });
};
