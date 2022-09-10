import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { TeX } from "../../zymbol_types";

export const STACK_ZYMBOL_ID = "stack-zymbol";

export type StackZymbolSchema = CreateZySchema<
  {
    children: IdentifiedBaseSchema<any>[];
    operator: TeX;
  },
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<any, any>[];
    };
    operator: "o";
  }
>;
