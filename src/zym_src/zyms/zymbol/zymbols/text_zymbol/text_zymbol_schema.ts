import {
  CreatePersistenceSchema,
  CreateZySchema,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import type { Zymbol } from "../../zymbol";
import type { TextZymbol } from "./text_zymbol";

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

export function isTextZymbol(zymbol: Zymbol): zymbol is TextZymbol {
  return zymbol.getMasterId() === TEXT_ZYMBOL_NAME;
}
