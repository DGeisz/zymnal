import {
  groupPathFactory,
  implementPartialCmdGroup,
  isSome,
  justPath,
  NONE,
  some,
  unwrap,
  ZyCommandGroup,
  ZyOption,
} from "../../zy_commands/zy_command_types";
import { Cursor, extendChildCursor, extractCursorInfo } from "./cursor";

/* ==== LOCAL COMMANDS ==== */

const CURSOR_COMMANDS_ID = "cursor-a7c53";

const lcc = groupPathFactory(CURSOR_COMMANDS_ID);

/* Get initial cursor */
export type GetInitialCursorReturn = ZyOption<Cursor>;

enum LocalCursorCommandsEnum {
  /* Allows to get where the cursor should start */
  getInitialCursor,
  /* During a cursor render, this indicates that we should block the cursor render
  here, and allow this zym to render the remainder of it's children */
  canHandleCursorBranchRender,
  /* Re-renders the portions of the tree that need to change after a cursor change */
  cursorRender,
}

export interface CursorRenderArgs {
  oldCursor: ZyOption<Cursor>;
  newCursor: ZyOption<Cursor>;
}

export type CursorCommandType = typeof LocalCursorCommandsEnum;

export const CursorCommand: ZyCommandGroup<CursorCommandType> = {
  getInitialCursor: justPath(lcc("gic")),
  canHandleCursorBranchRender: justPath(lcc("bcr")),
  cursorRender: justPath(lcc("cr")),
};

/* ==== DEFAULT IMPL ====  */
export const defaultCursorImpl = implementPartialCmdGroup(CursorCommand, {
  getInitialCursor: async (zym): Promise<ZyOption<Cursor>> => {
    for (let i = 0; i < zym.children.length; i++) {
      const option = unwrap<ZyOption<Cursor>>(
        await zym.children[i].cmd(CursorCommand.getInitialCursor)
      );

      if (isSome(option)) {
        return some(extendChildCursor(i, option.val));
      }
    }

    return NONE;
  },
  cursorRender: async (zym, args: CursorRenderArgs) => {
    const { oldCursor, newCursor } = args;

    zym.render();

    const canHandleChildren = await zym.cmd<boolean>(
      CursorCommand.canHandleCursorBranchRender
    );

    /* If the zym has indicated that it can handle all of it's children,
    then we don't recurse further */
    if (canHandleChildren.ok && canHandleChildren.val) {
      return;
    }

    if (isSome(oldCursor) && isSome(newCursor)) {
      const { childRelativeCursor: oRel, nextCursorIndex: oI } =
        extractCursorInfo(oldCursor.val);

      const { childRelativeCursor: nRel, nextCursorIndex: nI } =
        extractCursorInfo(newCursor.val);

      if (oI === nI) {
        zym.children[oI].cmd<any, CursorRenderArgs>(
          CursorCommand.cursorRender,
          {
            newCursor: some(nRel),
            oldCursor: some(oRel),
          }
        );
      } else {
        zym.children[oI].cmd<any, CursorRenderArgs>(
          CursorCommand.cursorRender,
          {
            newCursor: NONE,
            oldCursor: some(oRel),
          }
        );

        zym.children[nI].cmd<any, CursorRenderArgs>(
          CursorCommand.cursorRender,
          {
            newCursor: some(nRel),
            oldCursor: NONE,
          }
        );
      }
    } else if (isSome(oldCursor)) {
      const { childRelativeCursor: oRel, nextCursorIndex: oI } =
        extractCursorInfo(oldCursor.val);

      zym.children[oI].cmd<any, CursorRenderArgs>(CursorCommand.cursorRender, {
        newCursor: NONE,
        oldCursor: some(oRel),
      });
    } else if (isSome(newCursor)) {
      const { childRelativeCursor: nRel, nextCursorIndex: nI } =
        extractCursorInfo(newCursor.val);

      zym.children[nI].cmd<any, CursorRenderArgs>(CursorCommand.cursorRender, {
        newCursor: some(nRel),
        oldCursor: NONE,
      });
    }
  },
});
