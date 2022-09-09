import { Zym } from "../../../../../../zym_lib/zym/zym";
import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../../zym_lib/zy_schema/zy_schema";
import {
  ZymbolFramePersistedSchema,
  ZymbolFrameSchema,
} from "../../../zymbol_frame/zymbol_frame_schema";
import { InlineInput } from "./inline_input";

export const INLINE_INPUT_ID = "inline-in";

export type InlineInputSchema = CreateZySchema<{
  inputFrame: IdentifiedSchema<ZymbolFrameSchema>;
}>;

export type InlineInputPersistenceSchema = CreatePersistenceSchema<
  InlineInputSchema,
  {
    inputFrame: {
      persistenceSymbol: "f";
      persistenceType: ZymPersist<
        ZymbolFrameSchema,
        ZymbolFramePersistedSchema
      >;
    };
  }
>;

export function isInlineInput(zym: Zym): zym is InlineInput {
  return zym.getMasterId() === INLINE_INPUT_ID;
}
