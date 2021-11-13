# @keqingrong/mock-server

基于 Koa 实现的 Mock 服务

## 安装

```bash
# npm
npm install @keqingrong/mock-server

# yarn
yarn add @keqingrong/mock-server
```

## 使用

```bash
./
├── mock
|  ├── example/
|  |  ├── form-data.js
|  |  ├── get.js
|  |  ├── json.js
|  |  └── x-www-from-urlencoded.js
|  └── loginst/
|     └── authStatus.js
└── package.json
```

```bash
$ mock-server --watch --port 8090 --api-base-path ./mock

$ open http://localhost:8090/example/get
```

```bash
$ mock-server --help

  Mock server

  Usage
    $ mock-server

  Options
    --port, -p  Mock 服务的启动端口
    --config, -c  Mock 服务的启动配置
    --base-path  Mock 服务 API 目录
    --pretty  是否对 JSON Response 美化
    --watch, -w  是否监控 API 目录文件变化
    --legacy  是否需要兼容 express-mockjs 写法

  Examples
    $ mock-server --port 8090
    $ mock-server --base-path ./mock/apis
    $ mock-server --config ./config/mock.config.js
    $ mock-server --watch --base-path ./mock/apis
```

## Mock 编写

假设当前项目为 `project`，在 `mock` 文件夹下存放 Mock 数据。

### 用法一：定义 JSON（默认支持 mockjs 语法）

```json
{
  "code": "000000",
  "data": [],
  "msg": "处理成功"
}
```

文件路径：`project/mock/demo/qux.json`，会自动创建路由为 `/demo/qux` 的接口，支持 GET/POST/JSONP 等方法。

注意：如果配置 `legacy`，会增加对 [express-mockjs](https://github.com/52cik/express-mockjs) 的兼容处理。当 JSON 文件命名为 `data.json` 时，会尝试解析其中的 JSDoc，如 `@url /demo/foo` 作为路由地址，如果解析失败则回退成父级目录路径，如 `project/mock/demo/foo/data.json`，会创建路由 `/demo/foo`。

### 用法二：定义 CommonJS 模块（默认支持 mockjs 语法），要求模块默认导出的方法调用后返回对象

```js
module.exports = () => ({
  foo: 'bar',
  list: [1, 2, 3, 4, 5]
});
```

文件路径：`project/mock/demo/foo.js`，会自动创建路由为 `/demo/foo` 的接口，支持 GET/POST/JSONP 等方法。

### 用法三：定义 Koa 中间件，要求模块默认导出的方法调用后返回的对象中包含 `middleware` 函数

```js
module.exports = ({ mock }) => ({
  async middleware(ctx, next) {
    ctx.body = {
      foo: 'bar',
      list: [1, 2, 3, 4, 5]
    };
  }
});
```

文件路径：`project/mock/demo/foo.js`，会自动创建路由为 `/demo/foo` 的接口，支持 GET/POST 等方法。

### 用法四：定义 Koa 中间件、请求方法和路径（忽略文件路径），允许同时定义多个

```js
module.exports = ({ mock }) => ({
  method: 'get',
  path: '/demo/bar',
  async middleware(ctx, next) {
    ctx.body = {
      foo: 'bar',
      list: [1, 2, 3, 4, 5]
    };
  }
});
```

创建仅支持 GET 方法，路由为 `/demo/bar` 的接口。

```js
module.exports = ({ mock }) => ([
  {
    method: 'get',
    path: '/example/multiple/foo',
    async middleware(ctx, next) {
      ctx.body = {
        foo: 'foo',
        list: [1, 2, 3, 4, 5]
      };
    }
  },
  {
    method: 'get',
    path: '/example/multiple/bar',
    async middleware(ctx, next) {
      ctx.body = {
        foo: 'bar',
        list: [1, 2, 3, 4, 5]
      };
    }
  },
  {
    method: 'get',
    path: '/example/multiple/jsonp',
    async middleware(ctx, next) {
      ctx.jsonp = {
        foo: 'bar',
        list: [1, 2, 3, 4, 5]
      };
    }
  }
]);
```

在一个模块中同时定义多个接口路由（**每个子路由都必须定义 `path`**）。

### 用法五：完全自定义 Koa 路由（不能返回对象，否则和用法二冲突）

```js
module.exports = ({ router, mock }) => {
  router.get('/demo/baz', (ctx, next) => {
    ctx.body = 'Hello World!';
  });
};
```

## TODO

- [x] 支持 HEAD/GET/POST
- [x] 支持 JSON/JSONP
- [x] 自动扫描目录 JS 和 JSON 生成接口
- [x] 支持 CORS
- [x] 支持图片上传
- [ ] 支持分页
- [ ] 支持视图
- [ ] 端口占用，自动切换端口
- [x] 显示局域网地址
- [ ] 支持集成到 webpack-dev-server（本项目基于 koa，而 webpack-dev-server 基于 express）
- [x] 支持文件修改后重新加载路由
- [x] 兼容 express-mockjs

## 相关链接

- <https://koajs.com/>
- <http://mockjs-lite.js.org/docs/examples.html>
- <https://www.npmjs.com/package/json-server>
- <https://github.com/52cik/express-mockjs>
