import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { TeX } from "../../zymbol_types";

export type ZocketSchema = CreateZySchema<{
  children: IdentifiedSchema<any>[];
  modifiers: ZymbolModifier[];
}>;

export type ZocketPersistenceSchema = CreatePersistenceSchema<
  ZocketSchema,
  {
    modifiers: "m";
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<any, any>[];
    };
  }
>;

export interface ZymbolModifier {
  id: {
    group: string;
    item: string | number;
  };
  pre: TeX;
  post: TeX;
}
