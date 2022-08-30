import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../../zym_lib/zy_schema/zy_schema";
import {
  ZinputPersistenceSchema,
  ZinputSchema,
} from "../../../../basic_building_blocks/zinput/zinput_schema";

export const STANDARD_INPUT_ID = "standard-in";

export type StandardInputSchema = CreateZySchema<{
  zinput: IdentifiedSchema<ZinputSchema>;
}>;

export type StandardInputPersistenceSchema = CreatePersistenceSchema<
  StandardInputSchema,
  {
    zinput: {
      persistenceSymbol: "z";
      persistenceType: ZymPersist<ZinputSchema, ZinputPersistenceSchema>;
    };
  }
>;
