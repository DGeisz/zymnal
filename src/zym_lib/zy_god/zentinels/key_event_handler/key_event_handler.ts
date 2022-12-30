import { join } from "path";
import { CURSOR_NAME } from "../../../../global_utils/latex_utils";
import { Zentinel } from "../../../zentinel/zentinel";
import { cursorBlink } from "../../cursor/cursor";
import { VerticalNavigationHandleType } from "../../cursor/cursor_commands";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
  ZymKeyPress,
} from "../../event_handler/key_press";
import {
  KeyEventHandlerMethodSchema,
  KeyPressHandler,
  KEY_PRESS_HANDLER,
  NavHandler,
  NavOracle,
} from "./key_event_handler_schema";

enum KeyLock {
  NONE,
  KEYPRESS,
  KEYDOWN,
}

type HandlerId = number;

class KeyEventHandler extends Zentinel<KeyEventHandlerMethodSchema> {
  zyId = KEY_PRESS_HANDLER;
  keyLock: KeyLock = KeyLock.NONE;
  keyEventHandlers: Map<HandlerId, KeyPressHandler> = new Map();
  navHandlers: Map<HandlerId, NavHandler> = new Map();

  suppressKeyEvents = false;

  verticalNavigationOracles: NavOracle[] = [];

  constructor() {
    super();
    this.setDocEventListeners();

    this.setMethodImplementation({
      addKeyHandler: async (handler) => {
        this.addKeyHandler(handler);
      },
      suppressKeyHandling: async () => {
        // this.suppressKeyEvents = true;
      },
      allowKeyHandling: async () => {
        // this.suppressKeyEvents = false;
      },
      addVerticalNavigationHandler: async (handler) => {
        this.addNavHandler(handler);
      },
      registerVerticalNavigationOracle: async (oracle) => {
        this.verticalNavigationOracles.push(oracle);
      },
    });
  }

  private setDocEventListeners = () => {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keypress", this.handleKeyPress);
  };

  private handleVerticalNavigation = () =>
    !this.verticalNavigationOracles
      .map((o) => o())
      .some((v) => v === VerticalNavigationHandleType.ZyManaged);

  addKeyHandler = (handler: KeyPressHandler) => {
    const id: HandlerId = Math.random();

    this.keyEventHandlers.set(id, handler);
  };

  addNavHandler = (handler: NavHandler) => {
    const id: HandlerId = Math.random();

    this.navHandlers.set(id, handler);
  };

  removeKeyHandler = (handlerId: HandlerId) => {
    this.keyEventHandlers.delete(handlerId);
  };

  acquireKeyLock = (lock: KeyLock) => {
    if (this.keyLock === KeyLock.NONE) {
      this.keyLock = lock;
    }
  };

  handleKeyUnlock = (keyLock: KeyLock) => {
    if (this.keyLock === keyLock) {
      cursorBlink.restartTimer();

      this.keyLock = KeyLock.NONE;
    }
  };

  invokeKeyEventHandlers = (event: ZymKeyPress) => {
    console.log("Invoke", event);
    for (const handler of this.keyEventHandlers.values()) {
      handler(event);
    }
  };

  private static genKeyPressModifierList = (
    event: KeyboardEvent
  ): KeyPressModifier[] => {
    const mods: KeyPressModifier[] = [];

    if (event.altKey) mods.push(KeyPressModifier.Option);
    if (event.shiftKey) mods.push(KeyPressModifier.Shift);
    if (event.ctrlKey) mods.push(KeyPressModifier.Ctrl);
    if (event.metaKey) mods.push(KeyPressModifier.Cmd);

    return mods;
  };

  callNavHandlers = () => {
    for (const h of this.navHandlers.values()) {
      h();
    }
  };

  handleKeyDown = (event: KeyboardEvent) => {
    if (this.suppressKeyEvents) return;

    this.acquireKeyLock(KeyLock.KEYDOWN);

    const key = event.key;
    const modifiers = KeyEventHandler.genKeyPressModifierList(event);

    let keyPressType: KeyPressBasicType | undefined = undefined;

    switch (key) {
      case "ArrowUp": {
        if (this.handleVerticalNavigation()) {
          this.callNavHandlers();
          return;
        }

        keyPressType = KeyPressBasicType.ArrowUp;
        break;
      }
      case "ArrowDown": {
        if (this.handleVerticalNavigation()) {
          this.callNavHandlers();
          return;
        }

        keyPressType = KeyPressBasicType.ArrowDown;
        break;
      }
      case "ArrowLeft": {
        keyPressType = KeyPressBasicType.ArrowLeft;
        break;
      }
      case "ArrowRight": {
        keyPressType = KeyPressBasicType.ArrowRight;
        break;
      }
      case "Backspace": {
        keyPressType = KeyPressBasicType.Delete;
        break;
      }
      case "Enter": {
        keyPressType = KeyPressBasicType.Enter;
        break;
      }
      case "Escape": {
        keyPressType = KeyPressBasicType.Escape;
        break;
      }
    }

    if (keyPressType !== undefined) {
      event.preventDefault();

      this.invokeKeyEventHandlers({
        type: keyPressType,
        modifiers,
      });
    }

    if (modifiers.includes(KeyPressModifier.Cmd) && event.key !== "r") {
      event.preventDefault();
      this.handleKeyPress(event);
    }

    this.handleKeyUnlock(KeyLock.KEYDOWN);
  };

  handleKeyPress = (e: KeyboardEvent) => {
    if (this.suppressKeyEvents) return;

    this.acquireKeyLock(KeyLock.KEYPRESS);

    e.preventDefault();

    const char = e.key === " " ? e.key : e.key.trim();
    const modifiers = KeyEventHandler.genKeyPressModifierList(e);

    if (char.length === 1) {
      this.invokeKeyEventHandlers({
        type: KeyPressComplexType.Key,
        key: char,
        modifiers,
      });
    }

    this.handleKeyUnlock(KeyLock.KEYPRESS);
  };
}

export const keyEventHandler = new KeyEventHandler();
