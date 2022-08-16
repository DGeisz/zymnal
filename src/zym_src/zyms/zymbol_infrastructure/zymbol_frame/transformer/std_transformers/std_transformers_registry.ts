import { Zentinel } from "../../../../../../zym_lib/zentinel/zentinel";
import { cashStack } from "./cash_stack";
import { dotModifiers } from "./dot_modifiers/dot_modifiers";
import { fractionTransformer } from "./fraction_transform";
import { functionTransformer } from "../function_transformer.ts/function_transformer";
import { inPlaceSymbols } from "./in_place_symbols/in_place_symbols";
import { parenthesisModifiers } from "./parenthesis_transform";
import { stdLibZentinel } from "./std_lib/std_lib_zentinel";
import { superSubTransform } from "./super_sub_transform";

export const stdZymbolTransformers: Zentinel<any>[] = [
  inPlaceSymbols,
  dotModifiers,
  parenthesisModifiers,
  functionTransformer,
  fractionTransformer,
  superSubTransform,
  cashStack,
  stdLibZentinel,
];
