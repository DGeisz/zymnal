import { ZymCommand } from "../zym/zym_types";
import { ZyGodId } from "./zy_god";

export enum ZyGodCommand {
  getInitialRelativeCursor = "getInitialRelativeCursor",
}

export function createGodlyCommand(
  cmd: ZyGodCommand,
  content?: any
): ZymCommand {
  return {
    zyMasterId: ZyGodId,
    type: cmd,
    content,
  };
}
