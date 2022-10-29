import { ZymbolModifier } from "../../../../../../zymbol/zymbols/zocket/zocket_schema";

export function createBasicModifier(word: string): ZymbolModifier {
  return {
    id: {
      group: "basic",
      item: word,
    },
    pre: `\\${word}{`,
    post: "}",
  };
}
