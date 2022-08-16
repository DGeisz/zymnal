import { ZentinelMethodSchema } from "../hermes/hermes";
import { Zentinel } from "../zentinel/zentinel";
import {
  impl,
  TraitImplementation,
  TraitMethodImplementation,
  TraitMethodResponse,
  UNIMPLEMENTED,
  ZyTrait,
  ZyTraitPointer,
  ZyTraitSchema,
} from "../zy_trait/zy_trait";
import {
  ZyFullPersist,
  ZyPersistenceSchema,
  ZySchema,
} from "../zy_schema/zy_schema";
import { Zym } from "./zym";

export abstract class ZyMaster<
  Schema extends ZySchema,
  PersistenceSchema extends ZyPersistenceSchema<Schema>,
  MethodSchema extends ZentinelMethodSchema
> extends Zentinel<MethodSchema> {
  private traitMethodRegistry: Map<
    ZyTraitPointer<any, any>,
    TraitMethodImplementation<any, any>
  > = new Map();

  callTraitMethod = async <
    Schema extends ZyTraitSchema,
    Method extends keyof Schema
  >(
    zym: Zym<any, any>,
    pointer: ZyTraitPointer<Schema, Method>,
    args: Schema[Method]["args"]
  ): Promise<TraitMethodResponse<Schema[Method]["return"]>> => {
    const method: TraitMethodImplementation<Schema, Method> | undefined =
      this.traitMethodRegistry.get(pointer);

    if (method) {
      return impl(await method(zym, args));
    } else {
      return UNIMPLEMENTED;
    }
  };

  implementTrait = <Schema extends ZyTraitSchema>(
    trait: ZyTrait<Schema>,
    implementation: TraitImplementation<Schema>
  ) => {
    for (const key in implementation) {
      this.traitMethodRegistry.set(trait[key], implementation[key]!);
    }
  };

  abstract newBlankChild(): Zym<Schema, PersistenceSchema>;

  async hydrate(
    persistData: Partial<ZyFullPersist<Schema, PersistenceSchema>>
  ): Promise<Zym<Schema, PersistenceSchema>> {
    const newZym = this.newBlankChild();
    await newZym.hydrate(persistData);

    return newZym;
  }
}
