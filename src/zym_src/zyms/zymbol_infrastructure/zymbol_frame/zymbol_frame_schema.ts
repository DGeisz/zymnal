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
import { ZocketSchema } from "../../zymbol/zymbols/zocket/zocket_schema";
import {
  SourcedTransformer,
  TransformerFactory,
  TransformerTypeFilter,
  ZymbolTransformer,
} from "./transformer/transformer";
import { ZymbolFrame } from "./zymbol_frame";

export const ZYMBOL_FRAME_MASTER_ID = "zymbol_frame";

export type ZymbolFrameMethodSchema = CreateZentinelMethodSchema<{
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
