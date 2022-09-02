import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { Zymbol } from "../../zymbol";
import {
  ZocketPersistenceSchema,
  ZocketSchema,
  ZymbolModifier,
} from "../zocket/zocket_schema";
import { ParenthesisZymbol } from "./parenthesis_zymbol";

export const PARENTHESIS_ZYMBOL_ID = "parenthesis-zymbol";

export type ParenthesisZymbolSchema = CreateZySchema<{
  baseZocket: IdentifiedSchema<ZocketSchema>;
  bigParenthesis: boolean;
  modifiers: ZymbolModifier[];
  left: string;
  right: string;
}>;

export type ParenthesisZymbolPersistenceSchema = CreatePersistenceSchema<
  ParenthesisZymbolSchema,
  {
    baseZocket: {
      persistenceSymbol: "b";
      persistenceType: ZymPersist<ZocketSchema, ZocketPersistenceSchema>;
    };
    bigParenthesis: "p";
    left: "l";
    right: "r";
    modifiers: "m";
  }
>;

export function isParenthesisZymbol(
  zymbol: Zymbol
): zymbol is ParenthesisZymbol {
  return zymbol.getMasterId() === PARENTHESIS_ZYMBOL_ID;
}
