import { Zym } from "../zym/zym";

/* PATH */
export type ZyCmdPathNode = string;
export type ZyCmdPath = ZyCmdPathNode[];

/* Arguments */
export type ZyCmdArgs = any;

type ZyCall<T> = (zym: Zym, args: ZyCmdArgs) => T;

/* Cmd handlers */
export interface ZyCmdHandler<T> {
  call: ZyCall<T>;
  argValidator?: (args: ZyCmdArgs) => boolean;
}

export function justCaller<T>(call: ZyCall<T>): ZyCmdHandler<T> {
  return {
    call,
  };
}

/* RESULTS 
This is different from Rust results.  Rust results are used for 
error handling.  Here, if `ok = false`, it means that a methods hasn't been 
implemented for a particular zym
*/
interface PositiveZyResult<T> {
  ok: true;
  val: T;
}

interface NegativeZyResult {
  ok: false;
}

export type ZyResult<T> = PositiveZyResult<T> | NegativeZyResult;

export function ok<T>(result: ZyResult<T>): T {
  if (result.ok) {
    return result.val;
  } else {
    throw new Error("Command not implemented!");
  }
}
