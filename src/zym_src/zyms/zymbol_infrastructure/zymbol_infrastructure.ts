import { Zentinel } from "../../../zym_lib/zentinel/zentinel";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { zymbolContextMaster } from "./zymbol_context/zymbol_context";
import { stdZymbolTransformers } from "./zymbol_frame/transformer/std_transformers/std_transformers_registry";
import { zymbolFrameMaster } from "./zymbol_frame/zymbol_frame";
import { zymbolProgressionMaster } from "./zymbol_progression/zymbol_progression";

export const zymbolInfrastructureMasters: ZyMaster[] = [
  zymbolContextMaster,
  zymbolProgressionMaster,
  zymbolFrameMaster,
];

export const zymbolInfrastructureZentinels: Zentinel<any>[] = [
  ...stdZymbolTransformers,
];
