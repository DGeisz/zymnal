import { Cursor, cursorBlink, CursorMoveResponse } from "./cursor";
import { Zocket } from "./zocket";

enum KeyLock {
  NONE,
  KEYPRESS,
  KEYDOWN,
}

export class ZymbolController {
  baseZocket: Zocket = new Zocket();
  cursor: Cursor = [0];
  keyLock: KeyLock = KeyLock.NONE;

  /* This is passed to the controller and is used by the controller to indicate
  to the react tree that something is changed, and that we need to re-render */
  rerender: () => void;

  constructor(rerender: () => void) {
    this.rerender = rerender;
    this.setEventListeners();
  }

  setEventListeners = () => {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keypress", this.handleKeyPress);
  };

  acquireKeyLock = (lock: KeyLock) => {
    if (this.keyLock === KeyLock.NONE) {
      this.keyLock = lock;
    }
  };

  handleKeyUnlock = (keyLock: KeyLock) => {
    if (this.keyLock === keyLock) {
      this.rerender();
      cursorBlink.restartTimer();

      this.keyLock = KeyLock.NONE;
    }
  };

  handleKeyDown = (event: KeyboardEvent) => {
    this.acquireKeyLock(KeyLock.KEYDOWN);

    const key = event.key;

    if (key === "ArrowUp") {
      this.moveCursorUp();
    } else if (key === "ArrowDown") {
      this.moveCursorDown();
    } else if (key === "ArrowLeft") {
      this.moveCursorLeft();
    } else if (key === "ArrowRight") {
      this.moveCursorRight();
    } else if (key === "Backspace") {
      this.delete();
    } else if (key === "Enter") {
      //   this.createZymbol();
    }

    this.handleKeyUnlock(KeyLock.KEYDOWN);
  };

  handleKeyPress = (e: KeyboardEvent) => {
    this.acquireKeyLock(KeyLock.KEYPRESS);

    const char = e.key === " " ? e.key : e.key.trim();

    console.trace("keypress: ", char);

    this.addCharacter(char);

    this.handleKeyUnlock(KeyLock.KEYPRESS);
  };

  moveCursorLeft = () => {
    this.handleCursorResponse(this.baseZocket.moveCursorLeft(this.cursor));
  };

  moveCursorRight = () => {
    this.handleCursorResponse(this.baseZocket.moveCursorRight(this.cursor));
  };

  moveCursorUp = () => {};
  moveCursorDown = () => {};

  delete = () => {
    this.handleCursorResponse(this.baseZocket.delete(this.cursor));
  };

  addCharacter = (character: string) => {
    this.handleCursorResponse(
      this.baseZocket.addCharacter(character, this.cursor)
    );
  };

  private handleCursorResponse = (cursorResponse: CursorMoveResponse) => {
    if (cursorResponse.success) {
      this.cursor = cursorResponse.newRelativeCursor;
    }
  };

  renderTex = (): string => {
    return this.baseZocket.renderTex(this.cursor);
  };
}
