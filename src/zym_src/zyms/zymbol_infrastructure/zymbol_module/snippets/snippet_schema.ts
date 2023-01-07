import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { ZinputSchema } from "../../../basic_building_blocks/zinput/zinput_schema";
import { ZymbolFrameSchema } from "../../zymbol_frame/zymbol_frame_schema";

export const SNIPPET_ID = "snip";

export type SnippetSchema = CreateZySchema<
  {
    children: [
      IdentifiedBaseSchema<ZymbolFrameSchema>,
      IdentifiedBaseSchema<ZymbolFrameSchema>
    ];
  },
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: [
        ZymPersist<ZymbolFrameSchema>,
        ZymPersist<ZymbolFrameSchema>
      ];
    };
  }
>;
