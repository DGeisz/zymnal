import { FC } from "react";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { KeyPressResponse } from "../../../../zym_lib/zym/zym_types";
import { Cursor } from "../../../../zym_lib/zy_god/cursor";
import {
  ZymKeyPress,
  KeyPressContext,
} from "../../../../zym_lib/zy_god/types/basic_types";
import { ZYMBOL_FRAME_ID } from "./zf_master";
import { ZymbolFramePersist } from "./zf_persist";

export class ZymbolFrame extends Zyact<ZymbolFramePersist> {
  component: FC = (props) => <div />;

  getZyMasterId(): string {
    return ZYMBOL_FRAME_ID;
  }

  getInitialCursor(): Cursor {
    /* We'll basically want to get the initial cursor 
    from the the bottom zocket that holds everything */
    throw new Error("Method not implemented.");
  }

  handleKeyPress(
    keyPress: ZymKeyPress,
    ctx: KeyPressContext
  ): KeyPressResponse {
    throw new Error("Method not implemented.");
  }

  persist(): ZymbolFramePersist {
    return {};
  }

  hydrate(_persisted: ZymbolFramePersist): void {}
}
