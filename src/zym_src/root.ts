import { Zentinel } from "../zym_lib/zentinel/zentinel";
import { Zyact } from "../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym_lib/zym/zy_master";
import { defaultCursorImpl } from "../zym_lib/zy_god/cursor/cursor_commands";
import { registerDefaultCmds } from "../zym_lib/zy_god/divine_api/zy_global_cmds";
import { defaultKeyPressImpl } from "../zym_lib/zy_god/event_handler/key_press";
import { dotModifiers } from "./zyms/zymbol_infrastructure/zymbol_frame/transformers/dot_modifiers";
import { Zage, zageMaster } from "./zyms/zage/zage";
import { zymbolMasterList } from "./zyms/zymbol/zymbols/zymbol_list";
import { zymbolInfrastructureMasters } from "./zyms/zymbol_infrastructure/zymbol_infrastructure";
import { inPlaceSymbol } from "./zyms/zymbol_infrastructure/zymbol_frame/transformers/in_place_symbols";
import { parenthesisModifiers } from "./zyms/zymbol_infrastructure/zymbol_frame/transformers/parenthesis";
import { fraction } from "./zyms/zymbol_infrastructure/zymbol_frame/transformers/fraction_transform";
import { cashFunctions } from "./zyms/zymbol_infrastructure/zymbol_frame/transformers/cash_functions";
import { superSubTransform } from "./zyms/zymbol_infrastructure/zymbol_frame/transformers/super_sub_transform";
import { defaultUndoRedoImpl } from "../zym_lib/zy_god/undo_redo/undo_redo";
import { defaultZymbolHtmlIdImpl } from "./zyms/zymbol/zymbol";

const root = new Zage(0, undefined);

export function getZymTreeRoot(): Zyact {
  return root;
}

/* ==== Add default cmd implementations ==== */
registerDefaultCmds([
  ...defaultKeyPressImpl,
  ...defaultCursorImpl,
  ...defaultUndoRedoImpl,
  ...defaultZymbolHtmlIdImpl,
]);

export const zyMasterList: ZyMaster[] = [
  zageMaster,
  ...zymbolInfrastructureMasters,
  ...zymbolMasterList,
];

export const zentinelList: Zentinel[] = [
  inPlaceSymbol,
  dotModifiers,
  parenthesisModifiers,
  cashFunctions,
  fraction,
  superSubTransform,
];
