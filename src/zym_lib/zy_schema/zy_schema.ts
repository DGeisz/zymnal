export type ZyId = string;

export type ZySchema = {
  [key: string]: any;
};

export type CreateZySchema<Schema extends ZySchema> = Schema;

export type ZyPersistenceSchema<Schema extends ZySchema> = {
  [key in keyof Schema]:
    | string
    | {
        persistenceSymbol: string;
        persistenceType: any;
      };
};

export type ZyPersistedSchemaSymbols<
  Schema extends ZySchema,
  PSchema extends ZyPersistenceSchema<Schema>
> = {
  [key in keyof PSchema]: PSchema[key] extends { persistenceSymbol: string }
    ? PSchema[key]["persistenceSymbol"]
    : PSchema[key];
};

export type ZyPartialPersist<
  Schema extends ZySchema,
  PSchema extends ZyPersistenceSchema<Schema>
> = {
  [key in keyof Schema]: PSchema[key] extends { persistenceType: any }
    ? PSchema[key]["persistenceType"]
    : Schema[key];
};

export type ZyFullPersist<
  Schema extends ZySchema,
  PSchema extends ZyPersistenceSchema<Schema>
> = {
  [key: string]: ZyPartialPersist<Schema, PSchema>[keyof Schema];
};

export type CreatePersistenceSchema<
  Schema extends ZySchema,
  PSchema extends ZyPersistenceSchema<Schema>
> = PSchema;

export type IdentifiedSchema<Schema extends ZySchema> = {
  id: ZyId;
  schema: Schema;
};

export const ZYM_PERSIST_FIELDS: {
  MASTER_ID: "m";
  DATA: "d";
} = {
  MASTER_ID: "m",
  DATA: "d",
};

export interface ZymPersist<
  Schema extends ZySchema,
  PersistenceSchema extends ZyPersistenceSchema<Schema>
> {
  [ZYM_PERSIST_FIELDS.MASTER_ID]: ZyId;
  [ZYM_PERSIST_FIELDS.DATA]: ZyFullPersist<Schema, PersistenceSchema>;
}

export function zymPersist<
  Schema extends ZySchema,
  PersistenceSchema extends ZyPersistenceSchema<Schema>
>(
  masterId: ZyId,
  data: ZyFullPersist<Schema, PersistenceSchema>
): ZymPersist<Schema, PersistenceSchema> {
  return {
    [ZYM_PERSIST_FIELDS.MASTER_ID]: masterId,
    [ZYM_PERSIST_FIELDS.DATA]: data,
  };
}
