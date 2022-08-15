import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { KeyPressTrait } from "../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "./zymbol";

export function extendZymbol(zyMaster: ZyMaster<any>) {
  zyMaster.implementTrait(KeyPressTrait, {
    async handleKeyPress(zym, { keyPress, cursor, keyPressContext }) {
      return (zym as Zymbol).handleKeyPress(keyPress, cursor, keyPressContext);
    },
  });
}
