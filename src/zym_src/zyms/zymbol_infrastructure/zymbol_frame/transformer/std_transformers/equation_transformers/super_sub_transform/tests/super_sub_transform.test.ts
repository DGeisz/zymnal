import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { SuperSubZymbol } from "../../../../../../../zymbol/zymbols/super_sub/super_sub";
import { SuperSubStatus } from "../../../../../../../zymbol/zymbols/super_sub/super_sub_schema";
import { SymbolZymbol } from "../../../../../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { getZymbol } from "../../../transform_utils";
import superSubTestJson from "./super_sub_test.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

test("Super sub basic test", async () => {
  const superSubTestRecord = superSubTestJson as RecordedTestSequence;

  await checkRecordedTest(zyGod, superSubTestRecord, {
    0: async (cursor) => {
      const superSub = await getZymbol<SuperSubZymbol>(cursor, zyGod);
      const ss = superSub.persistData();

      expect(ss.status).toEqual(SuperSubStatus.OnlySub);
      expect(superSub.children.length).toEqual(1);

      const sym = (
        superSub.children[0].children[0] as SymbolZymbol
      ).persistData();

      expect(sym.texSymbol).toEqual("a");
    },
    1: async (cursor) => {
      const superSub = await getZymbol<SuperSubZymbol>(cursor, zyGod);
      const ss = superSub.persistData();

      expect(ss.status).toEqual(SuperSubStatus.OnlySuper);
      expect(superSub.children.length).toEqual(1);

      const sym = (
        superSub.children[0].children[0] as SymbolZymbol
      ).persistData();

      expect(sym.texSymbol).toEqual("a");
    },
    2: async (cursor) => {
      const superSub = await getZymbol<SuperSubZymbol>(cursor, zyGod);
      const ss = superSub.persistData();

      expect(ss.status).toEqual(SuperSubStatus.Both);
      expect(superSub.children.length).toEqual(2);

      const sym1 = (
        superSub.children[0].children[0] as SymbolZymbol
      ).persistData();

      const sym2 = (
        superSub.children[1].children[0] as SymbolZymbol
      ).persistData();

      expect(sym1.texSymbol).toEqual("a");
      expect(sym2.texSymbol).toEqual("b");
    },
    3: async (cursor) => {
      const superSub = await getZymbol<SuperSubZymbol>(cursor, zyGod);
      const ss = superSub.persistData();

      expect(ss.status).toEqual(SuperSubStatus.OnlySuper);
      expect(superSub.children.length).toEqual(1);

      const sym = (
        superSub.children[0].children[0] as SymbolZymbol
      ).persistData();

      expect(sym.texSymbol).toEqual("a");
    },
    4: async (cursor) => {
      const superSub = await getZymbol<SuperSubZymbol>(cursor, zyGod);
      const ss = superSub.persistData();

      expect(ss.status).toEqual(SuperSubStatus.OnlySub);
      expect(superSub.children.length).toEqual(1);

      const sym = (
        superSub.children[0].children[0] as SymbolZymbol
      ).persistData();

      expect(sym.texSymbol).toEqual("a");
    },
  });
});

export {};
