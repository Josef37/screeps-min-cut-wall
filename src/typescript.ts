export const not =
  <Args extends Array<unknown>>(fn: (...args: Args) => boolean) =>
  (...args: Args) =>
    !fn(...args);
