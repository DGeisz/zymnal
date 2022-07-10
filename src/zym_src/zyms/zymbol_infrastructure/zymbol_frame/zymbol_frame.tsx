import { FC } from "react";
import Tex from "../../../../global_building_blocks/tex/tex";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  isSome,
  ZyOption,
} from "../../../../zym_lib/zy_commands/zy_command_types";
import { Cursor } from "../../../../zym_lib/zy_god/cursor/cursor";
import { getRelativeCursor } from "../../../../zym_lib/zy_god/divine_api/divine_accessors";
import { Zocket } from "../../zymbol/zymbols/zocket/zocket";
import { frameCursorImpl } from "./cmd/zf_cursor";
import { ZymbolFramePersist } from "./zf_persist";

class ZymbolFrameMaster extends ZyMaster {
  zyId = "zymbol_frame";
}

export const zymbolFrameMaster = new ZymbolFrameMaster();

zymbolFrameMaster.registerCmds([...frameCursorImpl]);

interface FrameRenderProps {
  relativeCursor?: ZyOption<Cursor>;
}

export class ZymbolFrame extends Zyact<ZymbolFramePersist, FrameRenderProps> {
  zyMaster: ZyMaster = zymbolFrameMaster;

  baseZocket: Zocket = new Zocket(true, this, 0, this);
  children: Zym<any, any>[] = [this.baseZocket];

  /* TODO: Implement a TeX component */
  component: FC<FrameRenderProps> = (props) => {
    let cursorOpt;

    if (props.relativeCursor) {
      cursorOpt = props.relativeCursor;
    } else {
      cursorOpt = getRelativeCursor(this.baseZocket);
    }

    const relativeCursor = isSome(cursorOpt) ? cursorOpt.val : [];

    const frameTex = this.baseZocket.renderTex({
      cursor: relativeCursor,
    });

    console.log("frame text", JSON.stringify(frameTex));

    return <Tex tex={frameTex} />;
  };

  persist(): ZymbolFramePersist {
    return {};
  }

  hydrate(_persisted: ZymbolFramePersist): void {}
}
