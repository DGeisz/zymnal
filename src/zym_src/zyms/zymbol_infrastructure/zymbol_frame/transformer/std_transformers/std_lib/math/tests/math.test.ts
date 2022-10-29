import { Cursor } from "../../../../../../../../../zym_lib/zy_god/cursor/cursor";
import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { SymbolZymbol } from "../../../../../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { getFunction } from "../../../transform_utils";
import sqrtJson from "./sqrt.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

it("Creates and modifies the sqrt function", async () => {
  const sqrtRecord = sqrtJson as RecordedTestSequence;

  const basicCheck = async (cursor: Cursor) => {
    const sqrt = await getFunction(cursor, zyGod);
    const sqData = sqrt.persistData();

    expect(sqData.baseTex).toEqual("sqrt");
    expect(Object.keys(sqData.bracketZockets).length).toEqual(0);
    expect(sqData.numZockets).toEqual(1);
    expect(sqrt.children.length).toEqual(1);

    const aSym = (sqrt.children[0].children[0] as SymbolZymbol).persistData();

    expect(aSym.texSymbol).toEqual("a");
  };

  await checkRecordedTest(zyGod, sqrtRecord, {
    0: basicCheck,
    1: async (cursor: Cursor) => {
      const sqrt = await getFunction(cursor, zyGod);
      const sqData = sqrt.persistData();

      expect(Object.keys(sqData.bracketZockets).length).toEqual(1);
      expect(sqData.numZockets).toEqual(2);
      expect(sqrt.children.length).toEqual(2);

      const threeSym = (
        sqrt.children[0].children[0] as SymbolZymbol
      ).persistData();
      expect(threeSym.texSymbol).toEqual("3");

      const aSym = (sqrt.children[1].children[0] as SymbolZymbol).persistData();
      expect(aSym.texSymbol).toEqual("a");
    },
    2: basicCheck,
  });
});
