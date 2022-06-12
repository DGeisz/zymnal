import { ZyMaster } from "../../../../zym_lib/zym/zy_master";

export const ZYMBOL_CONTEXT_ID = "zymbol_context";

class ZymbolContextMaster extends ZyMaster {
  getZyId(): string {
    return ZYMBOL_CONTEXT_ID;
  }
}

export const zymbolContextMaster = new ZymbolContextMaster();
