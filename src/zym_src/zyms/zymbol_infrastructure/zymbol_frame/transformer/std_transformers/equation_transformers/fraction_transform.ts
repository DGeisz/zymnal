import { last } from "../../../../../../../global_utils/array_utils";
import { backslash } from "../../../../../../../global_utils/latex_utils";
import { Zentinel } from "../../../../../../../zym_lib/zentinel/zentinel";
import { Cursor } from "../../../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  ZymKeyPress,
} from "../../../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "../../../../../zymbol/zymbol";
import { StackZymbol } from "../../../../../zymbol/zymbols/stack_zymbol/stack_zymbol";
import {
  isSymbolZymbol,
  zymbolIsBinaryOperator,
} from "../../../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol_schema";
import { TEXT_ZYMBOL_NAME } from "../../../../../zymbol/zymbols/text_zymbol/text_zymbol_schema";
import { Zocket } from "../../../../../zymbol/zymbols/zocket/zocket";
import { ZymbolFrame } from "../../../zymbol_frame";
import { ZymbolFrameMethod } from "../../../zymbol_frame_schema";
import {
  BasicZymbolTreeTransformation,
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

const FRACTION = "fraction-transform";
const FRAC_FUN = "frac";

const fractionDelim = "//";

const fractionStoppers = [...["partial", "text{d}"].map(backslash), "d"];

function isFractionStopper(z: Zymbol): boolean {
  return zymbolIsBinaryOperator(z) || z.getMasterId() === TEXT_ZYMBOL_NAME;
}

function isPreFractionStopper(z: Zymbol): boolean {
  return isSymbolZymbol(z) && fractionStoppers.includes(z.texSymbol);
}

class CustomFractionTransformation extends ZymbolTreeTransformation {
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
  };

  init = this.makeCopy;

  priority: ZymbolTreeTransformationPriority = {
    rank: ZymbolTransformRank.Suggest,
    cost: 150,
  };

  getCurrentTransformation(): { newTreeRoot: Zocket; cursor: Cursor } {
    if (!this.changedIndex && this.memo) return this.memo;

    const cursorCopy = [...this.initialCursor];
    const root = this.baseRoot;

    this.makeCopy();

    const transformText = getTransformTextZymbolAndParent(root, cursorCopy);

    /* First we want to get to the parent */
    const zymbolIndex: number = last(cursorCopy, 2);

    /* Handle fractions */
    if (transformText.isTextZymbol) {
      const { parent } = transformText;

      const fraction = new StackZymbol(FRAC_FUN, root.parentFrame, 0, parent);

      parent.children.splice(zymbolIndex, 1);

      /* Check if we want to do a full fraction, or a single symbol fraction */
      fraction.children[0].children = parent.children.slice(
        this.startIndex,
        zymbolIndex
      );

      parent.children.splice(
        this.startIndex,
        zymbolIndex - this.startIndex,
        fraction
      );

      cursorCopy.splice(cursorCopy.length - 2, 2, ...[this.startIndex, 1, 0]);

      root.recursivelyReIndexChildren();

      this.memo = {
        newTreeRoot: root,
        cursor: recoverAllowedCursor(cursorCopy, root),
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

class FractionTransformer extends Zentinel<{}> {
  zyId: string = FRACTION;

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: FRACTION,
      name: "fraction",
      typeFilters: [STD_TRANSFORMER_TYPE_FILTERS.EQUATION],
      transform: async (root, cursor) => {
        cursor = makeHelperCursor(cursor, root);
        const cursorCopy = [...cursor];

        const transformText = getTransformTextZymbolAndParent(root, cursorCopy);

        /* First we want to get to the parent */
        const zymbolIndex: number = last(cursorCopy, 2);

        /* Handle fractions */
        if (transformText.isTextZymbol) {
          const { text, parent } = transformText;

          const fullText = text.getText();
          const word = fullText.trim();

          if (word === fractionDelim) {
            if (zymbolIndex === 0 || /^\s/.test(fullText)) {
              const fraction = new StackZymbol(
                FRAC_FUN,
                root.parentFrame,
                0,
                parent
              );

              parent.children.splice(zymbolIndex, 1, fraction);

              cursorCopy.splice(
                cursorCopy.length - 2,
                2,
                ...[zymbolIndex, 0, 0]
              );

              root.recursivelyReIndexChildren();
              return [
                new BasicZymbolTreeTransformation({
                  newTreeRoot: root as Zocket,
                  cursor: recoverAllowedCursor(cursorCopy, root),
                  priority: {
                    rank: ZymbolTransformRank.Suggest,
                    cost: 100,
                  },
                }),
              ];
            } else {
              let k = zymbolIndex - 1;
              let startIndex = 0;

              while (k >= 0) {
                if (
                  k !== zymbolIndex - 1 &&
                  isFractionStopper(parent.children[k])
                ) {
                  startIndex = k + 1;
                  break;
                } else if (isPreFractionStopper(parent.children[k])) {
                  startIndex = k;
                  break;
                }

                k--;
              }

              const t = new CustomFractionTransformation(
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

export const fractionTransformer = new FractionTransformer();
