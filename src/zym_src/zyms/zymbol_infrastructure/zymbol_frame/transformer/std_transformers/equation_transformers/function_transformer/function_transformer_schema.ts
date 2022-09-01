import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../../../../../zym_lib/hermes/hermes";
import { FunctionBracketIndicator } from "../../../../../../zymbol/zymbols/function_zymbol/function_zymbol_schema";
import { TeX } from "../../../../../../zymbol/zymbol_types";

export const FUNCTION_TRANSFORMER = "function-transformer";

export interface FunctionTransformerSpecialCommand {
  bracketZockets: FunctionBracketIndicator;
  numZockets: number;
  tex: TeX;
}

export interface FunctionTransformerMap {
  id: {
    group: string;
    item: string | number;
  };
  map: {
    [key: string]: string | FunctionTransformerSpecialCommand;
  };
  cost: number;
}

export type FunctionTransformerMethodSchema = CreateZentinelMethodSchema<{
  addFunctionTransformerMap: {
    args: FunctionTransformerMap;
    return: void;
  };
}>;

export const FunctionTransformMethod =
  createZentinelMethodList<FunctionTransformerMethodSchema>(
    FUNCTION_TRANSFORMER,
    {
      addFunctionTransformerMap: 0,
    }
  );
