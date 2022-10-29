import {
  checkRecordedTest,
  RecordedTestSequence,
} from "../../../../../../../../../zym_lib/zy_god/testing/basic_testing";
import { ZyGod } from "../../../../../../../../../zym_lib/zy_god/zy_god";
import { createTestGod } from "../../../../../../../../../zym_lib/zy_god/zy_god_test";
import { getFunction } from "../../../transform_utils";
import basicKetJson from "./basic_ket.json";

let zyGod: ZyGod;

beforeEach(async () => {
  zyGod = await createTestGod(true);
});

it("Creates a basic ket", async () => {
  const basicKetRecord = basicKetJson as RecordedTestSequence;
  const finalCursor = await checkRecordedTest(zyGod, basicKetRecord);

  const ket = (await getFunction(finalCursor, zyGod)).persistData();

  expect(ket.baseTex).toEqual("ket");
  expect(ket.numZockets).toEqual(1);
});
