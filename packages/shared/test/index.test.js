const test = require('ava');
const { appendLeadingSlash } = require('../lib');

test('appendLeadingSlash', t => {
  t.is(appendLeadingSlash('/example/get'), '/example/get');
  t.is(appendLeadingSlash('example/get'), '/example/get');
  t.is(appendLeadingSlash(''), '/');
});
