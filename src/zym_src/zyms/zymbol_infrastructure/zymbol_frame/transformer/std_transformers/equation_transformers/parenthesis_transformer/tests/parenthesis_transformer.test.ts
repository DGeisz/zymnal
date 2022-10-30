import { basicKeyPress } from "../../../../../../../../../zym_lib/zy_god/event_handler/key_press";
import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { ParenthesisZymbol } from "../../../../../../../zymbol/zymbols/parenthesis_zymbol/parenthesis_zymbol";
import { getZymbol } from "../../../transform_utils";
import basicParenthesisCreationJson from "./basic_parenthesis_creation.json";
import endParenthesisCreatorJson from "./end_parenthesis_creator.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

test("Basic parenthesis creation", async () => {
  const basicParenthesisCreationRecord =
    basicParenthesisCreationJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, basicParenthesisCreationRecord, {
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

      expect(p.left).toEqual("\\lbrace");
      expect(p.right).toEqual("\\rbrace");
      expect(p.bigParenthesis).toEqual(false);
      expect(paren.children[0].children.length).toEqual(3);
    },
    3: async (cursor) => {
      const paren = await getZymbol<ParenthesisZymbol>(cursor, zyGod);
      const p = paren.persistData();

      expect(p.left).toEqual("\\lparen");
      expect(p.right).toEqual("\\rparen");
      expect(p.bigParenthesis).toEqual(true);
      expect(paren.children[0].children.length).toEqual(3);
    },
  });
});

test("End parenthesis creator", async () => {
  const endParenthesisCreatorRecord =
    endParenthesisCreatorJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, endParenthesisCreatorRecord, {
    0: async (cursor) => {
      const paren = await getZymbol<ParenthesisZymbol>(cursor, zyGod);
      const p = paren.persistData();

      expect(p.left).toEqual("\\lparen");
      expect(p.right).toEqual("\\rparen");
      expect(p.bigParenthesis).toEqual(true);

      expect(paren.children[0].children.length).toEqual(5);
    },

    1: async (cursor) => {
      const paren = await getZymbol<ParenthesisZymbol>(cursor, zyGod);
      const p = paren.persistData();

      expect(p.left).toEqual("\\lparen");
      expect(p.right).toEqual("\\rparen");
      expect(p.bigParenthesis).toEqual(true);

      expect(paren.children[0].children.length).toEqual(5);
    },

    2: async (cursor) => {
      const paren = await getZymbol<ParenthesisZymbol>(cursor, zyGod);
      const p = paren.persistData();

      expect(p.left).toEqual("\\lbrack");
      expect(p.right).toEqual("\\rbrack");
      expect(p.bigParenthesis).toEqual(true);

      expect(paren.children[0].children.length).toEqual(5);
    },
  });
});

export {};
