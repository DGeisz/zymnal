import { Zym } from "../../zym/zym";
import {
  chainMoveResponse,
  Cursor,
  CursorMoveResponse,
  extendChildCursor,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
} from "../cursor/cursor";
import { BasicContext } from "../../utils/basic_context";
import _ from "underscore";
import {
  createZyTrait,
  CreateZyTraitSchema,
  unwrapTraitResponse,
} from "../../zy_trait/zy_trait";
import { defaultTraitImplementationFactory } from "../../zy_trait/default_trait_zentinel/default_trait_zentinel_schema";

/* === Basic keypress types ===  */

export enum ZymbolDirection {
  LEFT = "left",
  RIGHT = "right",
}

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
  Escape,
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
      return "⇧";
    case KeyPressModifier.Ctrl:
      return "Ctrl";
    case KeyPressModifier.Cmd:
      return "⌘";
    case KeyPressModifier.Option:
      return "⌥";
  }
}

interface ModifiedKeyPress {
  modifiers?: KeyPressModifier[];
}

export interface BasicKeyPress extends ModifiedKeyPress {
  type: KeyPressBasicType;
}

export function basicKeyPress(type: KeyPressBasicType): ZymKeyPress {
  return {
    type,
  };
}

export interface ComplexKeyPress extends ModifiedKeyPress {
  type: KeyPressComplexType.Key;
  key: string;
}

export function letterKeyPress(
  letter: string,
  modifiers?: KeyPressModifier[]
): ComplexKeyPress {
  return {
    type: KeyPressComplexType.Key,
    key: letter,
    modifiers,
  };
}

export function isKeyPressKey(
  keyPress: ZymKeyPress,
  key: string | string[]
): keyPress is ComplexKeyPress {
  if (typeof key == "string") {
    key = [key];
  }

  return (
    keyPress.type === KeyPressComplexType.Key && key.includes(keyPress.key)
  );
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

/* ==== COMMANDS ===== */

const KEY_PRESS_CMD_ID = "keypress-cmd-6a62";

export type KeyPressSchema = CreateZyTraitSchema<{
  handleKeyPress: {
    args: {
      keyPress: ZymKeyPress;
      cursor: Cursor;
      keyPressContext: BasicContext;
    };
    return: CursorMoveResponse;
  };
}>;

export const KeyPressTrait = createZyTrait<KeyPressSchema>(KEY_PRESS_CMD_ID, {
  handleKeyPress: "hkp",
});

export const defaultKeyPressImplFactory = defaultTraitImplementationFactory(
  KeyPressTrait,
  {
    handleKeyPress: async (zym, args) => {
      const { cursor, keyPressContext, keyPress } = args;
      const { nextCursorIndex, childRelativeCursor } =
        extractCursorInfo(cursor);

      if (nextCursorIndex >= 0) {
        const child: Zym<any, any> = zym.children[nextCursorIndex];

        const childMove = await child.callTraitMethod(
          KeyPressTrait.handleKeyPress,
          {
            cursor: childRelativeCursor,
            keyPressContext,
            keyPress,
          }
        );

        return chainMoveResponse(
          unwrapTraitResponse(childMove),
          (nextCursor) => {
            return successfulMoveResponse(
              extendChildCursor(nextCursorIndex, nextCursor)
            );
          }
        );
      }

      return FAILED_CURSOR_MOVE_RESPONSE;
    },
  }
);
