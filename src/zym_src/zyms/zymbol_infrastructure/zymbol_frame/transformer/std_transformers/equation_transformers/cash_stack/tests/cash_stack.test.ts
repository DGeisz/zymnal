import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { StackZymbol } from "../../../../../../../zymbol/zymbols/stack_zymbol/stack_zymbol";
import { SymbolZymbol } from "../../../../../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { getZymbol } from "../../../transform_utils";
import basicStackJson from "./basic_stack.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

test("Basic stack", async () => {
  const basicStackRecord = basicStackJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, basicStackRecord, {
    0: async (cursor) => {
      const stack = await getZymbol<StackZymbol>(cursor, zyGod);
      const stackD = stack.persistData();

      expect(stackD.operator).toEqual("binom");
      expect(stack.children.length).toEqual(2);
      expect(stack.children[0].children.length).toEqual(0);
      expect(stack.children[1].children.length).toEqual(0);
    },
    1: async (cursor) => {
      const stack = await getZymbol<StackZymbol>(cursor, zyGod);
      const stackD = stack.persistData();

      expect(stackD.operator).toEqual("binom");
      expect(stack.children.length).toEqual(2);

      const sym1 = (
        stack.children[0].children[0] as SymbolZymbol
      ).persistData();
      const sym2 = (
        stack.children[1].children[0] as SymbolZymbol
      ).persistData();

      expect(sym1.texSymbol).toEqual("a");
      expect(sym2.texSymbol).toEqual("b");
    },
    2: async (cursor) => {
      const stack = await getZymbol<StackZymbol>(cursor, zyGod);
      const stackD = stack.persistData();

      expect(stackD.operator).toEqual("frac");
      expect(stack.children.length).toEqual(2);

      const sym1 = (
        stack.children[0].children[0] as SymbolZymbol
      ).persistData();
      const sym2 = (
        stack.children[1].children[0] as SymbolZymbol
      ).persistData();

      expect(sym1.texSymbol).toEqual("\\aleph");
      expect(sym2.texSymbol).toEqual("\\beta");
    },
  });
});

export {};
