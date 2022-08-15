import {
  createZentinelMethodList,
  ZentinelMethodSchema,
} from "../../hermes/hermes";
import { Zentinel } from "../../zentinel/zentinel";
import { Zym } from "../../zym/zym";
import {
  TraitImplementation,
  TraitMethodImplementation,
  ZyTrait,
  ZyTraitPointer,
  ZyTraitSchema,
} from "../zy_trait";

export const DEFAULT_TRAIT_ZENTINEL = "default-trait";

export interface DefaultTraitZentinelSchema extends ZentinelMethodSchema {
  implementTrait: {
    args: {
      trait: ZyTrait<any>;
      implementation: Partial<{
        [key: string]: TraitMethodImplementation<any, any>;
      }>;
    };
    return: void;
  };
  callTraitMethod: {
    args: {
      zym: Zym;
      pointer: ZyTraitPointer<any, any>;
      args: any;
    };
    return: any;
  };
}

export const defaultTraitZentinelMethodList =
  createZentinelMethodList<DefaultTraitZentinelSchema>(DEFAULT_TRAIT_ZENTINEL, {
    implementTrait: 0,
    callTraitMethod: 0,
  });

export function defaultTraitImplementation<Schema extends ZyTraitSchema>(
  trait: ZyTrait<Schema>,
  /* We use this zentinel to hook into the zentinel network */
  zentinelPortal: Zentinel<any>,
  implementation: TraitImplementation<Schema>
) {
  zentinelPortal.callZentinelMethod(
    defaultTraitZentinelMethodList.implementTrait,
    {
      trait,
      implementation,
    }
  );
}

export function defaultTraitImplementationFactory<Schema extends ZyTraitSchema>(
  trait: ZyTrait<Schema>,
  implementation: TraitImplementation<Schema>
) {
  return (portal: Zentinel<any>) => {
    defaultTraitImplementation(trait, portal, implementation);
  };
}
