import {
  groupPathFactory,
  justPath,
  ZyCommandGroup,
} from "../../zy_commands/zy_command_types";
import { Cursor } from "./cursor";

/* ==== LOCAL COMMANDS ==== */

const LOCAL_CURSOR_COMMANDS_ID = "a7c53a93-c997-4477-8174-6894f59cbbbd";

const lcc = groupPathFactory(LOCAL_CURSOR_COMMANDS_ID);

/* Get initial cursor */
export type GetInitialCursorReturn = Cursor;

enum LocalCursorCommandsEnum {
  /* Allows to get where the cursor should start */
  getInitialCursor,
  /* During a cursor render, this indicates that we should block the cursor render
  here, and allow this zym to render the remainder of it's children */
  canHandleCursorBranchRender,
}

export type LocalCursorType = typeof LocalCursorCommandsEnum;

export const LocalCursorCommand: ZyCommandGroup<LocalCursorType> = {
  getInitialCursor: justPath(lcc("gic")),
  canHandleCursorBranchRender: justPath(lcc("bcr")),
};
