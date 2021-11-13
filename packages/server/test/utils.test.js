const test = require('ava');
const { generateRoutePath, parseJSDocURL } = require('../lib/utils');

test('generateRoutePath', t => {
  const routePath = generateRoutePath(
    'C:\\Users\\keqingrong\\workspace\\example\\mock\\apis\\example\\get.js',
    'C:\\Users\\keqingrong\\workspace\\example\\mock\\apis'
  );
  t.is(routePath, '/example/get');
});

test('parseJSDocURL', t => {
  t.is(
    parseJSDocURL(`/**
  * 外采采购退货单查询 接口描述
  *
  *
  * GET: 请求方法及参数
  */
  `),
    ''
  );

  t.is(
    parseJSDocURL(`/**
  * 外采采购退货单查询 接口描述
  *
  * @url /outsidePicking/getOrderList
  *
  * GET: 请求方法及参数
  */
  `),
    '/outsidePicking/getOrderList'
  );

  t.is(
    parseJSDocURL(`/**
  * 外采采购退货单查询 接口描述
  *
  * @url foo
  *
  * GET: 请求方法及参数
  */
  `),
    'foo'
  );

  t.is(
    parseJSDocURL(`/**
  * 外采采购退货单查询 接口描述
  *
  * @url /outsidePicking /getOrderList
  *
  * GET: 请求方法及参数
  */
  `),
    '/outsidePicking'
  );

  t.is(
    parseJSDocURL(`/**
  * 外采采购退货单查询 接口描述
  *
  * @url /foo-bar/qux
  *
  * GET: 请求方法及参数
  */
  `),
    '/foo-bar/qux'
  );
});
