import {
  implementPartialCmdGroup,
  some,
} from "../../../../../../zym_lib/zy_commands/zy_command_types";
import {
  CursorCommand,
  GetInitialCursorReturn,
} from "../../../../../../zym_lib/zy_god/cursor/cursor_commands";

export const zocketCursorImpl = implementPartialCmdGroup(CursorCommand, {
  getInitialCursor: (): GetInitialCursorReturn => some([0]),
});
