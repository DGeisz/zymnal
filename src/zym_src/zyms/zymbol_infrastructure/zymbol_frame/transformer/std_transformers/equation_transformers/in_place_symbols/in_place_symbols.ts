import _ from "underscore";
import { last } from "../../../../../../../../global_utils/array_utils";
import {
  backslash,
  checkLatex,
  LATEX_SPACE,
} from "../../../../../../../../global_utils/latex_utils";
import { splitCursorStringAtLastWord } from "../../../../../../../../global_utils/string_utils";
import { Zentinel } from "../../../../../../../../zym_lib/zentinel/zentinel";
import {
  Cursor,
  cursorForEach,
  extendParentCursor,
} from "../../../../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
  ZymKeyPress,
} from "../../../../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "../../../../../../zymbol/zymbol";
import { SymbolZymbol } from "../../../../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { TextZymbol } from "../../../../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../../../../zymbol/zymbols/zocket/zocket";
import { TeX } from "../../../../../../zymbol/zymbol_types";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "../../transform_utils";
import { ZymbolFrameMethod } from "../../../../zymbol_frame_schema";
import {
  createZyTrait,
  CreateZyTraitSchema,
} from "../../../../../../../../zym_lib/zy_trait/zy_trait";
import {
  InPlaceSymbolsMethodSchema,
  IN_PLACE_SYMBOLS_ID,
} from "./in_place_symbols_schema";
import {
  BasicZymbolTreeTransformation,
  KeyPressValidator,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
} from "../../../transformer";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../../std_transformer_type_filters";

/* =============================================================================================== */
export type SlashMap = { [key: string]: string };
export type DirectMap = SlashMap;

const slashes = ["\\", "/"];

const SINGLE_DIRECT_SYMBOL_DELIM = ":";
const MULTI_DIRECT_SYMBOL_DELIM = ";";

const stringPrefixList = ["(", "[", "{"];

const STRING_TEST = /^[a-zA-Z,:0-9]+$/;

const alphaValidator = (keyPress: ZymKeyPress) =>
  !(
    keyPress.type === KeyPressBasicType.Delete ||
    (keyPress.type === KeyPressComplexType.Key &&
      /^[a-zA-Z,:0-9]$/.test(keyPress.key))
  );

function checkSymbol(sym: TeX): boolean {
  return checkLatex(`\\${sym}`);
}

/* =============================================================================================== */

type SymMap = { [key: string]: string };

interface InPlaceTransformerId {
  group: string;
  item: string;
}

export interface InPlaceSymbolMap {
  symMap: SymMap;
  id: InPlaceTransformerId;
  cost: number;
}

class InPlaceSymbols extends Zentinel<InPlaceSymbolsMethodSchema> {
  zyId: string = IN_PLACE_SYMBOLS_ID;
  globalSlashMap: InPlaceSymbolMap[] = [];
  globalDirectMap: InPlaceSymbolMap[] = [];

  constructor() {
    super();

    this.setMethodImplementation({
      addSlashMap: async (slashMap) => {
        const { id } = slashMap;

        if (!this.globalSlashMap.some((s) => _.isEqual(s.id, id))) {
          this.globalSlashMap.push(slashMap);
        }
      },
      addDirectMap: async (directMap) => {
        const { id } = directMap;

        if (!this.globalDirectMap.some((s) => _.isEqual(s.id, id))) {
          this.globalDirectMap.push(directMap);
        }
      },
    });
  }

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformerFactory, {
      source: IN_PLACE_SYMBOLS_ID,
      name: "in-place",
      typeFilters: [STD_TRANSFORMER_TYPE_FILTERS.EQUATION],
      factory: async (treeRoot, cursor) => {
        /* First we want to gather all the contextual transformers */
        const contextSlash: InPlaceSymbolMap[] = [];
        const contextDirect: InPlaceSymbolMap[] = [];

        await cursorForEach(treeRoot, cursor, async (zym) => {
          const transResult = await zym.callTraitMethod(
            InPlaceTrait.getInPlaceSymbolMaps,
            undefined
          );

          if (transResult.implemented) {
            const { slash, direct } = transResult.return;

            slash.forEach((s) => {
              if (!contextSlash.some((d) => _.isEqual(d.id, s.id))) {
                contextSlash.push(s);
              }
            });

            direct.forEach((s) => {
              if (!contextSlash.some((d) => _.isEqual(d.id, s.id))) {
                contextDirect.push(s);
              }
            });
          }
        });

        return [
          async (root: Zymbol, cursor: Cursor, keyPress: ZymKeyPress) => {
            cursor = makeHelperCursor(cursor, root);
            const universalCursorCopy = [...cursor];
            const cursorCopy: Cursor = [...cursor];

            const allTransformations: ZymbolTreeTransformation[] = [];

            const tt2 = getTransformTextZymbolAndParent(root, cursor);

            /* Guard so that we don't have to worry about this in the future */
            if (!tt2.isTextZymbol) return [];

            const rootCopies = await root.clone(
              1 +
                contextSlash.length +
                contextDirect.length +
                this.globalDirectMap.length +
                this.globalSlashMap.length,
              root.parent
            );

            const rootCopy = rootCopies.pop() as Zocket;

            const tt1 = getTransformTextZymbolAndParent(rootCopy, cursor);

            /* If the keypress is a power space, we're going to steal and return with tt1 */
            if (
              keyPress.type === KeyPressComplexType.Key &&
              keyPress.key === " " &&
              keyPress.modifiers?.includes(KeyPressModifier.Shift) &&
              tt1.isTextZymbol
            ) {
              const { parent, zymbolIndex } = tt1;

              parent.children.splice(
                zymbolIndex,
                1,
                new SymbolZymbol(
                  LATEX_SPACE,
                  parent.parentFrame,
                  zymbolIndex,
                  parent
                )
              );

              parent.recursivelyReIndexChildren();

              cursorCopy.splice(cursorCopy.length - 2, 2, zymbolIndex + 1);

              return [
                new BasicZymbolTreeTransformation({
                  newTreeRoot: rootCopy as Zocket,
                  cursor: recoverAllowedCursor(cursorCopy, rootCopy),
                  priority: {
                    rank: ZymbolTransformRank.Suggest,
                    cost: 100,
                  },
                }),
              ];
            }

            if (tt1.isTextZymbol) {
              const { text } = tt1;

              const fullText = text.getText().trim();
              let finalWord = fullText;

              let prefix = undefined;

              if (stringPrefixList.includes(fullText[0])) {
                prefix = fullText[0];
                finalWord = fullText.slice(1);
              }

              if (STRING_TEST.test(finalWord)) {
                const cursorCopy = [...cursor];

                cursorCopy.pop();
                const textPointer = cursorCopy.pop()!;
                const parentZocket = text.parent as Zocket;

                let newTextPointer = textPointer + finalWord.length;

                let prefixSymbol = undefined;

                if (prefix) {
                  prefixSymbol = new TextZymbol(
                    parentZocket.parentFrame,
                    textPointer,
                    parentZocket
                  );

                  prefixSymbol.setText(prefix);
                  newTextPointer++;
                }

                parentZocket.children.splice(
                  textPointer,
                  1,
                  ..._.compact([
                    prefixSymbol,
                    ...finalWord
                      .split("")
                      .map(
                        (s) =>
                          new SymbolZymbol(
                            s,
                            parentZocket.parentFrame,
                            textPointer + 1,
                            parentZocket
                          )
                      ),
                  ])
                );

                rootCopy.recursivelyReIndexChildren();
                allTransformations.push(
                  new BasicZymbolTreeTransformation(
                    {
                      newTreeRoot: rootCopy as Zocket,
                      cursor: recoverAllowedCursor(
                        extendParentCursor(newTextPointer, cursorCopy),
                        rootCopy
                      ),
                      priority: {
                        rank: ZymbolTransformRank.Suggest,
                        /* Super high cost so this is always suggested last */
                        cost: 10000,
                      },
                    },
                    alphaValidator
                  )
                );
              }
            }

            if (tt2.isTextZymbol) {
              const { text } = tt2;

              const i = last(cursorCopy);

              const fullText = text.getText();

              const { word, before, after } = splitCursorStringAtLastWord(
                fullText,
                i,
                stringPrefixList
              );

              let changed = false;
              let symbol: string | string[] = "";
              let rank = ZymbolTransformRank.Include;
              let keyPressValidator: KeyPressValidator | undefined;

              /* Checks for a direct character insert */
              if (
                word.length === 2 &&
                word.startsWith(SINGLE_DIRECT_SYMBOL_DELIM)
              ) {
                changed = true;
                symbol = word.slice(1);
                rank = ZymbolTransformRank.Suggest;
              } else if (
                word.startsWith(MULTI_DIRECT_SYMBOL_DELIM) &&
                word.length > 1
              ) {
                changed = true;
                symbol = word.slice(1);
                rank = ZymbolTransformRank.Suggest;

                keyPressValidator = alphaValidator;
              } else if (!word.includes(".") && checkSymbol(word)) {
                changed = true;
                symbol = backslash(word);

                if (word.length > 1) {
                  rank = ZymbolTransformRank.Suggest;
                }

                keyPressValidator = (keyPress: ZymKeyPress) =>
                  !(
                    keyPress.type === KeyPressComplexType.Key &&
                    /[a-zA-Z]+/.test(keyPress.key) &&
                    checkSymbol(word + keyPress.key)
                  );
              }

              if (changed) {
                cursorCopy.pop();
                const textPointer = cursorCopy.pop()!;
                const parentZocket = text.parent as Zocket;

                const newZym = [];
                let newTextPointer = textPointer + 1;

                let symZyms: SymbolZymbol[];

                if (before) {
                  const txt1 = new TextZymbol(
                    parentZocket.parentFrame,
                    textPointer,
                    parentZocket
                  );

                  txt1.setText(before);

                  newZym.push(txt1);
                  newTextPointer++;
                }

                /* Now either create a symbol or a number */

                if (Array.isArray(symbol)) {
                  symZyms = symbol.map(
                    (s) =>
                      new SymbolZymbol(
                        s,
                        parentZocket.parentFrame,
                        textPointer + 1,
                        parentZocket
                      )
                  );

                  newTextPointer += symbol.length - 1;
                } else {
                  symZyms = [
                    new SymbolZymbol(
                      symbol,
                      parentZocket.parentFrame,
                      textPointer + 1,
                      parentZocket
                    ),
                  ];
                }

                if (after) {
                  const txt2 = new TextZymbol(
                    parentZocket.parentFrame,
                    textPointer + 2,
                    parentZocket
                  );

                  txt2.setText(after);

                  newZym.push(txt2);
                }

                newZym.push(...symZyms);

                parentZocket.children.splice(textPointer, 1, ...newZym);

                root.recursivelyReIndexChildren();
                allTransformations.push(
                  new BasicZymbolTreeTransformation(
                    {
                      newTreeRoot: root as Zocket,
                      cursor: recoverAllowedCursor(
                        extendParentCursor(newTextPointer, cursorCopy),
                        root
                      ),
                      priority: {
                        rank,
                        cost: 100,
                      },
                    },
                    keyPressValidator
                  )
                );
              }
            }

            /* Now handle all the special boys */
            const numSlash = this.globalSlashMap.length + contextSlash.length;

            [
              ...this.globalSlashMap,
              ...contextSlash,
              ...this.globalDirectMap,
              ...contextDirect,
            ].forEach((inPlaceMap, i) => {
              const { symMap, cost } = inPlaceMap;
              const symKeys = Object.keys(symMap);

              const isSlash = i < numSlash;
              const rootCopy = rootCopies.pop() as Zocket;

              const cursorCopy = [...universalCursorCopy];

              const textTransform = getTransformTextZymbolAndParent(
                rootCopy,
                cursorCopy
              );

              /* This is only for type checking */
              if (textTransform.isTextZymbol) {
                const { text } = textTransform;

                const i = last(cursorCopy);

                const fullText = text.getText();

                const { word, before, after } = splitCursorStringAtLastWord(
                  fullText,
                  i,
                  stringPrefixList
                );

                let changed = false;
                let symbol: string = "";
                let rank = ZymbolTransformRank.Include;
                let keyPressValidator: KeyPressValidator | undefined;

                if (isSlash) {
                  if (slashes.some((s) => word.startsWith(s))) {
                    const key = word.slice(1);

                    if (symKeys.includes(key)) {
                      changed = true;
                      symbol = symMap[key];
                      rank = ZymbolTransformRank.Suggest;
                    }
                  }
                } else if (symKeys.includes(word)) {
                  changed = true;
                  symbol = symMap[word];
                  rank = ZymbolTransformRank.Suggest;
                }

                if (changed) {
                  cursorCopy.pop();
                  const textPointer = cursorCopy.pop()!;
                  const parentZocket = text.parent as Zocket;

                  const newZym = [];
                  let newTextPointer = textPointer + 1;

                  if (before) {
                    const txt1 = new TextZymbol(
                      parentZocket.parentFrame,
                      textPointer,
                      parentZocket
                    );

                    txt1.setText(before);

                    newZym.push(txt1);
                    newTextPointer++;
                  }

                  /* Now either create a symbol or a number */
                  newZym.push(
                    new SymbolZymbol(
                      symbol,
                      parentZocket.parentFrame,
                      textPointer + 1,
                      parentZocket
                    )
                  );

                  if (after) {
                    const txt2 = new TextZymbol(
                      parentZocket.parentFrame,
                      textPointer + 2,
                      parentZocket
                    );

                    txt2.setText(after);

                    newZym.push(txt2);
                  }

                  parentZocket.children.splice(textPointer, 1, ...newZym);

                  rootCopy.recursivelyReIndexChildren();
                  allTransformations.push(
                    new BasicZymbolTreeTransformation(
                      {
                        newTreeRoot: rootCopy as Zocket,
                        cursor: recoverAllowedCursor(
                          extendParentCursor(newTextPointer, cursorCopy),
                          rootCopy
                        ),
                        priority: {
                          rank,
                          cost,
                        },
                      },
                      keyPressValidator
                    )
                  );
                }
              }
            });

            return allTransformations;
          },
        ];
      },
    });
  };
}

export const inPlaceSymbols = new InPlaceSymbols();

interface ContextualTransformers {
  slash: InPlaceSymbolMap[];
  direct: InPlaceSymbolMap[];
}

type InPlaceTraitSchema = CreateZyTraitSchema<{
  getInPlaceSymbolMaps: {
    args: undefined;
    return: ContextualTransformers;
  };
}>;

export const InPlaceTrait = createZyTrait<InPlaceTraitSchema>(
  IN_PLACE_SYMBOLS_ID,
  {
    getInPlaceSymbolMaps: "gipt",
  }
);
