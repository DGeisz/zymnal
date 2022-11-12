import { defaultTraitImplementationFactory } from "../../zy_trait/default_trait_zentinel/default_trait_zentinel_schema";
import { isSome, NONE, ZyOption, zySome } from "../../utils/zy_option";
import {
  createZyTrait,
  CreateZyTraitSchema,
  unwrapTraitResponse,
} from "../../zy_trait/zy_trait";
import { Cursor, extendChildCursor, extractCursorInfo } from "./cursor";

/* ==== LOCAL COMMANDS ==== */

const CURSOR_COMMANDS_ID = "cursor-a7c53";

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

export enum VerticalNavigationHandleType {
  DomManaged,
  ZyManaged,
}

export type CursorCommandSchema = CreateZyTraitSchema<{
  /* Allows to get where the cursor should start */
  getInitialCursor: {
    args: undefined;
    return: ZyOption<Cursor>;
  };
  getEndCursor: {
    args: undefined;
    return: ZyOption<Cursor>;
  };
  /* Re-renders the tree on a cursor change */
  cursorRender: {
    args: CursorRenderArgs;
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
  checkVerticalNavigationType: {
    args: Cursor;
    return: VerticalNavigationHandleType;
  };
}>;

export const CursorCommandTrait = createZyTrait<CursorCommandSchema>(
  CURSOR_COMMANDS_ID,
  {
    getInitialCursor: "gic",
    getEndCursor: "gec",
    canHandleCursorBranchRender: "bcr",
    cursorRender: "cr",
    modifyNodeAndReRender: "mnr",
    checkVerticalNavigationType: "cvt",
  }
);

export const defaultCursorImplFactory = defaultTraitImplementationFactory(
  CursorCommandTrait,
  {
    checkVerticalNavigationType: async (zym, cursor) => {
      const { nextCursorIndex, parentOfCursorElement, childRelativeCursor } =
        extractCursorInfo(cursor);

      if (parentOfCursorElement) return VerticalNavigationHandleType.DomManaged;

      const child = zym.children[nextCursorIndex];

      if (child) {
        return unwrapTraitResponse(
          await child.callTraitMethod(
            CursorCommandTrait.checkVerticalNavigationType,
            childRelativeCursor
          )
        );
      }

      return VerticalNavigationHandleType.DomManaged;
    },
    getEndCursor: async (zym) => {
      for (let i = 0; i < zym.children.length; i++) {
        const index = zym.children.length - i - 1;

        const option = unwrapTraitResponse(
          await zym.children[index].callTraitMethod(
            CursorCommandTrait.getEndCursor,
            undefined
          )
        );

        if (isSome(option)) {
          return zySome(extendChildCursor(index, option.val));
        }
      }

      return NONE;
    },
    getInitialCursor: async (zym) => {
      for (let i = 0; i < zym.children.length; i++) {
        const option = unwrapTraitResponse(
          await zym.children[i].callTraitMethod(
            CursorCommandTrait.getInitialCursor,
            undefined
          )
        );

        if (isSome(option)) {
          return zySome(extendChildCursor(i, option.val));
        }
      }

      return NONE;
    },
    modifyNodeAndReRender: async (zym, args) => {
      const { cursor, renderOpts, updates } = args;

      const { nextCursorIndex, childRelativeCursor } =
        extractCursorInfo(cursor);

      if (nextCursorIndex === -1) {
        await zym.safeHydrateFromPartialPersist(updates);
        zym.render(renderOpts);
      } else {
        await zym.children[nextCursorIndex].callTraitMethod(
          CursorCommandTrait.modifyNodeAndReRender,
          {
            cursor: childRelativeCursor,
            renderOpts,
            updates,
          }
        );
      }
    },
    cursorRender: async (zym, args: CursorRenderArgs) => {
      const { oldCursor, newCursor } = args;

      zym.render();

      const canHandleChildren = await zym.callTraitMethod(
        CursorCommandTrait.canHandleCursorBranchRender,
        undefined
      );

      /* If the zym has indicated that it can handle all of it's children,
    then we don't recurse further */
      if (canHandleChildren.implemented && canHandleChildren.return) {
        return;
      }

      if (isSome(oldCursor) && isSome(newCursor)) {
        const {
          childRelativeCursor: oRel,
          nextCursorIndex: oI,
          parentOfCursorElement: oP,
        } = extractCursorInfo(oldCursor.val);

        const {
          childRelativeCursor: nRel,
          nextCursorIndex: nI,
          parentOfCursorElement: nP,
        } = extractCursorInfo(newCursor.val);

        if (oI === nI) {
          zym.children[oI].callTraitMethod(CursorCommandTrait.cursorRender, {
            newCursor: nP ? NONE : zySome(nRel),
            oldCursor: oP ? NONE : zySome(oRel),
          });
        } else {
          zym.children[oI].callTraitMethod(CursorCommandTrait.cursorRender, {
            newCursor: NONE,
            oldCursor: oP ? NONE : zySome(oRel),
          });

          zym.children[nI].callTraitMethod(CursorCommandTrait.cursorRender, {
            newCursor: nP ? NONE : zySome(nRel),
            oldCursor: NONE,
          });
        }
      } else if (isSome(oldCursor)) {
        const {
          childRelativeCursor: oRel,
          nextCursorIndex: oI,
          parentOfCursorElement: oP,
        } = extractCursorInfo(oldCursor.val);

        zym.children[oI].callTraitMethod(CursorCommandTrait.cursorRender, {
          newCursor: NONE,
          oldCursor: oP ? NONE : zySome(oRel),
        });
      } else if (isSome(newCursor)) {
        const {
          childRelativeCursor: nRel,
          nextCursorIndex: nI,
          parentOfCursorElement: nP,
        } = extractCursorInfo(newCursor.val);

        if (!zym.children[nI]) {
          debugger;
        }

        zym.children[nI].callTraitMethod(CursorCommandTrait.cursorRender, {
          newCursor: nP ? NONE : zySome(nRel),
          oldCursor: NONE,
        });
      }
    },
  }
);
