import { Zentinel } from "../zentinel/zentinel";
import {
  call,
  ok,
  serializePath,
  UNIMPLEMENTED,
  validatePath,
  ZyCmdArgs,
  ZyCmdHandler,
  ZyCmdPath,
  ZyCmdSerialPath,
  ZyCommandRegistration,
  ZyResult,
} from "../zy_commands/zy_command_types";
import { ZyId } from "../zy_types/basic_types";
import { Zym } from "./zym";

export abstract class ZyMaster extends Zentinel {
  private cmdRegistry: Map<ZyCmdSerialPath, ZyCmdHandler<any>> = new Map();

  checkCmd = (path: ZyCmdPath) => this.cmdRegistry.has(serializePath(path));

  cmd = <T>(zym: Zym, path: ZyCmdPath, args: ZyCmdArgs): ZyResult<T> => {
    const handler = this.cmdRegistry.get(serializePath(path));

    if (handler) {
      return ok(call(handler, zym, args));
    } else {
      return UNIMPLEMENTED;
    }
  };

  registerCmd = <T>(reg: ZyCommandRegistration<T>, override?: boolean) => {
    const { path, handler } = reg;

    if (validatePath(path)) {
      const sPath = serializePath(path);

      if (!this.cmdRegistry.has(sPath) || override) {
        this.cmdRegistry.set(sPath, handler);
      } else {
        throw new Error(`${sPath} already implemented!`);
      }
    } else {
      throw new Error("Invalid path!");
    }
  };

  registerCmds = (regs: ZyCommandRegistration<any>[]) => {
    regs.forEach((reg) => this.registerCmd(reg));
  };

  abstract readonly zyId: ZyId;
}
