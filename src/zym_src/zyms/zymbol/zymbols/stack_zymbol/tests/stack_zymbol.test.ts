import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../zym_lib/zy_god/zy_god_test";
import { getZymbol } from "../../../../zymbol_infrastructure/zymbol_frame/transformer/std_transformers/transform_utils";
import { SymbolZymbol } from "../../symbol_zymbol/symbol_zymbol";
import { StackZymbol } from "../stack_zymbol";
import stackDotModJson from "./stack_dot_mod.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

test("Stack Dot Modifier", async () => {
  const stackDotModRecord = stackDotModJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, stackDotModRecord, {
    0: async (cursor) => {
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
    1: async (cursor) => {
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

      expect(sym1.texSymbol).toEqual("a");
      expect(sym2.texSymbol).toEqual("b");
    },
    2: async (cursor) => {
      const stack = await getZymbol<StackZymbol>(cursor, zyGod);
      const stackD = stack.persistData();

      expect(stackD.operator).toEqual("tfrac");
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
  });
});

export {};
