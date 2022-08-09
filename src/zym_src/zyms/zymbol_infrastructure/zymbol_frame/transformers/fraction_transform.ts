import { isSymbol } from "underscore";
import { last } from "../../../../../global_utils/array_utils";
import { backslash } from "../../../../../global_utils/latex_utils";
import { splitCursorStringAtLastWord } from "../../../../../global_utils/text_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { Cursor } from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  ZymKeyPress,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "../../../zymbol/zymbol";
import { FunctionZymbol } from "../../../zymbol/zymbols/function_zymbol/function_zymbol";
import { isSymbolZymbol } from "../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { TEXT_ZYMBOL_NAME } from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import {
  BasicZymbolTreeTransformation,
  CreateTransformerMessage,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
  ZymbolTreeTransformationPriority,
} from "../zymbol_frame";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
  zymbolIsBinaryOperator,
} from "./transform_utils";

const FRACTION = "fraction-transform";
const FRAC_FUN = "cfrac";

const fractionDelim = "//";

const fractionStoppers = [...["partial"].map(backslash)];

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

      const fraction = new FunctionZymbol(
        FRAC_FUN,
        2,
        root.parentFrame,
        0,
        parent
      );

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

  setRootParent(parent: Zym<any, any, any>): void {
    this.baseRoot.parent = parent;
  }
}

class Fraction extends Zentinel {
  zyId: string = FRACTION;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: FRACTION,
        name: "fraction",
        transform: async (root, cursor) => {
          cursor = makeHelperCursor(cursor, root);
          const cursorCopy = [...cursor];

          const transformText = getTransformTextZymbolAndParent(
            root,
            cursorCopy
          );

          /* First we want to get to the parent */
          const zymbolIndex: number = last(cursorCopy, 2);

          /* Handle fractions */
          if (transformText.isTextZymbol) {
            const { text, parent } = transformText;

            const word = text.getText();

            if (word === fractionDelim) {
              if (zymbolIndex > 0) {
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
              } else {
                const fraction = new FunctionZymbol(
                  "frac",
                  2,
                  root.parentFrame,
                  0,
                  parent
                );

                parent.children.unshift(fraction);

                parent.children.splice(1, 1);

                cursorCopy.splice(cursorCopy.length - 2, 2, ...[0, 0, 0]);

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
              }
            }
          }

          return [];
        },
      })
    );
  };
}

export const fraction = new Fraction();
