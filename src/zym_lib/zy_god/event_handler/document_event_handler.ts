import { cursorBlink } from "../cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  ZymKeyPress,
} from "../types/context_types";

enum KeyLock {
  NONE,
  KEYPRESS,
  KEYDOWN,
}

type HandlerId = number;
type KeyPressHandler = (keyPress: ZymKeyPress) => void;

class DocumentEventHandler {
  keyLock: KeyLock = KeyLock.NONE;
  keyEventHandlers: Map<HandlerId, KeyPressHandler> = new Map();

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

  handleKeyDown = (event: KeyboardEvent) => {
    this.acquireKeyLock(KeyLock.KEYDOWN);

    const key = event.key;

    let keyPressType: KeyPressBasicType | undefined = undefined;

    switch (key) {
      case "ArrowUp": {
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
        keyPressType = KeyPressBasicType.ArrowUp;
        break;
      }
    }

    if (keyPressType !== undefined) {
      this.invokeKeyEventHandlers({
        type: keyPressType,
      });
    }

    this.handleKeyUnlock(KeyLock.KEYDOWN);
  };

  handleKeyPress = (e: KeyboardEvent) => {
    this.acquireKeyLock(KeyLock.KEYPRESS);

    const char = e.key === " " ? e.key : e.key.trim();

    if (char.length === 1) {
      this.invokeKeyEventHandlers({
        type: KeyPressComplexType.Key,
        key: char,
      });
    }

    this.handleKeyUnlock(KeyLock.KEYPRESS);
  };
}

export const docEventHandler = new DocumentEventHandler();
