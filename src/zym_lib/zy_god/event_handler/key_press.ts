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
