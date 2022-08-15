interface Some<T> {
  some: true;
  val: T;
}

export function some<T>(val: T): Some<T> {
  return {
    some: true,
    val,
  };
}

interface None {
  some: false;
}

export const NONE: None = { some: false };

export type ZyOption<T> = Some<T> | None;

export function isSome<T>(opt: ZyOption<T>): opt is Some<T> {
  return opt.some;
}

export function unwrapOption<T>(opt: ZyOption<T>): T {
  if (isSome(opt)) {
    return opt.val;
  } else {
    throw new Error("Option was not some!");
  }
}
