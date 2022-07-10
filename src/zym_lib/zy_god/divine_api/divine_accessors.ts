import { Zym } from "../../zym/zym";
import { NONE, some, ZyOption } from "../../zy_commands/zy_command_types";
import { Cursor } from "../cursor/cursor";
import { zyGod } from "../zy_god";

export function getRelativeCursor(zym: Zym): ZyOption<Cursor> {
  const zymCursor = zym.getFullCursorPointer();
  const godCursor = zyGod.getCursorCopy();

  if (zymCursor.length > godCursor.length) return NONE;

  for (let i = 0; i < zymCursor.length; i++) {
    if (godCursor[i] !== zymCursor[i]) {
      return NONE;
    }
  }

  return some(godCursor.slice(zymCursor.length));
}
