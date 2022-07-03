import { Zym } from "../../zym/zym";
import {
  ZyCmdArgs,
  ZyCmdHandler,
  ZyCmdPath,
  ZyCommandRegistration,
  ZyResult,
} from "../../zy_commands/zy_command_types";

export function checkGlobalImplementation(path: ZyCmdPath): boolean {
  throw new Error("uminp");
}

export function globalCmd<T>(
  zym: Zym,
  path: ZyCmdPath,
  args: ZyCmdArgs
): ZyResult<T> {
  throw new Error("uminp");
}

export function registerGlobalCmd(
  registration: ZyCommandRegistration<any>
): boolean {
  throw new Error("uminp");
}

/* ======= Include the global commands here ====  */
