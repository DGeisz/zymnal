import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../zym_lib/zy_god/zy_god_test";
import { getZymbol } from "../../../../zymbol_infrastructure/zymbol_frame/transformer/std_transformers/transform_utils";
import { ParenthesisZymbol } from "../parenthesis_zymbol";
import parenthesisDotModifierJson from "./parenthesis_dot_modifier.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

test("Parenthesis Dot Modifier", async () => {
  const parenthesisDotModifierRecord =
    parenthesisDotModifierJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, parenthesisDotModifierRecord, {
    0: async (cursor) => {
      const paren = await getZymbol<ParenthesisZymbol>(cursor, zyGod);
      const p = paren.persistData();

      expect(p.left).toEqual("\\lparen");
      expect(p.right).toEqual("\\rparen");
      expect(p.bigParenthesis).toEqual(false);

      expect(paren.children[0].children.length).toEqual(3);
    },

    1: async (cursor) => {
      const paren = await getZymbol<ParenthesisZymbol>(cursor, zyGod);
      const p = paren.persistData();

      expect(p.left).toEqual("\\lbrack");
      expect(p.right).toEqual("\\rbrack");
      expect(p.bigParenthesis).toEqual(false);

      expect(paren.children[0].children.length).toEqual(3);
    },

    2: async (cursor) => {
      const paren = await getZymbol<ParenthesisZymbol>(cursor, zyGod);
      const p = paren.persistData();

      expect(p.left).toEqual("\\lmoustache");
      expect(p.right).toEqual("\\rmoustache");
      expect(p.bigParenthesis).toEqual(false);

      expect(paren.children[0].children.length).toEqual(3);
    },
  });
});

export {};
