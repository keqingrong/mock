import fs from 'fs';
import path from 'path';
import upath from 'upath';

/**
 * 判断 basePath 配置是否存在
 */
export const isBasePathExists = (basePath: string) => {
  try {
    fs.accessSync(basePath);
    return true;
  } catch (_err) {
    return false;
  }
};

export const routeExtNames = ['.js', '.json', '.cjs', '.mjs', '.ts'];

/**
 * 从文件名生成路由名
 *
 * @example
 * ```
 * generateRoutePath(
 *   'C:\\Users\\keqingrong\\workspace\\example\\mock\\apis\\example\\get.js',
 *   'C:\\Users\\keqingrong\\workspace\\example\\mock\\apis'
 * ) => '/example/get'
 *
 * generateRoutePath(
 *   'C:\\Users\\keqingrong\\workspace\\example\\mock\\apis\\example\\get.js',
 * ) => '/apis/example/get'
 *
 * generateRoutePath(
 *   'C:\\Users\\keqingrong\\workspace\\example\\apis\\legacy\\getCategoryList.do\\data.json'
 * ) => '/legacy/getCategoryList.do'
 * ```
 */
export const generateRoutePath = (filename: string, baseFilename = '.') => {
  const relativePath = path.relative(baseFilename, filename);
  const dirname = path.dirname(relativePath);
  const extname = path.extname(relativePath);
  const basename = routeExtNames.includes(extname)
    ? path.basename(relativePath, extname)
    : path.basename(relativePath);
  return upath.normalize(path.join('/', dirname, basename));
};

/** `@url /foo/bar` 正则表达式 */
export const regexpTagURL = /@url\s([\w\/-]+)\b/i;

/**
 * 解析 JSDoc 中的 `@url` 地址
 */
export const parseJSDocURL = (comment = '') => {
  const [_, url] = regexpTagURL.exec(comment) || [];
  return url || '';
};
