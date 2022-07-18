import { Zentinel } from "../zym_lib/zentinel/zentinel";
import { Zyact } from "../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym_lib/zym/zy_master";
import { defaultCursorImpl } from "../zym_lib/zy_god/cursor/cursor_commands";
import { registerGlobalCmds } from "../zym_lib/zy_god/divine_api/zy_global_cmds";
import { defaultKeyPressImpl } from "../zym_lib/zy_god/event_handler/key_press";
import { zymbolTransformerZentinel } from "./zentinels/transformer/transformer";
import { Zage } from "./zyms/zage/zage";
import { zageMaster } from "./zyms/zage/zage_master";
import { zymbolMasterList } from "./zyms/zymbol/zymbols/zymbol_list";
import { zymbolInfrastructureMasters } from "./zyms/zymbol_infrastructure/zymbol_infrastructure";

const root = new Zage(0, undefined);

export function getZymTreeRoot(): Zyact {
  return root;
}

/* ==== Add default cmd implementations ==== */
registerGlobalCmds([...defaultKeyPressImpl, ...defaultCursorImpl]);

export const zyMasterList: ZyMaster[] = [
  zageMaster,
  ...zymbolInfrastructureMasters,
  ...zymbolMasterList,
];

export const zentinelList: Zentinel[] = [zymbolTransformerZentinel];
