export function memoCompareFactory<T extends object>(
  properties: Array<keyof T>
): (o1: T, o2: T) => boolean {
  return (o1: T, o2: T) => {
    for (const p of properties) {
      if (o1[p] !== o2[p]) {
        return false;
      }
    }

    return true;
  };
}
