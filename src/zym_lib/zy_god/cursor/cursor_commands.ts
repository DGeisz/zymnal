import { justPath, ZyCommandGroup } from "../../zy_commands/zy_command_types";
import { Cursor } from "./cursor";

const LOCAL_CURSOR_COMMANDS_ID = "a7c53a93-c997-4477-8174-6894f59cbbbd";

const lcc = (name: string) => [{ groupId: LOCAL_CURSOR_COMMANDS_ID, name }];

/* Get initial cursor */
export type GetInitialCursorReturn = Cursor;

export const LocalCursorCommand: ZyCommandGroup = {
  getInitialCursor: justPath(lcc("gic")),
};
