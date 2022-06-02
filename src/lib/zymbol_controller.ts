import { Cursor, cursorBlink, CursorMoveResponse } from "./cursor";
import { Zocket } from "./zocket";

export class ZymbolController {
  baseZocket: Zocket = new Zocket();
  cursor: Cursor = [0];

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

  handleKeyDown = (event: KeyboardEvent) => {
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
      //   this.deleteZymbol();
    } else if (key === "Enter") {
      //   this.createZymbol();
    }

    cursorBlink.restartTimer();
  };

  handleKeyPress = (e: KeyboardEvent) => {
    const char = e.key === " " ? e.key : e.key.trim();

    console.log("keypress: ", char);

    this.addCharacter(char);
  };

  moveCursorLeft = () => {
    this.handleCursorResponse(this.baseZocket.moveCursorLeft(this.cursor));
  };

  moveCursorRight = () => {
    this.handleCursorResponse(this.baseZocket.moveCursorRight(this.cursor));
  };

  moveCursorUp = () => {};
  moveCursorDown = () => {};

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
    const tex = this.baseZocket.renderTex(this.cursor);

    console.log("tex", JSON.stringify(tex));

    return tex;
  };
}
