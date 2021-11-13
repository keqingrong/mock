import path from 'path';
import junk from 'junk';
import klaw from 'klaw';
import chalk from 'chalk';

export const log = console.log;
export const logSuccess = (...args: any[]) => log(chalk.green(...args));
export const logWarning = (...args: any[]) => log(chalk.yellow(...args));
export const logError = (...args: any[]) => log(chalk.red(...args));

/**
 * 过滤垃圾文件，保留符合 suffixRegExp 正则后缀的文件
 */
export const filterBySuffix = (filename: string, suffixRegExp: RegExp) =>
  suffixRegExp.test(path.extname(filename)) && junk.not(filename);

/**
 * 过滤垃圾文件，保留 JS 文件
 */
export const filterJavaScript = (filename: string) =>
  filterBySuffix(filename, /\.js$/i);

/**
 * 过滤垃圾文件，保留 JSON 文件
 */
export const filterJSON = (filename: string) =>
  filterBySuffix(filename, /\.json$/i);

/**
 * 判断是否是非隐藏文件
 */
export const isNonHidden = (filename: string) => {
  const basename = path.basename(filename);
  return basename === '.' || basename[0] !== '.';
};

/**
 * 递归遍历 rootPath 下所有文件夹、文件，返回文件路径名称列表
 */
export const walkdir = (rootPath: string, filter = () => true) =>
  new Promise<string[]>((resolve, reject) => {
    const paths: string[] = [];
    klaw(rootPath, { filter: isNonHidden })
      .on('data', item => {
        paths.push(item.path);
      })
      .on('error', (err: Error, item: klaw.Item) => {
        logError('[walkdir]', err.message);
        logError('[walkdir]', item.path);
        reject(err);
      })
      .on('end', () => {
        resolve(paths.filter(filter));
      });
  });

/**
 * 开头追加斜杠
 */
export const appendLeadingSlash = (pathname: string = '') =>
  /^\//.test(pathname) ? pathname : `/${pathname}`;

/**
 * 移除开头斜杠
 */
export const removeLeadingSlash = (pathname: string = '') =>
  pathname.replace(/^\/+/, '');

/**
 * 获取 pathname 结尾，不包含 `.do` `.tk`
 * @example
 * '/master/cashconfig/addressInfo/getProvinceList4SN'
 * '/srcskf/webmaster/queryIndexTopData.do'
 * '/pos-order/pay/queryStoreTradeList.tk'
 */
export const getTrailingName = (pathname: string = '') => {
  return path.basename(pathname).split('.')[0];
};
