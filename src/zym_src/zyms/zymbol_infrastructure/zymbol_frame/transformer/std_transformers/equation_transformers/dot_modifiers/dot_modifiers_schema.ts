import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../../../../../zym_lib/hermes/hermes";
import { GroupId } from "../../../../../../../../zym_lib/utils/types";
import { ZyOption } from "../../../../../../../../zym_lib/utils/zy_option";
import {
  createZyTrait,
  CreateZyTraitSchema,
} from "../../../../../../../../zym_lib/zy_trait/zy_trait";
import { Zymbol } from "../../../../../../zymbol/zymbol";

export const DOT_MODIFIERS_TRANSFORM = "dot-modifiers-e1125";

export interface IdentifiedDotModifierZymbolTransformers {
  id: GroupId;
  transform: DotModifierZymbolTransformer;
}

export type DotModifierZymbolTransformer = (s: {
  zymbol: Zymbol;
  word: string;
}) => ZyOption<Zymbol>;

export interface DotModifierZymbolTransform {
  id: {
    group: string;
    item: string | number;
  };
  transform: DotModifierZymbolTransformer;
  cost: number;
}

export interface DotModifierMap {
  id: {
    group: string;
    item: string | number;
  };
  map: { [key: string]: string };

  cost: number;
}

type DotModifiersTraitSchema = CreateZyTraitSchema<{
  getContextualTransforms: {
    args: undefined;
    return: DotModifierZymbolTransform;
  };
  getNodeTransforms: {
    args: undefined;
    return: DotModifierZymbolTransform;
  };
}>;

export const DotModifiersTrait = createZyTrait<DotModifiersTraitSchema>(
  DOT_MODIFIERS_TRANSFORM,
  {
    getContextualTransforms: "gct",
    getNodeTransforms: "gnt",
  }
);

export type DotModifiersMethodSchema = CreateZentinelMethodSchema<{
  addDotModifierTransform: {
    args: DotModifierZymbolTransform;
    return: void;
  };
  addDotMap: {
    args: DotModifierMap;
    return: void;
  };
}>;

export const DotModifiersMethod =
  createZentinelMethodList<DotModifiersMethodSchema>(DOT_MODIFIERS_TRANSFORM, {
    addDotModifierTransform: 0,
    addDotMap: 0,
  });
