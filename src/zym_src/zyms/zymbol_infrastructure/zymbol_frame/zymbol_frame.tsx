import { FC } from "react";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { Cursor } from "../../../../zym_lib/zy_god/cursor/cursor";
import { Zocket } from "../../zymbol/zymbols/zocket/zocket";
import { frameCursorImpl } from "./cmd/zf_cursor";
import { ZymbolFramePersist } from "./zf_persist";

class ZymbolFrameMaster extends ZyMaster {
  zyId = "zymbol_frame";
}

export const zymbolFrameMaster = new ZymbolFrameMaster();

zymbolFrameMaster.registerCmds([...frameCursorImpl, ...frameCursorImpl]);

export class ZymbolFrame extends Zyact<ZymbolFramePersist> {
  zyMaster: ZyMaster = zymbolFrameMaster;

  baseZocket: Zocket = new Zocket(true, this, 0, this);
  children: Zym<any, any>[] = [this.baseZocket];

  component: FC = () => <div />;

  getInitialCursor(): Cursor {
    /* We'll basically want to get the initial cursor 
    from the the bottom zocket that holds everything */
    throw new Error("Method not implemented.");
  }

  persist(): ZymbolFramePersist {
    return {};
  }

  hydrate(_persisted: ZymbolFramePersist): void {}
}
