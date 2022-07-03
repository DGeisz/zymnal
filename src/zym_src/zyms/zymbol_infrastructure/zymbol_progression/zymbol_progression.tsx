import { FC } from "react";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { KeyPressResponse } from "../../../../zym_lib/zym/zym_types";
import { Cursor } from "../../../../zym_lib/zy_god/cursor";
import {
  ZymKeyPress,
  KeyPressContext,
} from "../../../../zym_lib/zy_god/types/context_types";
import { ZymbolFrame } from "../zymbol_frame/zymbol_frame";
import { zymbolProgressionMaster } from "./zp_master";
import { ZymbolProgressionPersist } from "./zp_persist";

export class ZymbolProgression extends Zyact<ZymbolProgressionPersist> {
  baseFrame: ZymbolFrame = new ZymbolFrame(0, this);
  children: Zym<any, any>[] = [];

  component: FC = () => <div>What's up?</div>;

  getInitialCursor(): Cursor {
    throw new Error("Method not implemented.");
  }

  handleKeyPress(
    keyPress: ZymKeyPress,
    ctx: KeyPressContext
  ): KeyPressResponse {
    throw new Error("Method not implemented.");
  }

  persist() {
    return {};
  }

  hydrate(_persisted: any): void {}

  getZyMasterId(): string {
    return zymbolProgressionMaster.zyId;
  }
}
