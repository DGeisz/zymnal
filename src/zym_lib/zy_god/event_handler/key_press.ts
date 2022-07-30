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
import _ from "underscore";

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

export function keyPressModifierToSymbol(mod: KeyPressModifier): string {
  switch (mod) {
    case KeyPressModifier.Shift:
      return "shift";
    case KeyPressModifier.Ctrl:
      return "ctrl";
    case KeyPressModifier.Cmd:
      return "cmd";
    case KeyPressModifier.Option:
      return "option";
  }
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

export function keyPressEqual(k1: ZymKeyPress, k2: ZymKeyPress): boolean {
  const modsEqual = _.isEqual(
    (k1.modifiers ?? []).sort(),
    (k2.modifiers ?? []).sort()
  );

  if (modsEqual && k1.type === k2.type) {
    if (
      k1.type === KeyPressComplexType.Key &&
      k2.type === KeyPressComplexType.Key
    ) {
      return k1.key === k2.key;
    }

    return true;
  }

  return false;
}

export const DEFAULT_SELECTOR: ZymKeyPress = {
  type: KeyPressBasicType.Enter,
  modifiers: [KeyPressModifier.Shift],
};

export const SECONDARY_SELECTOR: ZymKeyPress = {
  type: KeyPressComplexType.Key,
  modifiers: [KeyPressModifier.Shift, KeyPressModifier.Ctrl],
  key: " ",
};

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
