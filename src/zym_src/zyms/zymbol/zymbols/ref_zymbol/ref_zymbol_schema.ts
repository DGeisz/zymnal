import { Cursor } from "../../../../../zym_lib/zy_god/cursor/cursor";
import { CreateZySchema } from "../../../../../zym_lib/zy_schema/zy_schema";

export const REF_ZYMBOL_ID = "ref-zymbol";

export type RefZymbolSchema = CreateZySchema<
  {
    /* This is a relative cursor from the base zocket */
    zymbolRef: Cursor;
  },
  {
    zymbolRef: "z";
  }
>;
