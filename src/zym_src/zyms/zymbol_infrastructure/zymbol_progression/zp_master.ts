import { ZyMaster } from "../../../../zym_lib/zym/zy_master";

export const ZYMBOL_PROGRESSION_ID = "zymbol_progression";

class ZymbolProgressionMaster extends ZyMaster {
  zyId = ZYMBOL_PROGRESSION_ID;
}

export const zymbolProgressionMaster = new ZymbolProgressionMaster();
