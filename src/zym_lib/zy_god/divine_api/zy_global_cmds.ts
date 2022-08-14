import { Zym } from "../../zym/zym";
import {
  ZyCmdArgs,
  ZyCmdPath,
  ZyCommandRegistration,
  ZyResult,
} from "../../zy_trait/zy_command_types";
import { zyGod } from "../zy_god";

export function checkGlobalImplementation(path: ZyCmdPath): boolean {
  return zyGod.checkCmd(path);
}

export async function defaultCmd<T>(
  zym: Zym,
  path: ZyCmdPath,
  args: ZyCmdArgs
): Promise<ZyResult<T>> {
  return zyGod.cmd(zym, path, args);
}

export function registerDefaultCmd(registration: ZyCommandRegistration<any>) {
  zyGod.registerCmd(registration);
}

export function registerDefaultCmds(regs: ZyCommandRegistration<any>[]) {
  zyGod.registerCmds(regs);
}
