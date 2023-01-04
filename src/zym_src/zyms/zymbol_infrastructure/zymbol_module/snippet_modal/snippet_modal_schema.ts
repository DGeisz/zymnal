import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";

export const SNIPPET_MODAL_ID = "snippet-modal";

export type SnippetModalSchema = CreateZySchema<
  {
    children: IdentifiedBaseSchema<any>;
  },
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<any>[];
    };
  }
>;
