export function last<T>(arr: Array<T>, index?: number): T {
  const i = index === undefined ? 1 : index;

  return arr[arr.length - i];
}
