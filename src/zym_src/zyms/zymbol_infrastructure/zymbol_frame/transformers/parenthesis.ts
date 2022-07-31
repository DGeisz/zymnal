import { createNoSubstitutionTemplateLiteral, tokenToString } from "typescript";
import { last } from "../../../../../global_utils/array_utils";
import { splitCursorStringAtLastWord } from "../../../../../global_utils/text_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import { extendParentCursor } from "../../../../../zym_lib/zy_god/cursor/cursor";
import { Zymbol } from "../../../zymbol/zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket, ZymbolModifier } from "../../../zymbol/zymbols/zocket/zocket";
import {
  BasicZymbolTreeTransformation,
  CreateTransformerMessage,
  ZymbolTransformRank,
} from "../zymbol_frame";

const LEFT_PARENTHESIS = "(";
const RIGHT_PARENTHESIS = ")";

export const PARENTHESIS_TRANSFORM = "par-trans-t23dki";

class Parenthesis extends Zentinel {
  zyId: string = PARENTHESIS_TRANSFORM;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: PARENTHESIS_TRANSFORM,
        name: "par-trans",
        transform: (root, cursor) => {
          const cursorCopy = [...cursor];

          /* First we want to get to the parent */
          let currZymbol = root;
          let parent = root;

          for (let i = 0; i < cursorCopy.length - 1; i++) {
            parent = currZymbol;
            currZymbol = parent.children[cursorCopy[i]] as Zymbol;

            if (!currZymbol) {
              return [];
            }
          }

          const zymbolIndex: number = last(cursorCopy, 2);

          if (
            zymbolIndex > 0 &&
            currZymbol.getMasterId() === TEXT_ZYMBOL_NAME
          ) {
            const i = last(cursorCopy);
            const text = currZymbol as TextZymbol;

            const {
              word,
              before: rightBefore,
              after: rightAfter,
            } = splitCursorStringAtLastWord(text.getText(), i);

            if (word === RIGHT_PARENTHESIS) {
              /* Now we look for a left parenthesis up until that mark */
              for (let k = 0; k < zymbolIndex; k++) {
                const child = parent.children[k];

                if (child.getMasterId() === TEXT_ZYMBOL_NAME) {
                  const newText = child as TextZymbol;
                  const words = newText.getText().split(/\s/);

                  const openIndex = words.indexOf(LEFT_PARENTHESIS);

                  if (openIndex > -1) {
                    cursorCopy.pop();
                    cursorCopy.pop();

                    let newPointer = k + 1;

                    const { before: leftBefore, after: leftAfter } =
                      splitCursorStringAtLastWord(
                        newText.getText(),
                        openIndex + 1
                      );

                    /* Now create the new children */
                    const newChildren = parent.children.slice(
                      k + 1,
                      zymbolIndex
                    );

                    if (rightBefore) {
                      const txt = new TextZymbol(parent.parentFrame, 0, parent);
                      txt.setText(rightBefore);

                      newChildren.push(txt);
                    }

                    if (leftAfter) {
                      const txt = new TextZymbol(parent.parentFrame, 0, parent);
                      txt.setText(leftAfter);

                      newChildren.unshift(txt);
                    }

                    /* Doctor the old children */
                    parent.children.splice(k, 1 + zymbolIndex - k);

                    if (rightAfter) {
                      const txt = new TextZymbol(parent.parentFrame, 0, parent);
                      txt.setText(rightAfter);

                      parent.children.splice(k, 0, txt);
                    }

                    const newZocket = new Zocket(parent.parentFrame, 0, parent);
                    newZocket.children = newChildren as Zymbol[];

                    parent.children.splice(k, 0, newZocket);

                    if (leftBefore) {
                      const txt = new TextZymbol(parent.parentFrame, 0, parent);
                      txt.setText(leftBefore);
                      newPointer++;

                      parent.children.splice(k, 0, txt);
                    }

                    parent.reIndexChildren();
                    newZocket.reIndexChildren();

                    const mod: ZymbolModifier = {
                      id: {
                        group: "wrap",
                        item: "parenthesis",
                      },
                      pre: "\\left(",
                      post: "\\right)",
                    };

                    newZocket.toggleModifier(mod);

                    console.log("new", root);

                    return [
                      new BasicZymbolTreeTransformation({
                        newTreeRoot: root as Zocket,
                        cursor: extendParentCursor(newPointer, cursorCopy),
                        priority: {
                          rank: ZymbolTransformRank.Suggest,
                          cost: 100,
                        },
                      }),
                    ];
                  }
                }
              }
            }
          }

          return [];
        },
      })
    );
  };
}

export const parenthesisModifiers = new Parenthesis();
