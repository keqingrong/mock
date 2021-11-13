export type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONObject
  | JSONValue[];

export type JSONObject = {
  [K in string]?: JSONValue;
};

export const isJSONObject = (value: unknown): value is JSONObject =>
  Object.prototype.toString.call(value) === '[object Object]';

/**
 * 递归解析 JSON，只要值是字符串，就尝试继续作为 JSON 解析
 * @param json
 */
export const parseJSONRecursively = <T>(json: string) => {
  try {
    const parsed = JSON.parse(json, (_key, value) => {
      if (typeof value === 'string') {
        try {
          const subValue = JSON.parse(value) as JSONValue;
          if (isJSONObject(subValue)) {
            const parsedSubValue: JSONObject = {};
            Object.keys(subValue).forEach((propName) => {
              const propValue = subValue[propName];
              if (typeof propValue === 'string') {
                parsedSubValue[propName] = parseJSONRecursively(propValue);
              } else {
                parsedSubValue[propName] = propValue;
              }
            });
            return parsedSubValue;
          } else if (Array.isArray(subValue)) {
            return subValue.map((subValueItem) =>
              typeof subValueItem === 'string'
                ? parseJSONRecursively(subValueItem)
                : subValueItem
            );
          } else if (typeof subValue === 'string') {
            return parseJSONRecursively<T>(subValue);
          } else {
            // 忽略 boolean/number/undefined 等类型
            return;
          }
        } catch (err) {
          return value;
        }
      } else {
        return value as T;
      }
    }) as T;
    return parsed;
  } catch (err) {
    console.error(`[parseJSONRecursively]`, err);
    return null;
  }
};
