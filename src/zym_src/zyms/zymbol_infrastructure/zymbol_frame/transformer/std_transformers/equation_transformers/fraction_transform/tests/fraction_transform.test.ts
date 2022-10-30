import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { StackZymbol } from "../../../../../../../zymbol/zymbols/stack_zymbol/stack_zymbol";
import { SymbolZymbol } from "../../../../../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { getZymbol } from "../../../transform_utils";
import basicFractionJson from "./basic_fraction.json";
import standaloneFractionJson from "./standalone_fraction.json";
import extendedFractionJson from "./extended_fraction.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

test("Basic Fraction", async () => {
  const basicFractionRecord = basicFractionJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, basicFractionRecord, {
    0: async (cursor) => {
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

      expect(sym1.texSymbol).toEqual("b");
      expect(sym2.texSymbol).toEqual("2");
    },
  });
});

test("Standalone Fraction", async () => {
  const standaloneFractionRecord =
    standaloneFractionJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, standaloneFractionRecord, {
    0: async (cursor) => {
      const stack = await getZymbol<StackZymbol>(cursor, zyGod);
      const stackD = stack.persistData();

      expect(stackD.operator).toEqual("frac");
      expect(stack.children.length).toEqual(2);
      expect(stack.children[0].children.length).toEqual(0);
      expect(stack.children[1].children.length).toEqual(0);
    },
  });
});

test("Extended Fraction", async () => {
  const extendedFractionRecord = extendedFractionJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, extendedFractionRecord, {
    0: async (cursor) => {
      const stack = await getZymbol<StackZymbol>(cursor, zyGod);
      const stackD = stack.persistData();

      expect(stackD.operator).toEqual("frac");
      expect(stack.children.length).toEqual(2);
      expect(stack.children[0].children.length).toEqual(7);
      expect(stack.children[1].children.length).toEqual(0);
    },
  });
});

export {};
