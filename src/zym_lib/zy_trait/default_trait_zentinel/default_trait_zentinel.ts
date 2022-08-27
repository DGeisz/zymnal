import { Zentinel } from "../../zentinel/zentinel";
import { impl, TraitMethodImplementation, UNIMPLEMENTED } from "../zy_trait";
import {
  DefaultTraitZentinelSchema,
  DEFAULT_TRAIT_ZENTINEL,
} from "./default_trait_zentinel_schema";

class DefaultTraitZentinel extends Zentinel<DefaultTraitZentinelSchema> {
  zyId: string = DEFAULT_TRAIT_ZENTINEL;

  traitMethodRegistry: Map<string, TraitMethodImplementation<any, any>> =
    new Map();

  constructor() {
    super();

    this.setMethodImplementation({
      implementTrait: async ({ trait, implementation }) => {
        for (const key in implementation) {
          this.traitMethodRegistry.set(trait[key].id, implementation[key]!);
        }
      },
      callTraitMethod: async ({ zym, pointer, args }) => {
        const method: TraitMethodImplementation<any, any> | undefined =
          this.traitMethodRegistry.get(pointer.id);

        if (method) {
          return impl(await method(zym, args));
        } else {
          return UNIMPLEMENTED;
        }
      },
    });
  }
}

export const defaultTraitZentinel = new DefaultTraitZentinel();
