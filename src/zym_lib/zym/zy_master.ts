import {
  call,
  ok,
  serializePath,
  UNIMPLEMENTED,
  ZyCmdArgs,
  ZyCmdHandler,
  ZyCmdPath,
  ZyCmdSerialPath,
  ZyResult,
} from "../zy_commands/zy_command_types";
import { ZyId } from "../zy_types/basic_types";
import { Zym } from "./zym";

export abstract class ZyMaster {
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

  abstract readonly zyId: ZyId;
}
