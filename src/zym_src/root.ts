import { Zyact } from "../zym_lib/zym/zymplementations/zyact/zyact";
import { registerGlobalCmds } from "../zym_lib/zy_god/divine_api/zy_global_cmds";
import { defaultKeyPressImpl } from "../zym_lib/zy_god/event_handler/key_press";
import { Zage } from "./zyms/zage/zage";

const root = new Zage(0, undefined);

export function getZymTreeRoot(): Zyact {
  return root;
}

/* ==== Add default cmd implementations ==== */
registerGlobalCmds([...defaultKeyPressImpl]);
