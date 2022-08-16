import {
  CreatePersistenceSchema,
  CreateZySchema,
} from "../../../../../zym_lib/zy_schema/zy_schema";

export const TEXT_ZYMBOL_NAME = "text";

export type TextZymbolSchema = CreateZySchema<{
  characters: string[];
}>;

export type TextZymbolPersistenceSchema = CreatePersistenceSchema<
  TextZymbolSchema,
  {
    characters: "c";
  }
>;
