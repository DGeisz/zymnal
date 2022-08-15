import {
  createZentinelMethodList,
  ZentinelMethodSchema,
} from "../../../../zym_lib/hermes/hermes";
import { Cursor } from "../../../../zym_lib/zy_god/cursor/cursor";
import { ZymKeyPress } from "../../../../zym_lib/zy_god/event_handler/key_press";
import {
  SourcedTransformer,
  TransformerFactory,
  ZymbolTransformer,
} from "./transformer/transformer";

export const ZYMBOL_FRAME_MASTER_ID = "zymbol_frame";

export interface ZymbolFrameSchema extends ZentinelMethodSchema {
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
    };
    return: ZymbolTransformer;
  };
}

export const ZymbolFrameMethod = createZentinelMethodList<ZymbolFrameSchema>(
  ZYMBOL_FRAME_MASTER_ID,
  {
    registerTransformer: 0,
    registerTransformerFactory: 0,
    getTransformer: 0,
  }
);
