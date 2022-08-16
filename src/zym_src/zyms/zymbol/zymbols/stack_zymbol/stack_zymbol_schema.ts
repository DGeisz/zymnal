import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { TeX } from "../../zymbol_types";

export const STACK_ZYMBOL_ID = "stack-zymbol";

export type StackZymbolSchema = CreateZySchema<{
  children: IdentifiedSchema<any>[];
  operator: TeX;
}>;

export type StackZymbolPersistenceSchema = CreatePersistenceSchema<
  StackZymbolSchema,
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<any, any>[];
    };
    operator: "o";
  }
>;
