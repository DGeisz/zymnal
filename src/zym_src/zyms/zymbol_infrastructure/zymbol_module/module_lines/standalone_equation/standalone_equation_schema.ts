import {
  CreatePersistenceSchema,
  CreateZySchema,
} from "../../../../../../zym_lib/zy_schema/zy_schema";

export const STANDALONE_EQ_ID = "standalone-eq";

export type StandaloneEqSchema = CreateZySchema<{}>;
export type StandalonePersistenceSchema = CreatePersistenceSchema<
  StandaloneEqSchema,
  {}
>;
