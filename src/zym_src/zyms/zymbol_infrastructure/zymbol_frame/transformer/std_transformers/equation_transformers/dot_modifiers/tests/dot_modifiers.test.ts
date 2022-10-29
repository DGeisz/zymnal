import { unwrapOption } from "../../../../../../../../../zym_lib/utils/zy_option";
import { Cursor } from "../../../../../../../../../zym_lib/zy_god/cursor/cursor";
import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { createBasicModifier } from "../dot_mod_utils";
import basicVecJson from "./basic_vec.json";
import toggleVecJson from "./toggle_vec.json";
import multiModJson from "./multi_mod.json";
import multiModToggleJson from "./multi_mod_toggle.json";
import { getSymbol } from "../../../transform_utils";

describe("Basic Suite", () => {
  let zyGod: ZyGod;

  beforeEach(async () => {
    zyGod = await createTestGod(true);
  });

  it("Creates a basic vec", async () => {
    const basicVecRecord = basicVecJson as RecordedTestSequence;

    const finalCursor = await checkRecordedTest(zyGod, basicVecRecord);

    const symbol = await getSymbol(finalCursor, zyGod);

    const persistedData = symbol.persistData();

    expect(persistedData.texSymbol).toEqual("b");
    expect(persistedData.modifiers.length).toEqual(1);
    expect(persistedData.modifiers[0]).toEqual(createBasicModifier("vec"));
  });

  it("Properly toggles", async () => {
    const toggleVecRecord = toggleVecJson as RecordedTestSequence;

    await checkRecordedTest(zyGod, toggleVecRecord, {
      0: async (cursor) => {
        const symbol = await getSymbol(cursor, zyGod);
        const pData = symbol.persistData();

        expect(pData.texSymbol).toEqual("b");
        expect(pData.modifiers.length).toEqual(0);
      },
      1: async (cursor) => {
        const symbol = await getSymbol(cursor, zyGod);
        const pData = symbol.persistData();

        expect(pData.texSymbol).toEqual("b");
        expect(pData.modifiers.length).toEqual(1);
        expect(pData.modifiers[0]).toEqual(createBasicModifier("dot"));
      },
      2: async (cursor) => {
        const symbol = await getSymbol(cursor, zyGod);
        const pData = symbol.persistData();

        expect(pData.texSymbol).toEqual("b");
        expect(pData.modifiers.length).toEqual(0);
      },
    });
  });

  it("Handles multiple mods", async () => {
    const multiModRecord = multiModJson as RecordedTestSequence;

    const finalCursor = await checkRecordedTest(zyGod, multiModRecord);
    const symbol = await getSymbol(finalCursor, zyGod);
    const persistedData = symbol.persistData();

    expect(persistedData.texSymbol).toEqual("b");
    expect(persistedData.modifiers.length).toEqual(2);
    expect(persistedData.modifiers).toEqual([
      createBasicModifier("dot"),
      createBasicModifier("vec"),
    ]);
  });

  it("Handles multi mod toggle", async () => {
    const multiModToggleRecord = multiModToggleJson as RecordedTestSequence;

    await checkRecordedTest(zyGod, multiModToggleRecord, {
      0: async (cursor) => {
        const symbol = await getSymbol(cursor, zyGod);
        const pData = symbol.persistData();

        expect(pData.texSymbol).toEqual("b");
        expect(pData.modifiers.length).toEqual(0);
      },
      1: async (cursor) => {
        const symbol = await getSymbol(cursor, zyGod);
        const pData = symbol.persistData();

        expect(pData.texSymbol).toEqual("b");
        expect(pData.modifiers.length).toEqual(1);
        expect(pData.modifiers[0]).toEqual(createBasicModifier("dot"));
      },
      2: async (cursor) => {
        const symbol = await getSymbol(cursor, zyGod);
        const pData = symbol.persistData();

        expect(pData.texSymbol).toEqual("b");
        expect(pData.modifiers).toEqual([
          createBasicModifier("dot"),
          createBasicModifier("vec"),
        ]);
      },
      3: async (cursor) => {
        const symbol = await getSymbol(cursor, zyGod);
        const pData = symbol.persistData();

        expect(pData.texSymbol).toEqual("b");
        expect(pData.modifiers.length).toEqual(1);
        expect(pData.modifiers[0]).toEqual(createBasicModifier("vec"));
      },
    });
  });
});

export {};
