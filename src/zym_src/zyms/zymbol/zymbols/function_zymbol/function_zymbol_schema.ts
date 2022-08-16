import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../../zym_lib/hermes/hermes";
import { GroupId } from "../../../../../zym_lib/utils/types";
import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import {
  DotModifierZymbolTransform,
  DotModifierZymbolTransformer,
  IdentifiedDotModifierZymbolTransformers,
} from "../../../zymbol_infrastructure/zymbol_frame/transformer/std_transformers/dot_modifiers/dot_modifiers_schema";
import { TeX } from "../../zymbol_types";

export const FUNCTION_ZYMBOL_ID = "function-zymbol";

/* 
Mapping between the zocket index, and a boolean indicating
whether we should wrap it in brackets (instead of braces)
*/
export type FunctionBracketIndicator = Record<number, boolean>;

export type FunctionZymbolSchema = CreateZySchema<{
  children: IdentifiedSchema<any>[];
  numZockets: number;
  bracketZockets: FunctionBracketIndicator;
  baseTex: TeX;
}>;

export type FunctionZymbolPersistenceSchema = CreatePersistenceSchema<
  FunctionZymbolSchema,
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<any, any>[];
    };
    numZockets: "z";
    bracketZockets: "bz";
    baseTex: "b";
  }
>;

export type FunctionZymbolMethodSchema = CreateZentinelMethodSchema<{
  addDotModifierTransformer: {
    args: IdentifiedDotModifierZymbolTransformers;
    return: void;
  };
}>;

export const FunctionZymbolMethod =
  createZentinelMethodList<FunctionZymbolMethodSchema>(FUNCTION_ZYMBOL_ID, {
    addDotModifierTransformer: 0,
  });
