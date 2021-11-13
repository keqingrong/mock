import { parseJSONRecursively } from '../src';

test('parseJSONRecursive', () => {
  const obj = {
    code: null,
    msg: null,
    data: '{"goodsCount":null,"services":"[{\\"serviceName\\":null,\\"serviceCode\\":null}]","brands":"[{\\"brandId\\":null,\\"brandName\\":null}]","categories":"[{\\"categoryCode\\":null,\\"categoryName\\":null}]"}',
  };
  const json = JSON.stringify(obj);

  expect(parseJSONRecursively(json)).toEqual({
    code: null,
    msg: null,
    data: {
      goodsCount: null,
      services: [
        {
          serviceCode: null,
          serviceName: null,
        },
      ],
      brands: [
        {
          brandId: null,
          brandName: null,
        },
      ],
      categories: [
        {
          categoryCode: null,
          categoryName: null,
        },
      ],
    },
  });
});
