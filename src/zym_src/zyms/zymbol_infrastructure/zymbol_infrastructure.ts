import { Zentinel } from "../../../zym_lib/zentinel/zentinel";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { zymbolModuleMaster } from "./zymbol_module/zymbol_module";
import { stdZymbolTransformers } from "./zymbol_frame/transformer/std_transformers/std_transformers_registry";
import { zymbolFrameMaster } from "./zymbol_frame/zymbol_frame";
import { zymbolProgressionMaster } from "./zymbol_progression/zymbol_progression";
import { standardInputMaster } from "./zymbol_module/module_lines/standard_input/standard_input";
import { standaloneEquationMaster } from "./zymbol_module/module_lines/standalone_equation/standalone_equation";
import { derivationMaster } from "./zymbol_module/module_lines/derivation/derivation";

export const zymbolInfrastructureMasters: ZyMaster[] = [
  zymbolModuleMaster,
  zymbolProgressionMaster,
  zymbolFrameMaster,
  standardInputMaster,
  standaloneEquationMaster,
  derivationMaster,
];

export const zymbolInfrastructureZentinels: Zentinel<any>[] = [
  ...stdZymbolTransformers,
];
