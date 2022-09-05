import { last } from "../../../../../../../global_utils/array_utils";
import { Zentinel } from "../../../../../../../zym_lib/zentinel/zentinel";
import { Cursor } from "../../../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  ZymKeyPress,
} from "../../../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zocket } from "../../../../../zymbol/zymbols/zocket/zocket";
import { ZymbolFrame } from "../../../zymbol_frame";
import { ZymbolFrameMethod } from "../../../zymbol_frame_schema";
import {
  ZymbolTransformRank,
  ZymbolTreeTransformation,
  ZymbolTreeTransformationPriority,
} from "../../transformer";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../std_transformer_type_filters";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "../transform_utils";

const GROUP_DELIM = "@@";

export const GROUP_TRANSFORM = "group-trans-7d64b";

class CustomGroupTransformation extends ZymbolTreeTransformation {
  baseRoot: Zocket;
  rootCopy: Zocket;
  startIndex: number;
  maxIndex: number;
  initialCursor: Cursor;

  changedIndex = true;

  memo?: { newTreeRoot: Zocket; cursor: Cursor };

  constructor(baseRoot: Zocket, initialCursor: Cursor, startIndex: number) {
    super();
    this.startIndex = startIndex;
    this.baseRoot = baseRoot;
    this.initialCursor = initialCursor;
    this.rootCopy = baseRoot;
    this.maxIndex = last(initialCursor, 2) - 1;
    this.makeCopy();
  }

  handleKeyPress = (keyPress: ZymKeyPress): boolean => {
    switch (keyPress.type) {
      case KeyPressBasicType.ArrowLeft: {
        if (this.startIndex > 0) {
          this.startIndex--;
          this.changedIndex = true;
        }

        return true;
      }
      case KeyPressBasicType.ArrowRight: {
        if (this.startIndex < this.maxIndex) {
          this.startIndex++;
          this.changedIndex = true;
        }

        return true;
      }
    }

    return false;
  };

  /* This is sketchy (we should technically await on this to ensure we have enough time for copies...) */
  private makeCopy = async () => {
    this.baseRoot = this.rootCopy;
    this.rootCopy = (
      await this.baseRoot.clone(1, this.baseRoot.parent)
    )[0] as Zocket;
    this.rootCopy.setParentFrame(this.baseRoot.parentFrame);
  };

  init = this.makeCopy;

  priority: ZymbolTreeTransformationPriority = {
    rank: ZymbolTransformRank.Suggest,
    cost: 150,
  };

  getCurrentTransformation(): { newTreeRoot: Zocket; cursor: Cursor } {
    if (!this.changedIndex && this.memo) return this.memo;

    const rootCopy = this.baseRoot;

    /* Make a copy for the next run */
    this.makeCopy();

    const cursor = this.initialCursor;
    const zymbolIndex = last(cursor, 2);

    /* Handle the parenthesis that groups by operators */
    const cursorCopy = [...cursor];
    const transformText = getTransformTextZymbolAndParent(rootCopy, cursorCopy);

    if (transformText.isTextZymbol) {
      const { parent } = transformText;

      /* First we're going to wrap around a single operator */
      const newChildren = parent.children.slice(this.startIndex, zymbolIndex);

      parent.children.splice(
        this.startIndex,
        1 + zymbolIndex - this.startIndex
      );

      const groupZocket = new Zocket(parent.parentFrame, 0, parent);

      groupZocket.children = newChildren;
      groupZocket.reConnectParentChildren();

      parent.children.splice(this.startIndex, 0, groupZocket);

      const cc2 = [...cursorCopy];
      cc2.splice(cc2.length - 2, 2);

      rootCopy.recursivelyReIndexChildren();

      this.memo = {
        newTreeRoot: rootCopy,
        cursor: recoverAllowedCursor([...cc2, this.startIndex + 1], rootCopy),
      };

      this.changedIndex = false;

      return this.memo;
    }

    this.memo = {
      newTreeRoot: this.baseRoot,
      cursor: this.initialCursor,
    };

    this.changedIndex = false;

    return this.memo;
  }

  setRootParentFrame(parent: ZymbolFrame): void {
    this.baseRoot.parent = parent;
    this.baseRoot.setParentFrame(parent);
  }
}

class GroupTransformer extends Zentinel<{}> {
  zyId: string = GROUP_TRANSFORM;

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: GROUP_TRANSFORM,
      name: "group-trans",
      typeFilters: [STD_TRANSFORMER_TYPE_FILTERS.EQUATION],
      transform: async (root, cursor) => {
        cursor = makeHelperCursor(cursor, root);
        const zymbolIndex = last(cursor, 2);

        /* Handle the parenthesis that groups by operators */
        if (zymbolIndex > 0) {
          const cursorCopy = [...cursor];
          const transformText = getTransformTextZymbolAndParent(
            root,
            cursorCopy
          );

          if (transformText.isTextZymbol) {
            const { text } = transformText;

            const word = text.getText().trim();

            if (word === GROUP_DELIM) {
              /* First we're going to wrap around a single operator */
              let startIndex = zymbolIndex - 1;

              const t = new CustomGroupTransformation(
                root as Zocket,
                [...cursorCopy],
                startIndex
              );

              await t.init();

              return [t];
            }
          }
        }

        return [];
      },
    });
  };
}

export const groupTransformer = new GroupTransformer();
