import { implementPartialCmdGroup } from "../../../../../zym_lib/zy_commands/zy_command_types";
import { CursorCommand } from "../../../../../zym_lib/zy_god/cursor/cursor_commands";

export const frameCursorImpl = implementPartialCmdGroup(CursorCommand, {
  /* The frame handles rendering all the TeX */
  canHandleCursorBranchRender: () => true,
});
