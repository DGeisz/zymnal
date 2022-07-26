import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { zymbolContextMaster } from "./zymbol_context/zymbol_context";
import { zymbolFrameMaster } from "./zymbol_frame/zymbol_frame";
import { zymbolProgressionMaster } from "./zymbol_progression/zymbol_progression";

export const zymbolInfrastructureMasters: ZyMaster[] = [
  zymbolContextMaster,
  zymbolProgressionMaster,
  zymbolFrameMaster,
];
