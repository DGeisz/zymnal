import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { implementTotalCmdGroup } from "../../../zym_lib/zy_commands/zy_command_types";
import { KeyPressCommand } from "../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "./zymbol";

export const zymbolKeypressImpl = implementTotalCmdGroup(KeyPressCommand, {
  handleKeyPress: (zym, args) => {
    const { keyPress, cursor, keyPressContext } = args;

    return (zym as Zymbol).handleKeyPress(keyPress, cursor, keyPressContext);
  },
});

export function extendZymbol(zyMaster: ZyMaster) {
  zyMaster.registerCmds([...zymbolKeypressImpl]);
}
