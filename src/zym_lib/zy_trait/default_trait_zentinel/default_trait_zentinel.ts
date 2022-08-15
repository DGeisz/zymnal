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

    const self = this;

    this.setMethodImplementation({
      async implementTrait({ trait, implementation }) {
        for (const key in implementation) {
          self.traitMethodRegistry.set(trait[key].id, implementation[key]!);
        }
      },
      async callTraitMethod({ zym, pointer, args }) {
        const method: TraitMethodImplementation<any, any> | undefined =
          self.traitMethodRegistry.get(pointer.id);

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
