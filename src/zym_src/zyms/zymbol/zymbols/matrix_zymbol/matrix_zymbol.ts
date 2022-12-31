import _ from "underscore";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  successfulMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
  extractCursorInfo,
  wrapChildCursorResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressModifier,
  ZymKeyPress,
  ZymbolDirection,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../../zym_lib/zym/utils/hydrate";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import { Zym } from "../../../../../zym_lib/zym/zym";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehavior,
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import {
  Zymbol,
  ZymbolRenderArgs,
  enterUsedToConfirmTransform,
  getKeyPress,
} from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { Zocket } from "../zocket/zocket";
import {
  BASIC_MATRIX_WRAPPER,
  EXTENDED_MATRIX_MAP,
  MATRIX_MAP,
  MATRIX_ZYMBOL_ID,
  MatrixMap,
  MatrixWrapperTex,
  MatrixZymbolSchema,
} from "./matrix_zymbol_schema";
import { deflectMethodToChild } from "../zymbol_utils";
import { DotModifiersTrait } from "../../../zymbol_infrastructure/zymbol_frame/transformer/std_transformers/equation_transformers/dot_modifiers/dot_modifiers_schema";
import { NONE, zySome } from "../../../../../zym_lib/utils/zy_option";
import { ActionCommandTrait } from "../../../zymbol_infrastructure/zymbol_frame/action_commands";
import { ZyGodMethod } from "../../../../../zym_lib/zy_god/zy_god_schema";

class MatrixZymbolMaster extends ZyMaster<MatrixZymbolSchema> {
  zyId: string = MATRIX_ZYMBOL_ID;

  newBlankChild() {
    return new MatrixZymbol(BASIC_MATRIX_WRAPPER, DUMMY_FRAME, 0, undefined);
  }
}

export const matrixZymbolMaster = new MatrixZymbolMaster();
extendZymbol(matrixZymbolMaster);

export class MatrixZymbol extends Zymbol<MatrixZymbolSchema> {
  zyMaster = matrixZymbolMaster;
  children: Zocket[];

  wrapper: MatrixWrapperTex;
  showEmptyZockets = true;

  rows = 1;
  cols = 1;

  constructor(
    wrapper: MatrixWrapperTex,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym | undefined
  ) {
    super(parentFrame, cursorIndex, parent);
    this.wrapper = wrapper;

    this.children = [new Zocket(this.parentFrame, 0, this)];

    this.setPersistenceSchemaSymbols({
      children: "c",
      cols: "cl",
      rows: "r",
      wrapper: "w",
      showEmptyZockets: "s",
    });
  }

  getMatrixZockets = (): Zocket[][] => {
    const allRows: Zocket[][] = [];

    for (let i = 0; i < this.rows; i++) {
      const currRow: Zocket[] = [];
      for (let k = 0; k < this.cols; k++) {
        currRow.push(this.children[i * this.cols + k]);
      }

      allRows.push(currRow);
    }

    return allRows;
  };

  getRowCol = (cursorIndex: CursorIndex): { row: number; col: number } => {
    return {
      row: Math.floor(cursorIndex / this.cols),
      col: cursorIndex % this.cols,
    };
  };

  getRow = (row: number) => {
    const r: Zocket[] = [];

    for (let i = 0; i < this.cols; i++) {
      r.push(this.children[row * this.cols + i]);
    }

    return r;
  };

  getCol = (col: number) => {
    const c: Zocket[] = [];

    for (let i = 0; i < this.rows; i++) {
      c.push(this.children[i * this.cols + col]);
    }

    return c;
  };

  getCursorFromRowCol = (row: number, col: number) => this.cols * row + col;

  createNewCol = (loc: number) => {
    const mat = this.getMatrixZockets();

    for (const row of mat) {
      row.splice(loc, 0, new Zocket(this.parentFrame, 0, this));
    }

    this.children = _.flatten(mat);

    this.cols++;
    this.reIndexChildren();
  };

  deleteCol = (loc: number) => {
    const mat = this.getMatrixZockets();

    for (const row of mat) {
      row.splice(loc, 1);
    }

    this.children = _.flatten(mat);

    this.cols--;
    this.reIndexChildren();
  };

  createNewRow = (loc: number) => {
    const mat = this.getMatrixZockets();

    const r = [];
    for (let i = 0; i < this.cols; i++) {
      r.push(new Zocket(this.parentFrame, 0, this));
    }

    mat.splice(loc, 0, r);

    this.children = _.flatten(mat);

    this.rows++;
    this.reIndexChildren();
  };

  deleteRow = (loc: number) => {
    const mat = this.getMatrixZockets();

    mat.splice(loc, 1);

    this.children = _.flatten(mat);

    this.rows--;
    this.reIndexChildren();
  };

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const keyPress: ZymKeyPress = getKeyPress(ctx);

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    /* SEE IF WE CREATE A ROW */
    /* We're basically checking if the cursor is at the end of a child */
    if (
      keyPress.modifiers &&
      keyPress.modifiers.includes(KeyPressModifier.Shift) &&
      0 === childRelativeCursor[0]
    ) {
      const { col } = this.getRowCol(nextCursorIndex);
      this.createNewCol(col);

      return successfulMoveResponse([nextCursorIndex, 0]);
    } else {
      const childMove = this.children[nextCursorIndex].moveCursorLeft(
        childRelativeCursor,
        ctx
      );

      if (childMove.success) {
        return wrapChildCursorResponse(childMove, nextCursorIndex);
      } else {
        const { row, col } = this.getRowCol(nextCursorIndex);

        if (col === 0) {
          return FAILED_CURSOR_MOVE_RESPONSE;
        } else {
          const newCursorIndex = this.getCursorFromRowCol(row, col - 1);

          return wrapChildCursorResponse(
            this.children[newCursorIndex].takeCursorFromRight(ctx),
            newCursorIndex
          );
        }
      }
    }
  };

  takeCursorFromLeft = (ctx: BasicContext): CursorMoveResponse => {
    const i = this.getCursorFromRowCol(Math.floor(this.rows / 2), 0);

    return wrapChildCursorResponse(this.children[i].takeCursorFromLeft(ctx), i);
  };

  moveCursorRight = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const keyPress: ZymKeyPress = getKeyPress(ctx);

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    /* SEE IF WE CREATE A ROW */
    /* We're basically checking if the cursor is at the end of a child */
    if (
      keyPress.modifiers &&
      keyPress.modifiers.includes(KeyPressModifier.Shift) &&
      this.children[nextCursorIndex].children.length === childRelativeCursor[0]
    ) {
      const { row, col } = this.getRowCol(nextCursorIndex);
      this.createNewCol(col + 1);
      const newIndex = this.getCursorFromRowCol(row, col + 1);

      return successfulMoveResponse([newIndex, 0]);
    } else {
      const childMove = this.children[nextCursorIndex].moveCursorRight(
        childRelativeCursor,
        ctx
      );

      if (childMove.success) {
        return wrapChildCursorResponse(childMove, nextCursorIndex);
      } else {
        const { row, col } = this.getRowCol(nextCursorIndex);

        if (col === this.cols - 1) {
          return FAILED_CURSOR_MOVE_RESPONSE;
        } else {
          const newCursorIndex = this.getCursorFromRowCol(row, col + 1);

          return wrapChildCursorResponse(
            this.children[newCursorIndex].takeCursorFromLeft(ctx),
            newCursorIndex
          );
        }
      }
    }
  };

  defaultKeyPressHandler = (
    keyPress: ZymKeyPress,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    if (
      keyPress.type === KeyPressBasicType.Enter &&
      nextCursorIndex < this.children.length - 1 &&
      childRelativeCursor.length === 1 &&
      this.children[nextCursorIndex].children.length === childRelativeCursor[0]
    ) {
      if (enterUsedToConfirmTransform(ctx)) {
        this.callZ(ZyGodMethod.queueSimulatedKeyPress, {
          type: KeyPressBasicType.Enter,
        });
      }

      return wrapChildCursorResponse(
        this.children[nextCursorIndex + 1].takeCursorFromLeft(ctx),
        nextCursorIndex + 1
      );
    }

    return wrapChildCursorResponse(
      this.children[nextCursorIndex].defaultKeyPressHandler(
        keyPress,
        childRelativeCursor,
        ctx
      ),
      nextCursorIndex
    );
  };

  takeCursorFromRight = (ctx: BasicContext): CursorMoveResponse => {
    const i = this.getCursorFromRowCol(
      Math.floor(this.rows / 2),
      this.cols - 1
    );

    return wrapChildCursorResponse(
      this.children[i].takeCursorFromRight(ctx),
      i
    );
  };

  moveCursorUp = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const keyPress: ZymKeyPress = getKeyPress(ctx);

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    /* SEE IF WE CREATE A ROW */
    /* We're basically checking if the cursor is at the end of a child */
    if (
      keyPress.modifiers &&
      keyPress.modifiers.includes(KeyPressModifier.Shift)
    ) {
      const { row } = this.getRowCol(nextCursorIndex);
      this.createNewRow(row);

      return successfulMoveResponse([nextCursorIndex, 0]);
    } else {
      const childMove = this.children[nextCursorIndex].moveCursorUp(
        childRelativeCursor,
        ctx
      );

      if (childMove.success) {
        return wrapChildCursorResponse(childMove, nextCursorIndex);
      } else {
        const { row, col } = this.getRowCol(nextCursorIndex);

        if (row === 0) {
          return FAILED_CURSOR_MOVE_RESPONSE;
        } else {
          const newCursorIndex = this.getCursorFromRowCol(row - 1, col);

          return wrapChildCursorResponse(
            this.children[newCursorIndex].takeCursorFromRight(ctx),
            newCursorIndex
          );
        }
      }
    }
  };

  captureArrowUp(
    fromSide: ZymbolDirection,
    ctx: BasicContext
  ): CursorMoveResponse {
    const i = this.getCursorFromRowCol(
      0,
      fromSide === ZymbolDirection.LEFT ? 0 : this.cols - 1
    );

    return wrapChildCursorResponse(this.children[i].takeCursorFromLeft(ctx), i);
  }

  moveCursorDown = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const keyPress: ZymKeyPress = getKeyPress(ctx);

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    /* SEE IF WE CREATE A ROW */
    /* We're basically checking if the cursor is at the end of a child */
    if (
      keyPress.modifiers &&
      keyPress.modifiers.includes(KeyPressModifier.Shift)
    ) {
      const { row, col } = this.getRowCol(nextCursorIndex);
      this.createNewRow(row + 1);

      const newCursor = this.getCursorFromRowCol(row + 1, col);

      return successfulMoveResponse([newCursor, 0]);
    } else {
      const childMove = this.children[nextCursorIndex].moveCursorDown(
        childRelativeCursor,
        ctx
      );

      if (childMove.success) {
        return wrapChildCursorResponse(childMove, nextCursorIndex);
      } else {
        const { row, col } = this.getRowCol(nextCursorIndex);

        if (row === this.rows - 1) {
          return FAILED_CURSOR_MOVE_RESPONSE;
        } else {
          const newCursorIndex = this.getCursorFromRowCol(row + 1, col);

          return wrapChildCursorResponse(
            this.children[newCursorIndex].takeCursorFromLeft(ctx),
            newCursorIndex
          );
        }
      }
    }
  };

  captureArrowDown(
    fromSide: ZymbolDirection,
    ctx: BasicContext
  ): CursorMoveResponse {
    const i = this.getCursorFromRowCol(
      this.rows - 1,
      fromSide === ZymbolDirection.LEFT ? 0 : this.cols - 1
    );

    return wrapChildCursorResponse(this.children[i].takeCursorFromLeft(ctx), i);
  }

  addCharacter(
    character: string,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse {
    const { nextCursorIndex, childRelativeCursor, parentOfCursorElement } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }

    if (nextCursorIndex > -1) {
      const res = wrapChildCursorResponse(
        this.children[nextCursorIndex].addCharacter(
          character,
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      );

      return res;
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  }

  getDeleteBehavior(): DeleteBehavior {
    if (this.children.every((c) => c.children.length === 0)) {
      return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
    } else {
      return deleteBehaviorNormal(DeleteBehaviorType.ABSORB);
    }
  }

  letParentDeleteWithDeleteBehavior = (cursor: Cursor, ctx: BasicContext) => {
    if (
      this.rows === 1 &&
      this.cols === 1 &&
      this.children[0].children.length === 0
    ) {
      return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
    }

    return undefined;
  };

  delete = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);
    const keyPress = getKeyPress(ctx);

    const db = this.children[nextCursorIndex].letParentDeleteWithDeleteBehavior(
      childRelativeCursor,
      ctx
    );

    if (db?.type === DeleteBehaviorType.ALLOWED) {
      if (
        keyPress.modifiers &&
        keyPress.modifiers.includes(KeyPressModifier.Shift)
      ) {
        const { row: rowI, col: colI } = this.getRowCol(nextCursorIndex);

        if (rowI === 0 && this.rows === 1) {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }

        const row = this.getRow(rowI);

        if (row.every((z) => z.children.length === 0)) {
          this.deleteRow(rowI);

          const newCursorIndex = this.getCursorFromRowCol(
            Math.max(rowI - 1, 0),
            colI
          );

          return wrapChildCursorResponse(
            this.children[newCursorIndex].takeCursorFromRight(ctx),
            newCursorIndex
          );
        } else {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      } else {
        const { row: rowI, col: colI } = this.getRowCol(nextCursorIndex);

        const col = this.getCol(colI);

        if (col.every((z) => z.children.length === 0)) {
          if (this.cols === 1) {
            this.deleteRow(rowI);

            const newCursorIndex = this.getCursorFromRowCol(
              Math.max(rowI - 1, 0),
              colI
            );

            return wrapChildCursorResponse(
              this.children[newCursorIndex].takeCursorFromRight(ctx),
              newCursorIndex
            );
          } else {
            this.deleteCol(colI);

            const newCursorIndex = this.getCursorFromRowCol(
              rowI,
              Math.max(colI - 1, 0)
            );

            return wrapChildCursorResponse(
              this.children[newCursorIndex].takeCursorFromRight(ctx),
              newCursorIndex
            );
          }
        } else {
          const newCursorIndex = Math.max(0, nextCursorIndex - 1);

          return wrapChildCursorResponse(
            this.children[newCursorIndex].takeCursorFromRight(ctx),
            newCursorIndex
          );
        }
      }
    }

    return deflectMethodToChild(
      cursor,
      ({ childRelativeCursor, nextCursorIndex }) => {
        return wrapChildCursorResponse(
          this.children[nextCursorIndex].delete(childRelativeCursor, ctx),
          nextCursorIndex
        );
      }
    );
  };

  renderTex(opts: ZymbolRenderArgs): string {
    if (!this.wrapper.envName) {
      throw Error("We're not dealing with fucking arrays yet");
    }

    const { cursor } = opts;
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);
    const noCursor = cursor.length === 0;

    let innerMatrixTex = "";
    const matForm = this.getMatrixZockets();

    matForm.forEach((row, i) => {
      row.forEach((col, k) => {
        const cIndex = i * this.cols + k;
        const cOpts = {
          ...opts,
          cursor: cIndex === nextCursorIndex ? childRelativeCursor : [],
        };

        let tex;

        if (noCursor && !this.showEmptyZockets) {
          if (col.children.length) {
            tex = col.renderTex(cOpts);
          } else {
            tex = "";
          }
        } else {
          tex = col.renderTex(cOpts);
        }

        if (k === 0) {
          innerMatrixTex += tex;
        } else {
          innerMatrixTex += ` & ${tex}`;
        }
      });

      innerMatrixTex += " \\\\ ";
    });

    return ` \\begin{${this.wrapper.envName}} ${innerMatrixTex} \\end{${this.wrapper.envName}} `;
  }

  persistData = () => {
    return {
      children: this.children.map((c) => c.persist()),
      cols: this.cols,
      rows: this.rows,
      wrapper: { ...this.wrapper },
      showEmptyZockets: this.showEmptyZockets,
    };
  };

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<MatrixZymbolSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      children: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild(this, c))
        )) as [Zocket, Zocket];
      },
      rows: (r) => {
        this.rows = r;
      },
      cols: (c) => {
        this.cols = c;
      },
      wrapper: (w) => {
        this.wrapper = w;
      },
      showEmptyZockets: (s) => {
        this.showEmptyZockets = s;
      },
    });
  }

  getRefreshedChildrenPointer(): Zym[] {
    return this.children;
  }
}

enum MATRIX_DOT_COMMANDS {
  HIDE = "hide",
  SHOW = "show",
}

const matrixDotMap: MatrixMap = {
  ...EXTENDED_MATRIX_MAP,
  p: EXTENDED_MATRIX_MAP.pmt,
  bk: EXTENDED_MATRIX_MAP.bmt,
  br: EXTENDED_MATRIX_MAP.brmt,
  vm: EXTENDED_MATRIX_MAP.vmt,
  vv: EXTENDED_MATRIX_MAP.vvmt,
  c: EXTENDED_MATRIX_MAP.case,
  rc: EXTENDED_MATRIX_MAP.rcase,
};

matrixZymbolMaster.implementTrait(DotModifiersTrait, {
  async getNodeTransforms() {
    return {
      id: {
        group: "matrix",
        item: "toggle",
      },
      transform: ({ zymbol, word }) => {
        const matrix = zymbol as MatrixZymbol;

        if (word === MATRIX_DOT_COMMANDS.HIDE) {
          matrix.showEmptyZockets = false;
          return zySome(matrix);
        } else if (word === MATRIX_DOT_COMMANDS.SHOW) {
          matrix.showEmptyZockets = true;
          return zySome(matrix);
        }

        if (word in matrixDotMap) {
          const wrapper = matrixDotMap[word];
          matrix.wrapper = wrapper;

          return zySome(matrix);
        }

        return NONE;
      },
      cost: 100,
    };
  },
});

matrixZymbolMaster.implementTrait(ActionCommandTrait, {
  checkActionLock: async (_zym, _cursor) => true,
});
