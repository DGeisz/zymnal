import { cursorBlink } from "../cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
  ZymKeyPress,
} from "./key_press";

enum KeyLock {
  NONE,
  KEYPRESS,
  KEYDOWN,
}

type HandlerId = number;
type KeyPressHandler = (keyPress: ZymKeyPress) => void;

class KeyEventHandler {
  keyLock: KeyLock = KeyLock.NONE;
  keyEventHandlers: Map<HandlerId, KeyPressHandler> = new Map();

  constructor() {
    this.setDocEventListeners();
  }

  private setDocEventListeners = () => {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keypress", this.handleKeyPress);
  };

  addKeyHandler = (handler: KeyPressHandler) => {
    const id: HandlerId = Math.random();

    this.keyEventHandlers.set(id, handler);
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

  handleKeyDown = (event: KeyboardEvent) => {
    this.acquireKeyLock(KeyLock.KEYDOWN);

    const key = event.key;
    const modifiers = KeyEventHandler.genKeyPressModifierList(event);

    let keyPressType: KeyPressBasicType | undefined = undefined;

    switch (key) {
      case "ArrowUp": {
        keyPressType = KeyPressBasicType.ArrowUp;
        break;
      }
      case "ArrowDown": {
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
    this.acquireKeyLock(KeyLock.KEYPRESS);

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
