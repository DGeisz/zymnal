import {
  groupPathFactory,
  implementPartialCmdGroup,
  isSome,
  justPath,
  NONE,
  some,
  unwrap,
  ZyCommandGroup,
  ZyCommandGroupType,
  ZyOption,
} from "../../zy_trait/zy_command_types";
import { addZymChangeLink } from "../undo_redo/undo_redo";
import { Cursor, extendChildCursor, extractCursorInfo } from "./cursor";

/* ==== LOCAL COMMANDS ==== */

const CURSOR_COMMANDS_ID = "cursor-a7c53";
const lcc = groupPathFactory(CURSOR_COMMANDS_ID);

/* Get initial cursor */
export type GetInitialCursorReturn = ZyOption<Cursor>;

export interface CursorRenderArgs {
  oldCursor: ZyOption<Cursor>;
  newCursor: ZyOption<Cursor>;
}

export interface ModifyNodeAndReRenderArgs {
  cursor: Cursor;
  /* This should be Partial<PERSISTED_TYPE> (from undo-redo) */
  updates: any;
  renderOpts: any;
}

export interface CursorCommandType extends ZyCommandGroupType {
  /* Allows to get where the cursor should start */
  getInitialCursor: {
    args: undefined;
    return: ZyOption<Cursor>;
  };
  /* Re-renders the tree on a cursor change */
  cursorRender: {
    args: CursorRenderArgs;
    return: void;
  };
  /* Renders just the node from a cursor render */
  renderNode: {
    args: undefined;
    return: void;
  };
  /* Re-renders a tree node without the cursor (for undo-redo) */
  modifyNodeAndReRender: {
    args: ModifyNodeAndReRenderArgs;
    return: void;
  };
  /* Re-renders the portions of the tree that need to change after a cursor change */
  canHandleCursorBranchRender: {
    args: undefined;
    return: boolean;
  };
}

export const CursorCommand: ZyCommandGroup<CursorCommandType> = {
  getInitialCursor: justPath(lcc("gic")),
  canHandleCursorBranchRender: justPath(lcc("bcr")),
  cursorRender: justPath(lcc("cr")),
  modifyNodeAndReRender: justPath(lcc("mnr")),
  renderNode: justPath(lcc("rn")),
};

/* ==== DEFAULT IMPL ====  */
export const defaultCursorImpl = implementPartialCmdGroup(CursorCommand, {
  getInitialCursor: async (zym) => {
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
  modifyNodeAndReRender: async (zym, args) => {
    const { cursor, renderOpts, updates } = args;

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    if (nextCursorIndex === -1) {
      await zym.hydrate(updates);
      zym.render(renderOpts);
    } else {
      await zym.children[nextCursorIndex].cmd<any, ModifyNodeAndReRenderArgs>(
        CursorCommand.modifyNodeAndReRender,
        {
          cursor: childRelativeCursor,
          renderOpts,
          updates,
        }
      );
    }
  },
  renderNode: async (zym) => {
    zym.render();
  },
  cursorRender: async (zym, args: CursorRenderArgs) => {
    const { oldCursor, newCursor } = args;

    await zym.cmd(CursorCommand.renderNode);

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
