import React from "react";
import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../zym_lib/hermes/hermes";
import { Cursor } from "../../../../zym_lib/zy_god/cursor/cursor";
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

export const ZYMBOL_FRAME_MASTER_ID = "zymbol_frame";

export interface ActionFactory {
  source: string;
  name: string;
}

export abstract class FrameAction {
  abstract priority: FrameActionPriority;

  /* If the action transformers the zymbol tree, 
  this is used to preview the result of the transformation */
  abstract getFramePreview():
    | undefined
    | {
        newTreeRoot: Zocket;
        cursor: Cursor;
      };

  abstract getActionPreviewComponent(): React.FC;

  abstract setRootParentFrame(zymbolFrame: ZymbolFrame): void;

  /* We use this to see if the keypress is allowed to
    be used to confirm the transformation (see in_place_symbols for 
    an example of when we don't do this)  */
  checkKeypressConfirms = (_keyPress: ZymKeyPress): boolean => true;

  /* Indicates whether the transformation did something with the keypress */
  handleKeyPress = (_keyPress: ZymKeyPress): boolean => false;
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
