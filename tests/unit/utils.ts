export function FlushPromises() {
  return new Promise(setImmediate);
}

export const anything = expect.anything();

export function ClearMockMethods(object: any): void {
  Object.values(object).forEach((property: any) => {
    if (property && {}.toString.call(property) === '[object Function]') {
      property.mockClear();
    }
  });
}
