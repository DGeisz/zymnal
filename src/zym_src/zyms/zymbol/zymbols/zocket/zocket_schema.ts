import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { Zymbol } from "../../zymbol";
import { TeX } from "../../zymbol_types";
import { Zocket } from "./zocket";

export const ZOCKET_MASTER_ID = "zocket";

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

export function isZocket(zymbol: Zymbol): zymbol is Zocket {
  return zymbol.getMasterId() === ZOCKET_MASTER_ID;
}
