import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { symbolZymbolMaster } from "./symbol_zymbol/symbol_zymbol";
import { textZymbolMaster } from "./text_zymbol/text_zymbol";
import { zocketMaster } from "./zocket/zocket";

export const zymbolMasterList: ZyMaster[] = [
  zocketMaster,
  symbolZymbolMaster,
  textZymbolMaster,
];
