import _ from "underscore";
import { ZYMBOL_FRAME_MASTER_ID } from "../../../zym_src/zyms/zymbol_infrastructure/zymbol_frame/zymbol_frame_schema";
import { Cursor, getCursorToFirstZymId } from "../cursor/cursor";
import { ZymKeyPress } from "../event_handler/key_press";
import { ZyGod } from "../zy_god";

export enum TestRecordedActionType {
  key = "key",
  checkpoint = "checkpoint",
}

export type TestRecordedAction =
  | { type: TestRecordedActionType.key; keyPress: ZymKeyPress }
  | { type: TestRecordedActionType.checkpoint; cursor: Cursor };

export interface RecordedTestSequence {
  testActions: TestRecordedAction[];
  finalFrameCursor: Cursor;
}

export type CheckPointTester = (fullCursor: Cursor) => Promise<void>;

export async function checkRecordedTest(
  zyGod: ZyGod,
  record: RecordedTestSequence,
  /* Check point tester map is zero indexed */
  checkPointTesterMap?: Record<number, CheckPointTester>
): Promise<Cursor> {
  let checkpointCount = -1;

  for (const action of record.testActions) {
    switch (action.type) {
      case TestRecordedActionType.key: {
        await zyGod.handleKeyPress(action.keyPress);
        break;
      }
      case TestRecordedActionType.checkpoint: {
        checkpointCount++;

        const frameCursor = getCursorToFirstZymId(
          zyGod.__getRoot()!,
          zyGod.getCursorCopy(),
          ZYMBOL_FRAME_MASTER_ID
        );
        const fullCursor = [...frameCursor, ...action.cursor];

        expect(zyGod.getCursorCopy()).toEqual(fullCursor);

        if (checkPointTesterMap && checkpointCount in checkPointTesterMap) {
          const tester = checkPointTesterMap[checkpointCount];

          await tester!(fullCursor);
        }

        break;
      }
    }
  }

  /* Make sure we don't have more checkpoint tests than there were checkpoints */
  if (checkPointTesterMap) {
    const largestCheck = parseInt(
      _.max(Object.keys(checkPointTesterMap)) as string
    );

    if (largestCheck > checkpointCount) {
      throw new Error("More checkpoint tests than there were checkpoints!");
    }
  }

  const frameCursor = getCursorToFirstZymId(
    zyGod.__getRoot()!,
    zyGod.getCursorCopy(),
    ZYMBOL_FRAME_MASTER_ID
  );

  return [...frameCursor, ...record.finalFrameCursor];
}
