import { Zym } from "../zym/zym";

export type ZyId = string;

export type ZyBaseSchema = {
  [key: string]: any;
};

// export type CreateZyBaseSchema<Schema extends ZyBaseSchema> = Schema;

export type ZyPersistenceSchema<Schema extends ZyBaseSchema> = {
  [key in keyof Schema]:
    | string
    | {
        persistenceSymbol: string;
        persistenceType: any;
      };
};

export type ZySchema<
  BSchema extends ZyBaseSchema,
  PSchema extends ZyPersistenceSchema<BSchema>
> = {
  base: BSchema;
  persistence: PSchema;
};

export type CreateZySchema<
  Schema extends ZyBaseSchema,
  PSchema extends ZyPersistenceSchema<Schema>
> = ZySchema<Schema, PSchema>;

export type ZyPersistedSchemaSymbols<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> = {
  [key in keyof PSchema]: PSchema[key] extends { persistenceSymbol: string }
    ? PSchema[key]["persistenceSymbol"]
    : PSchema[key];
};

export type ZyPartialPersist<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> = {
  [key in keyof BSchema]: PSchema[key] extends { persistenceType: any }
    ? PSchema[key]["persistenceType"]
    : BSchema[key];
};

export type ZyFullPersist<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> = {
  [key: string]: ZyPartialPersist<Schema>[keyof BSchema];
};

export type IdentifiedBaseSchema<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> = {
  id: ZyId;
  schema: BSchema;
};

export const ZYM_PERSIST_FIELDS: {
  MASTER_ID: "m";
  DATA: "d";
} = {
  MASTER_ID: "m",
  DATA: "d",
};

export interface ZymPersist<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> {
  [ZYM_PERSIST_FIELDS.MASTER_ID]: ZyId;
  [ZYM_PERSIST_FIELDS.DATA]: ZyFullPersist<Schema>;
}

export function zymPersist<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
>(masterId: ZyId, data: ZyFullPersist<Schema>): ZymPersist<Schema> {
  return {
    [ZYM_PERSIST_FIELDS.MASTER_ID]: masterId,
    [ZYM_PERSIST_FIELDS.DATA]: data,
  };
}

export function zyIdentifierFactory<Z extends Zym>(
  id: ZyId
): (zym: Zym) => zym is Z {
  return (z): z is Z => z.getMasterId() === id;
}
