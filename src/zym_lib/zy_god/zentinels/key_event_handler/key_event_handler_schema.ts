import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../hermes/hermes";
import { VerticalNavigationHandleType } from "../../cursor/cursor_commands";
import { ZymKeyPress } from "../../event_handler/key_press";

export const KEY_PRESS_HANDLER = "key-press-handler";
export type KeyPressHandler = (keyPress: ZymKeyPress) => void;
export type NavHandler = () => void;
export type NavOracle = () => VerticalNavigationHandleType;

export type KeyEventHandlerMethodSchema = CreateZentinelMethodSchema<{
  addKeyHandler: {
    args: KeyPressHandler;
    return: void;
  };
  suppressKeyHandling: {
    args: undefined;
    return: void;
  };
  allowKeyHandling: {
    args: undefined;
    return: void;
  };
  addVerticalNavigationHandler: {
    args: NavHandler;
    return: void;
  };
  registerVerticalNavigationOracle: {
    args: NavOracle;
    return: void;
  };
}>;

export const KeyEventHandlerMethod =
  createZentinelMethodList<KeyEventHandlerMethodSchema>(KEY_PRESS_HANDLER, {
    addKeyHandler: 0,
    suppressKeyHandling: 0,
    allowKeyHandling: 0,
    addVerticalNavigationHandler: 0,
    registerVerticalNavigationOracle: 0,
  });
