import { FC } from "react";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { KeyPressResponse } from "../../../../zym_lib/zym/zym_types";
import { Cursor } from "../../../../zym_lib/zy_god/cursor/cursor";
import {
  ZymKeyPress,
  KeyPressContext,
} from "../../../../zym_lib/zy_god/types/context_types";
import { zymbolFrameMaster } from "./zf_master";
import { ZymbolFramePersist } from "./zf_persist";

export class ZymbolFrame extends Zyact<ZymbolFramePersist> {
  component: FC = () => <div />;
  /* TODO: Need to add the the base zocket */
  children: Zym<any, any>[] = [];

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
