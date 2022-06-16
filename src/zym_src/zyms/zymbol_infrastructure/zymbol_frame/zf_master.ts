import { ZyMaster } from "../../../../zym_lib/zym/zy_master";

export const ZYMBOL_FRAME_ID = "zymbol_frame";

class ZymbolFrameMaster extends ZyMaster {
  getZyId(): string {
    return ZYMBOL_FRAME_ID;
  }
}

export const zymbolFrameMaster = new ZymbolFrameMaster();
