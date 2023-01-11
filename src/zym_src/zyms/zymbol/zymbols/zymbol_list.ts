import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { functionZymbolMaster } from "./function_zymbol/function_zymbol";
import { matrixZymbolMaster } from "./matrix_zymbol/matrix_zymbol";
import { parenthesisZymbolMaster } from "./parenthesis_zymbol/parenthesis_zymbol";
import { refZymbolMaster } from "./ref_zymbol/ref_zymbol";
import { snippetPlaceholderMaster } from "./snippet_placeholder/snippet_placeholder";
import { stackZymbolMaster } from "./stack_zymbol/stack_zymbol";
import { superSubMaster } from "./super_sub/super_sub";
import { symbolZymbolMaster } from "./symbol_zymbol/symbol_zymbol";
import { textZymbolMaster } from "./text_zymbol/text_zymbol";
import { zocketMaster } from "./zocket/zocket";

export const zymbolMasterList: ZyMaster<any, any>[] = [
  zocketMaster,
  symbolZymbolMaster,
  parenthesisZymbolMaster,
  textZymbolMaster,
  functionZymbolMaster,
  superSubMaster,
  stackZymbolMaster,
  snippetPlaceholderMaster,
  matrixZymbolMaster,
  refZymbolMaster,
];
