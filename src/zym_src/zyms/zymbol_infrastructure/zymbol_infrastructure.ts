import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { zymbolContextMaster } from "./zymbol_context/zc_master";
import { zymbolProgressionMaster } from "./zymbol_progression/zp_master";

export const zymbolInfrastructureMasters: ZyMaster[] = [
  zymbolContextMaster,
  zymbolProgressionMaster,
];
