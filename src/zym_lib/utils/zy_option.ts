interface ZySome<T> {
  some: true;
  val: T;
}

export function zySome<T>(val: T): ZySome<T> {
  return {
    some: true,
    val,
  };
}

interface None {
  some: false;
}

export const NONE: None = { some: false };

export type ZyOption<T> = ZySome<T> | None;

export function isSome<T>(opt: ZyOption<T>): opt is ZySome<T> {
  return opt.some;
}

export function unwrapOption<T>(opt: ZyOption<T>): T {
  if (isSome(opt)) {
    return opt.val;
  } else {
    throw new Error("Option was not some!");
  }
}
