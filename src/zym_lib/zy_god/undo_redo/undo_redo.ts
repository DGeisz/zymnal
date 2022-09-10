import { defaultTraitImplementationFactory } from "../../zy_trait/default_trait_zentinel/default_trait_zentinel_schema";
import { createZyTrait, CreateZyTraitSchema } from "../../zy_trait/zy_trait";
import { Cursor } from "../cursor/cursor";
import { BasicContext } from "../../utils/basic_context";
import {
  ZyBaseSchema,
  ZyPartialPersist,
  ZyPersistenceSchema,
  ZySchema,
} from "../../zy_schema/zy_schema";

export const ZYM_CHANGES = "zym_changes";

export interface ZymDiffState<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> {
  /* This should be a partially persisted Zym */
  zymState: Partial<ZyPartialPersist<Schema>>;
  /* Render opts */
  renderOpts?: any;
}

/* This allows us to move forward and backward through the undo stack */
export interface ZymChangeLink<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> {
  zymLocation: Cursor;
  beforeChange: ZymDiffState<Schema>;
  afterChange: ZymDiffState<Schema>;
}

export type ZymChangeFrame = {
  links: ZymChangeLink<any, any>[];
  beforeCursor: Cursor;
  afterCursor: Cursor;
};

export function getZymChangeLinks(
  ctx: BasicContext
): ZymChangeLink<any, any>[] | undefined {
  return ctx.get(ZYM_CHANGES);
}

export function addZymChangeLink<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
>(ctx: BasicContext, change: ZymChangeLink<Schema>) {
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

type UndoRedoSchema = CreateZyTraitSchema<{
  prepUndoRedo: {
    args: undefined;
    return: void;
  };
}>;

export const UndoRedoTrait = createZyTrait<UndoRedoSchema>(
  UNDO_REDO_COMMANDS_ID,
  {
    prepUndoRedo: "pur",
  }
);

export const defaultUndoRedoImplFactory = defaultTraitImplementationFactory(
  UndoRedoTrait,
  {
    async prepUndoRedo(zym) {
      zym.children.forEach((c) =>
        c.callTraitMethod(UndoRedoTrait.prepUndoRedo, undefined)
      );
    },
  }
);
