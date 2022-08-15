import { Zym } from "../zym/zym";

export type TraitId = string;
export type MethodId = string;

export type ZyTraitSchema = {
  [key: string]: {
    args: any;
    return: any;
  };
};

export type CreateZyTraitSchema<Schema extends ZyTraitSchema> = Schema;

export type b = CreateZyTraitSchema<{
  help: {
    args: string;
    return: string;
  };
}>;

export type ZyTraitPointer<
  Schema extends ZyTraitSchema,
  Method extends keyof Schema
> = {
  id: string;
  method: Method;
};

export type ZyTrait<Schema extends ZyTraitSchema> = {
  [key in keyof Schema]: ZyTraitPointer<Schema, key>;
};

export function createZyTrait<Schema extends ZyTraitSchema>(
  traitId: TraitId,
  schema: { [key in keyof Schema]: MethodId }
): ZyTrait<Schema> {
  const trait: Partial<ZyTrait<Schema>> = {};

  const tester = /:/;

  if (tester.test(traitId)) {
    throw new Error(`Trait id ${traitId} must not contain ':'!!`);
  }
  for (const key in schema) {
    if (tester.test(schema[key])) {
      throw new Error(`Schema key ${schema[key]} must not contain ':'!!`);
    }

    trait[key] = { id: `${traitId}:${schema[key]}`, method: key };
  }

  return trait as ZyTrait<Schema>;
}

export type TraitMethodResponse<Return> =
  | { implemented: true; return: Return }
  | { implemented: false };

export function impl<R>(r: R): TraitMethodResponse<R> {
  return {
    implemented: true,
    return: r,
  };
}

export function unwrapTraitResponse<Return>(
  res: TraitMethodResponse<Return>
): Return {
  if (res.implemented) {
    return res.return;
  }

  throw new Error("Trait was not implemented!");
}

export const UNIMPLEMENTED: TraitMethodResponse<any> = { implemented: false };

export type TraitMethodImplementation<
  Schema extends ZyTraitSchema,
  Method extends keyof Schema
> = (
  zym: Zym,
  args: Schema[Method]["args"]
) => Promise<Schema[Method]["return"]>;

export type TraitImplementation<Schema extends ZyTraitSchema> = Partial<{
  [key in keyof Schema]: TraitMethodImplementation<Schema, key>;
}>;
