import { Zage } from "../../../zym_src/zyms/zage/zage";
import { ZYMBOL_FRAME_MASTER_ID } from "../../../zym_src/zyms/zymbol_infrastructure/zymbol_frame/zymbol_frame_schema";
import { ZyGod } from "../zy_god";
import { createTestGod } from "../zy_god_test";
import { getCursorToFirstZymId, getRemainingCursorAfterZymId } from "./cursor";

describe("basic cursor tests", () => {
  let zyGod: ZyGod;

  beforeEach(async () => {
    zyGod = await createTestGod();
    await zyGod.setRoot(new Zage(0, undefined));
  });

  it("gets remaining cursor after id", () => {
    // This assumes that we initialize with an input line
    const remainingCursor = getRemainingCursorAfterZymId(
      zyGod.__getRoot()!,
      zyGod.getCursorCopy(),
      ZYMBOL_FRAME_MASTER_ID
    );

    expect(remainingCursor).toEqual([0, 0]);
  });

  it("gets cursor to first zym id", () => {
    const initialCursor = getCursorToFirstZymId(
      zyGod.__getRoot()!,
      zyGod.getCursorCopy(),
      ZYMBOL_FRAME_MASTER_ID
    );

    expect(initialCursor).toEqual([0, 0, 0]);
  });
});

export {};
