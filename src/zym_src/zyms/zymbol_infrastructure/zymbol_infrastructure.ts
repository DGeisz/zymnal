import { Zentinel } from "../../../zym_lib/zentinel/zentinel";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { zymbolModuleMaster } from "./zymbol_module/zymbol_module";
import { stdZymbolTransformers } from "./zymbol_frame/transformer/std_transformers/std_transformers_registry";
import { zymbolFrameMaster } from "./zymbol_frame/zymbol_frame";
import { zymbolProgressionMaster } from "./zymbol_progression/zymbol_progression";
import { standaloneEquationMaster } from "./zymbol_module/module_lines/standalone_equation/standalone_equation";
import { derivationMaster } from "./zymbol_module/module_lines/derivation/derivation";
import { inlineInputMaster } from "./zymbol_module/module_lines/inline_input/inline_input";

export const zymbolInfrastructureMasters: ZyMaster[] = [
  zymbolModuleMaster,
  zymbolProgressionMaster,
  zymbolFrameMaster,
  inlineInputMaster,
  standaloneEquationMaster,
  derivationMaster,
];

export const zymbolInfrastructureZentinels: Zentinel<any>[] = [
  ...stdZymbolTransformers,
];
