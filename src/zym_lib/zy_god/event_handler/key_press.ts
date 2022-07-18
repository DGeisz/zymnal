import { ZYMBOL_PROGRESSION_ID } from "../../../zym_src/zyms/zymbol_infrastructure/zymbol_progression/zp_master";
import { Zym } from "../../zym/zym";
import {
  groupPathFactory,
  implementTotalCmdGroup,
  justPath,
  unwrap,
  ZyCommandGroup,
} from "../../zy_commands/zy_command_types";
import {
  chainMoveResponse,
  Cursor,
  CursorMoveResponse,
  extendChildCursor,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
} from "../cursor/cursor";
import { BasicContext } from "../types/context_types";

/* === Basic keypress types ===  */

export enum KeyPressComplexType {
  Key,
}

export enum KeyPressBasicType {
  Enter = KeyPressComplexType.Key + 1,
  Tab,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Delete,
}

export enum KeyPressModifier {
  Shift,
  Ctrl,
  Cmd,
  Option,
}

interface ModifiedKeyPress {
  modifiers?: KeyPressModifier[];
}

export interface BasicKeyPress extends ModifiedKeyPress {
  type: KeyPressBasicType;
}

export interface ComplexKeyPress extends ModifiedKeyPress {
  type: KeyPressComplexType.Key;
  key: string;
}

export type ZymKeyPress = BasicKeyPress | ComplexKeyPress;

/* ==== COMMANDS ===== */

const KEY_PRESS_CMD_ID = "keypress-cmd-6a62";

const kpc = groupPathFactory(KEY_PRESS_CMD_ID);

enum KeyPressEnum {
  handleKeyPress,
}

export type KeyPressType = typeof KeyPressEnum;

export const KeyPressCommand: ZyCommandGroup<KeyPressType> = {
  handleKeyPress: justPath(kpc("hkp")),
};

export interface KeyPressArgs {
  keyPress: ZymKeyPress;
  cursor: Cursor;
  keyPressContext: BasicContext;
}

export const defaultKeyPressImpl = implementTotalCmdGroup(KeyPressCommand, {
  handleKeyPress: async (zym, args) => {
    console.log("hi", zym.getCursorIndex(), zym.getMasterId());

    const { cursor, keyPressContext, keyPress } = args as KeyPressArgs;

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    if (nextCursorIndex >= 0) {
      const child: Zym = zym.children[nextCursorIndex];

      const childMove = await child.cmd<CursorMoveResponse, KeyPressArgs>(
        KeyPressCommand.handleKeyPress,
        {
          cursor: childRelativeCursor,
          keyPressContext,
          keyPress,
        }
      );

      console.log("Promise in child!", childMove);

      return chainMoveResponse(unwrap(childMove), (nextCursor) => {
        return successfulMoveResponse(
          extendChildCursor(nextCursorIndex, nextCursor)
        );
      });
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  },
});

// enum KeyPressEnum {
//   handleKeyPres,
// }

// export type LocalKeyPressType = typeof LocalKeyPressCommandsEnum;

// export const KeyPressCommand: ZyCommandGroup<LocalKeyPressType> = {
//   handleKeyPress: justPath(kpc("hkp")),
// };

// /* Local Types */
// interface KeyPressArgs {
//   keyPress: ZymKeyPress;
// }

// export type LocalKeyPressArgs = CmdArgs<KeyPressArgs>;
// export type LocalKeyPressReturn = SingleCursorPropReturn<
//   KeyPressResponse,
//   KeyPressArgs
// >;

// /* ==== GLOBAL COMMANDS ====  */
// export function zyTreeHandleKeyPress(root: Zym, cursor: Cursor) {
//   runSingleCursorTreePropagator(root, {
//     cursor,
//     nodeCmd: KeyPressCommand.handleKeyPress,
//     initialArgs: {},
//   });
// }

// export function hanldle<R, A = any>(
//   root: Zym,
//   cursor: Cursor,
//   keyPress: ZymKeyPress
// ): CursorMoveResponse {
//   // const { cursor, initialArgs, nodeCmd } = args;

//   const path = pointerToPath(nodeCmd);

//   let nodeArgs = initialArgs;
//   let currZym = root;
//   let cursorCopy = [...cursor];

//   for (const index of cursor) {
//     cursorCopy.shift();

//     const r = currZym.cmd<SingleCursorPropReturn<CursorMoveResponse>, CmdArgs>(
//       KeyPressCommand.handleKeyPress,
//       {
//         cursor: [...cursorCopy],
//         args: nodeArgs,
//       }
//     );

//     if (r.ok) {
//       if (r.val.terminated) {
//         return r.val;
//       } else {
//         nodeArgs = r.val.nextArgs;
//       }
//     }

//     currZym = currZym.children[index];
//   }

//   return NONE;
// }
