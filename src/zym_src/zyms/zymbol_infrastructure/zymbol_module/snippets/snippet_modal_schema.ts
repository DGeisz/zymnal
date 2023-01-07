import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { SnippetSchema } from "./snippet_schema";

export const SNIPPET_MODAL_ID = "snippet-modal";

export type SnippetModalSchema = CreateZySchema<
  {
    children: IdentifiedBaseSchema<SnippetSchema>[];
  },
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<SnippetSchema>[];
    };
  }
>;
