import { Zym } from "../../zym/zym";
import {
  ZyCmdArgs,
  ZyCmdPath,
  ZyCommandRegistration,
  ZyResult,
} from "../../zy_commands/zy_command_types";
import { zyGod } from "../zy_god";

export function checkGlobalImplementation(path: ZyCmdPath): boolean {
  return zyGod.checkCmd(path);
}

export function globalCmd<T>(
  zym: Zym,
  path: ZyCmdPath,
  args: ZyCmdArgs
): ZyResult<T> {
  return zyGod.cmd(zym, path, args);
}

export function registerGlobalCmd(registration: ZyCommandRegistration<any>) {
  zyGod.registerCmd(registration);
}

export function registerGlobalCmds(regs: ZyCommandRegistration<any>[]) {
  zyGod.registerCmds(regs);
}
