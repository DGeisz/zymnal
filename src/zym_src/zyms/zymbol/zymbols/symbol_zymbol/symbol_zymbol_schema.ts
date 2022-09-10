import { TeXBinaryOperators } from "../../../../../global_utils/latex_utils";
import type { Zym } from "../../../../../zym_lib/zym/zym";
import {
  CreateZySchema,
  zyIdentifierFactory,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { Zymbol } from "../../zymbol";
import { ZymbolModifier } from "../zocket/zocket_schema";
import { SymbolZymbol } from "./symbol_zymbol";

export const SYMBOL_ZYMBOL_ID = "symbol-zymbol";

export type SymbolZymbolSchema = CreateZySchema<
  {
    texSymbol: string;
    modifiers: ZymbolModifier[];
  },
  { texSymbol: "t"; modifiers: "m" }
>;

export const isSymbolZymbol =
  zyIdentifierFactory<SymbolZymbol>(SYMBOL_ZYMBOL_ID);

export function zymbolIsBinaryOperator(zymbol: Zymbol): boolean {
  return (
    isSymbolZymbol(zymbol) && TeXBinaryOperators.includes(zymbol.texSymbol)
  );
}
