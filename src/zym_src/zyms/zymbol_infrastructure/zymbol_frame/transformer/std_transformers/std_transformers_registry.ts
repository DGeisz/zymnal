import { Zentinel } from "../../../../../../zym_lib/zentinel/zentinel";
import { cashStack } from "./equation_transformers/cash_stack/cash_stack";
import { dotModifiers } from "./equation_transformers/dot_modifiers/dot_modifiers";
import { fractionTransformer } from "./equation_transformers/fraction_transform/fraction_transform";
import { functionTransformer } from "./equation_transformers/function_transformer/function_transformer";
import { inPlaceSymbols } from "./equation_transformers/in_place_symbols/in_place_symbols";
import { parenthesisModifiers } from "./equation_transformers/parenthesis_transformer/parenthesis_transform";
import { stdLibZentinel } from "./std_lib/std_lib_zentinel";
import { superSubTransform } from "./equation_transformers/super_sub_transform/super_sub_transform";
import { groupTransformer } from "./equation_transformers/group_transformer/group_transform";
import { equationExpander } from "./input_transformers/equation_expander";
import { matrixTransformer } from "./matrix_transformer/matrix_transformer";

export const stdEquationTransformers: Zentinel<any>[] = [
  inPlaceSymbols,
  dotModifiers,
  parenthesisModifiers,
  functionTransformer,
  matrixTransformer,
  fractionTransformer,
  superSubTransform,
  groupTransformer,
  cashStack,
  stdLibZentinel,
];

export const stdInputTransformers: Zentinel<any>[] = [equationExpander];

export const stdZymbolTransformers: Zentinel<any>[] = [
  ...stdEquationTransformers,
  ...stdInputTransformers,
];
