import React from "react";
import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../zym_lib/hermes/hermes";
import {
  Cursor,
  CursorMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
  NO_CURSOR_MOVE_RESPONSE,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import { ZymKeyPress } from "../../../../zym_lib/zy_god/event_handler/key_press";
import {
  CreateZySchema,
  IdentifiedBaseSchema,
  zyIdentifierFactory,
  ZymPersist,
} from "../../../../zym_lib/zy_schema/zy_schema";
import { Zymbol } from "../../zymbol/zymbol";
import { Zocket } from "../../zymbol/zymbols/zocket/zocket";
import { ZocketSchema } from "../../zymbol/zymbols/zocket/zocket_schema";
import {
  SourcedTransformer,
  TransformerFactory,
  TransformerTypeFilter,
  ZymbolTransformer,
} from "./transformer/transformer";
import { ZymbolFrame } from "./zymbol_frame";
import { BasicContext } from "../../../../zym_lib/utils/basic_context";

export const ZYMBOL_FRAME_MASTER_ID = "zymbol_frame";

export interface ActionFactory {
  source: string;
  name: string;
}

export abstract class FrameAction {
  abstract priority: FrameActionPriority;
  parentFrame?: ZymbolFrame;

  /* If the action transformers the zymbol tree, 
  this is used to preview the result of the transformation */
  getFramePreview(): void | {
    newTreeRoot: Zocket;
    cursor: Cursor;
  } {}

  abstract getActionPreviewComponent(): React.FC;

  setRootParentFrame(_zymbolFrame: ZymbolFrame): void {}

  getParentFrame(): ZymbolFrame {
    if (!this.parentFrame) throw new Error("Parent frame not set!");

    return this.parentFrame;
  }

  abstract runAction(keyPressContext?: BasicContext): CursorMoveResponse;

  setParentFrame = (p: ZymbolFrame) => {
    this.parentFrame = p;
  };

  /* We use this to see if the keypress is allowed to
    be used to confirm the transformation (see in_place_symbols for 
    an example of when we don't do this)  */
  checkKeypressConfirms = (_keyPress: ZymKeyPress): boolean => true;

  /* Indicates whether the transformation did something with the keypress */
  handleKeyPress = (_keyPress: ZymKeyPress): boolean => false;
}

export class DefaultNoOpAction extends FrameAction {
  constructor(parentFrame: ZymbolFrame) {
    super();
    this.parentFrame = parentFrame;
  }

  runAction(_keyPressContext?: BasicContext | undefined): CursorMoveResponse {
    this.getParentFrame().setNewActions([]);

    return NO_CURSOR_MOVE_RESPONSE;
  }
  /* This doesn't actually matter */
  priority: FrameActionPriority = { cost: 0, rank: FrameActionRank.Include };

  getActionPreviewComponent(): React.FC<{}> {
    return () => {
      return <div className="font-semibold text-gray-400">Default</div>;
    };
  }
}

export enum FrameActionRank {
  /* Means that the action is immediately enacted,
  and the user has to change out in order to access something else */
  Suggest = 0,
  /* The transformation is included, but the user has to select the
  transform in order to access it
   */
  Include = 1,
}

export interface FrameActionPriority {
  rank: FrameActionRank;
  cost: number;
}

export type ZymbolFrameMethodSchema = CreateZentinelMethodSchema<{
  registerActionFactory: {
    args: ActionFactory;
    return: void;
  };
  getFrameActions: {
    args: {
      rootZymbol: Zymbol;
      cursor: Cursor;
      parentFrame: ZymbolFrame;
      zymbolCursor: Cursor;
      keyPress: ZymKeyPress;
      typeFilters: TransformerTypeFilter[];
    };
    return: FrameAction[];
  };
  registerTransformer: {
    args: SourcedTransformer;
    return: void;
  };
  registerTransformerFactory: {
    args: TransformerFactory;
    return: void;
  };
  getTransformer: {
    args: {
      cursor: Cursor;
      keyPress: ZymKeyPress;
      typeFilters: TransformerTypeFilter[];
    };
    return: ZymbolTransformer;
  };
}>;

export const ZymbolFrameMethod =
  createZentinelMethodList<ZymbolFrameMethodSchema>(ZYMBOL_FRAME_MASTER_ID, {
    registerActionFactory: 0,
    getFrameActions: 0,
    registerTransformer: 0,
    registerTransformerFactory: 0,
    getTransformer: 0,
  });

export const STD_FRAME_LABELS = {
  EQUATION: "equation",
  INPUT: "input",
};

export interface ZymbolFrameOpts {
  inlineFrame?: boolean;
  getTypeFilters: (cursor: Cursor) => TransformerTypeFilter[];
  inlineTex: boolean;
}

export type ZymbolFrameSchema = CreateZySchema<
  {
    baseZocket: IdentifiedBaseSchema<ZocketSchema>;
    inlineTex: boolean;
  },
  {
    baseZocket: {
      persistenceSymbol: "b";
      persistenceType: ZymPersist<ZocketSchema>;
    };
    inlineTex: "i";
  }
>;

export const isZymbolFrame = zyIdentifierFactory<ZymbolFrame>(
  ZYMBOL_FRAME_MASTER_ID
);