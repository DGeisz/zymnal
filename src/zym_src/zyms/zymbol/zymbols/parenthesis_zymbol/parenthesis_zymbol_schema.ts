import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { ZocketPersistenceSchema, ZocketSchema } from "../zocket/zocket_schema";

export const PARENTHESIS_ZYMBOL_ID = "parenthesis-zymbol";

export type ParenthesisZymbolSchema = CreateZySchema<{
  baseZocket: IdentifiedSchema<ZocketSchema>;
  bigParenthesis: boolean;
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
  }
>;
