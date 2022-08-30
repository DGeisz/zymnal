import {
  CreatePersistenceSchema,
  CreateZySchema,
} from "../../../../../../zym_lib/zy_schema/zy_schema";

export const DERIVATION_ID = "derivation";

export type DerivationSchema = CreateZySchema<{}>;

export type DerivationPersistenceSchema = CreatePersistenceSchema<
  DerivationSchema,
  {}
>;
