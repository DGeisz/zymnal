import { implementPartialCmdGroup } from "../../../../../../zym_lib/zy_commands/zy_command_types";
import { LocalCursorCommand } from "../../../../../../zym_lib/zy_god/cursor/cursor_commands";

export const zocketCursorImpl = implementPartialCmdGroup(LocalCursorCommand, {
  getInitialCursor: () => [0],
});
