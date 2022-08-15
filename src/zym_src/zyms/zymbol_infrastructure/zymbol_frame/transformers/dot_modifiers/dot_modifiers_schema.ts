import {
  createZentinelMethodList,
  ZentinelMethodSchema,
} from "../../../../../../zym_lib/hermes/hermes";
import { DotModifierMap, DotModifierZymbolTransform } from "./dot_modifiers";

export const DOT_MODIFIERS_TRANSFORM = "dot-modifiers-e1125";

export interface DotModifiersMethodSchema extends ZentinelMethodSchema {
  addDotModifierTransform: {
    args: DotModifierZymbolTransform;
    return: void;
  };
  addDotMap: {
    args: DotModifierMap;
    return: void;
  };
}

export const DotModifiersMethod =
  createZentinelMethodList<DotModifiersMethodSchema>(DOT_MODIFIERS_TRANSFORM, {
    addDotModifierTransform: 0,
    addDotMap: 0,
  });
