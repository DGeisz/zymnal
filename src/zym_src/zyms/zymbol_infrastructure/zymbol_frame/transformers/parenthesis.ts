export {};
// import { last } from "../../../../../global_utils/array_utils";
// import { splitCursorStringAtLastWord } from "../../../../../global_utils/text_utils";
// import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
// import { Zymbol } from "../../../zymbol/zymbol";
// import {
//   TextZymbol,
//   TEXT_ZYMBOL_NAME,
// } from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
// import { CreateTransformerMessage } from "../zymbol_frame";

// export const PARENTHESIS_TRANSFORM = "par-trans-t23dki";

// class Parenthesis extends Zentinel {
//   zyId: string = PARENTHESIS_TRANSFORM;

//   onRegistration = async () => {
//     this.callHermes(
//       CreateTransformerMessage.registerTransformer({
//         source: PARENTHESIS_TRANSFORM,
//         name: "par-trans",
//         transform: (root, cursor) => {
//           const cursorCopy = [...cursor];

//           /* First we want to get to the parent */
//           let currZymbol = root;
//           let parent = root;

//           for (let i = 0; i < cursorCopy.length - 1; i++) {
//             parent = currZymbol;
//             currZymbol = parent.children[cursorCopy[i]] as Zymbol;

//             if (!currZymbol) {
//               return [];
//             }
//           }

//           const zymbolIndex: number = last(cursorCopy, 2);

//           if (
//             zymbolIndex > 0 &&
//             currZymbol.getMasterId() === TEXT_ZYMBOL_NAME
//           ) {
//             const prevZymbol = parent.children[zymbolIndex - 1] as Zymbol;

//             const i = last(cursorCopy);
//             const text = currZymbol as TextZymbol;

//             const { word, before, after } = splitCursorStringAtLastWord(
//               text.getText(),
//               i
//             );

//             const firstWord = text
//               .getText()
//               .split(/\s+/)
//               .filter((t) => !!t)[0];

//             if (firstWord && firstWord.startsWith(dot)) {
//               let modWord = firstWord.slice(1);

//               let allowed = false;
//               let rank = ZymbolTransformRank.Include;

//               if (dotKeys.includes(modWord)) {
//                 allowed = true;
//                 rank = ZymbolTransformRank.Suggest;
//                 modWord = dotMap[modWord];
//               } else if (suggestedMods.includes(modWord)) {
//                 allowed = true;
//                 rank = ZymbolTransformRank.Suggest;
//               } else if (checkMod(modWord)) {
//                 /* We default to suggested */
//                 allowed = true;
//               }

//               if (allowed) {
//                 const mod = {
//                   id: {
//                     group: "basic",
//                     item: modWord,
//                   },
//                   pre: `\\${modWord}{`,
//                   post: "}",
//                 };

//                 const remainingText = text.getText().slice(firstWord.length);

//                 if (prevZymbol.getMasterId() === ZOCKET_MASTER_ID) {
//                   (prevZymbol as Zocket).toggleModifier(mod);
//                 } else {
//                   const newZocket = new Zocket(
//                     text.parentFrame,
//                     zymbolIndex - 1,
//                     parent
//                   );

//                   newZocket.children = [prevZymbol];
//                   newZocket.reIndexChildren();

//                   newZocket.toggleModifier(mod);

//                   parent.children[zymbolIndex - 1] = newZocket;
//                 }

//                 text.setText(remainingText);

//                 cursorCopy.pop();

//                 return [
//                   new BasicZymbolTreeTransformation({
//                     newTreeRoot: root as Zocket,
//                     cursor: cursorCopy,
//                     priority: {
//                       rank,
//                       cost: 100,
//                     },
//                   }),
//                 ];
//               }
//             }
//           }

//           return [];
//         },
//       })
//     );
//   };
// }
