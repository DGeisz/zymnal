import {
  groupPathFactory,
  implementPartialCmdGroup,
  justPath,
  ZyCommandGroup,
  ZyCommandGroupType,
} from "../../zy_commands/zy_command_types";
import { Cursor } from "../cursor/cursor";
import { BasicContext } from "../types/context_types";

export {};

export const ZYM_CHANGES = "zym_changes";

export interface ZymDiffState {
  /* This should be a partially persisted Zym */
  zymState: any;
  /* Render opts */
  renderOpts?: any;
}

/* This allows us to move forward and backward through the undo stack */
export interface ZymChangeLink {
  zymLocation: Cursor;
  beforeChange: ZymDiffState;
  afterChange: ZymDiffState;
}

export type ZymChangeFrame = {
  links: ZymChangeLink[];
  beforeCursor: Cursor;
  afterCursor: Cursor;
};

export function getZymChangeLinks(
  ctx: BasicContext
): ZymChangeLink[] | undefined {
  return ctx.get(ZYM_CHANGES);
}

export function addZymChangeLink(ctx: BasicContext, change: ZymChangeLink) {
  let changes = getZymChangeLinks(ctx);

  if (!changes) {
    changes = [];
  }

  changes.push(change);

  ctx.set(ZYM_CHANGES, changes);
}

export class UndoRedoStack {
  changesPointer = 0;
  changesStack: ZymChangeFrame[] = [];

  setFirstFrame = (frame: ZymChangeFrame) => {
    this.changesStack[0] = frame;
    this.changesPointer = 1;
  };

  addChangeFrame = (frame: ZymChangeFrame) => {
    if (this.changesPointer < this.changesStack.length) {
      this.changesStack = this.changesStack.slice(0, this.changesPointer);
    }

    this.changesStack.push(frame);
    this.changesPointer++;
  };

  undo = (): ZymChangeFrame | undefined => {
    if (this.changesPointer > 1) {
      this.changesPointer--;
      return this.changesStack[this.changesPointer];
    }

    return undefined;
  };

  redo = (): ZymChangeFrame | undefined => {
    if (this.changesPointer < this.changesStack.length) {
      this.changesPointer++;

      return this.changesStack[this.changesPointer - 1];
    }

    return undefined;
  };
}

const UNDO_REDO_COMMANDS_ID = "undo-redo-f23a9";
const ucc = groupPathFactory(UNDO_REDO_COMMANDS_ID);

interface UndoRedoCommandType extends ZyCommandGroupType {
  prepUndoRedo: {
    args: undefined;
    return: void;
  };
}

export const UndoRedoCommand: ZyCommandGroup<UndoRedoCommandType> = {
  prepUndoRedo: justPath(ucc("pur")),
};

export const defaultUndoRedoImpl = implementPartialCmdGroup(UndoRedoCommand, {
  async prepUndoRedo(zym) {
    zym.children.forEach((c) => c.cmd(UndoRedoCommand.prepUndoRedo));
  },
});