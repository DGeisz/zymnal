import { Zentinel } from "../zym_lib/zentinel/zentinel";
import { Zyact } from "../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym_lib/zym/zy_master";
import { Zage, zageMaster } from "./zyms/zage/zage";
import { zymbolMasterList } from "./zyms/zymbol/zymbols/zymbol_list";
import { zymbolInfrastructureMasters } from "./zyms/zymbol_infrastructure/zymbol_infrastructure";
import { defaultTraitZentinel } from "../zym_lib/zy_trait/default_trait_zentinel/default_trait_zentinel";
import { zymbolTransformers } from "./zyms/zymbol_infrastructure/zymbol_frame/transformers/transformers_registry";

const root = new Zage(0, undefined);

export function getZymTreeRoot(): Zyact {
  return root;
}

export const zyMasterList: ZyMaster<any>[] = [
  zageMaster,
  ...zymbolInfrastructureMasters,
  ...zymbolMasterList,
];

export const zentinelList: Zentinel<any>[] = [
  defaultTraitZentinel,
  ...zymbolTransformers,
];
