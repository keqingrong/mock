import type Router from '@koa/router';

export interface MockServerConfig {
  /** Mock 启动端口 */
  port: number;
  /** Mock API 目录 */
  basePath: string;
  /** 是否格式化响应的 JSON */
  pretty: boolean;
  /** 是否监控 API 目录文件变化 */
  watch: boolean;
  /** 是否需要兼容 express-mockjs 写法 */
  legacy: boolean;
}

export type MockServerConfigType =
  | MockServerConfig
  | (() => Promise<MockServerConfig> | MockServerConfig);

export interface RegisterRoutesOptions {
  rootPath: string;
  jsPaths: string[];
  jsonPaths: string[];
  legacy: boolean;
}

/**
 * 对应 `Router` 的实例方法
 */
export type Method =
  | 'get'
  | 'post'
  | 'put'
  | 'link'
  | 'unlink'
  | 'delete'
  | 'del'
  | 'head'
  | 'options'
  | 'patch'
  | 'all';

export interface MockRoute {
  /** 请求地址 */
  path?: string;
  /** 请求方法 */
  method?: Method | Method[];
  /** 中间件 */
  middleware: Router.Middleware;
}
