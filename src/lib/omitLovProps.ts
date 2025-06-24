export function omitLovProps<T extends Record<string, any>>(props: T): T {
  const filtered: Record<string, any> = {};
  Object.keys(props).forEach(key => {
    if (!key.startsWith('data-lov-')) {
      filtered[key] = props[key];
    }
  });
  return filtered as T;
} 