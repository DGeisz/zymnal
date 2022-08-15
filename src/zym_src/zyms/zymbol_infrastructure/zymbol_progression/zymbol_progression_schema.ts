import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
} from "../../../../zym_lib/zy_schema/zy_schema";

export type ZymbolProgressionSchema = CreateZySchema<{
  baseFrame: IdentifiedSchema<any>;
}>;

export type ZymbolProgressionPersistenceSchema = CreatePersistenceSchema<
  ZymbolProgressionSchema,
  {
    baseFrame: {
      persistenceSymbol: "b";
      persistenceType: any;
    };
  }
>;
