import {
  CreateZySchema,
  zyIdentifierFactory,
} from "../../../../../zym_lib/zy_schema/zy_schema";

export const SNIPPET_PLACEHOLDER_ID = "snip-place-id";

export type SnippetPlaceholderSchema = CreateZySchema<
  {
    label: number;
  },
  {
    label: "l";
  }
>;
