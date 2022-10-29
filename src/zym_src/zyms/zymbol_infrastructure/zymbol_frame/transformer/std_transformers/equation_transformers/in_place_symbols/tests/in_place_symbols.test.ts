import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { getSymbol } from "../../../transform_utils";
import alphaBetaJson from "./alpha_beta.json";
import intOverrideJson from "./int_override.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

it("Basic Alpha Beta", async () => {
  const basicAlphaBetaRecord = alphaBetaJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, basicAlphaBetaRecord, {
    // Checks full written out commands
    0: async (cursor) => {
      const alpha = (await getSymbol(cursor, zyGod)).persistData();
      expect(alpha.texSymbol).toEqual("\\alpha");
    },
    // Checks slash command
    1: async (cursor) => {
      const beta = (await getSymbol(cursor, zyGod)).persistData();
      expect(beta.texSymbol).toEqual("\\beta");
    },
    // Checks slash command
    2: async (cursor) => {
      const alpha = (await getSymbol(cursor, zyGod)).persistData();
      expect(alpha.texSymbol).toEqual("\\alpha");
    },
  });
});

it("Int override", async () => {
  /* Makes sure that when we type in "int" first it shows the "in" sign
  when we've only typed "in", and then afterwards when we hit "t" it shows 
  the integral sign */
  const intOverrideRecord = intOverrideJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, intOverrideRecord, {
    0: async (cursor) => {
      const inSym = (await getSymbol(cursor, zyGod)).persistData();
      expect(inSym.texSymbol).toEqual("\\in");
    },
    1: async (cursor) => {
      const intSym = (await getSymbol(cursor, zyGod)).persistData();
      expect(intSym.texSymbol).toEqual("\\int");
    },
  });
});

export {};
