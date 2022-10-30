import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { SymbolZymbol } from "../../../../../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { Zocket } from "../../../../../../../zymbol/zymbols/zocket/zocket";
import { ZOCKET_MASTER_ID } from "../../../../../../../zymbol/zymbols/zocket/zocket_schema";
import { getZymbol } from "../../../transform_utils";
import inputStartStandaloneJson from "./input_start_standalone.json";
import midlineStandaloneJson from "./mid_line_standalone.json";
import extendedGroupJson from "./extended_group.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

test("Input start standalone", async () => {
  const inputStartStandaloneRecord =
    inputStartStandaloneJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, inputStartStandaloneRecord, {
    0: async (cursor) => {
      const groupZocket = await getZymbol<Zocket>(cursor, zyGod);

      expect(groupZocket.getMasterId()).toEqual(ZOCKET_MASTER_ID);
      expect(groupZocket.children.length).toEqual(0);
    },
    1: async (cursor) => {
      const groupZocket = await getZymbol<Zocket>(cursor, zyGod);

      expect(groupZocket.getMasterId()).toEqual(ZOCKET_MASTER_ID);
      expect(groupZocket.children.length).toEqual(1);

      const sym = (groupZocket.children[0] as SymbolZymbol).persistData();

      expect(sym.texSymbol).toEqual("a");
    },
  });
});

/* We create an empty group in the middle of an existing zocket */
test("Mid Line Standalone", async () => {
  const midlineStandaloneRecord = midlineStandaloneJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, midlineStandaloneRecord, {
    0: async (cursor) => {
      const groupZocket = await getZymbol<Zocket>(cursor, zyGod);

      expect(groupZocket.getMasterId()).toEqual(ZOCKET_MASTER_ID);
      expect(groupZocket.children.length).toEqual(0);
    },
  });
});

test("Extended Group Json", async () => {
  const extendedGroupRecord = extendedGroupJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, extendedGroupRecord, {
    0: async (cursor) => {
      const groupZocket = await getZymbol<Zocket>(cursor, zyGod);

      expect(groupZocket.getMasterId()).toEqual(ZOCKET_MASTER_ID);
      expect(groupZocket.children.length).toEqual(5);
    },
  });
});

export {};
