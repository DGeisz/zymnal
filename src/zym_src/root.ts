import { Zentinel } from "../zym_lib/zentinel/zentinel";
import { Zyact } from "../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym_lib/zym/zy_master";
import { BASE_ZAGE, zageMaster } from "./zyms/zage/zage";
import { zymbolMasterList } from "./zyms/zymbol/zymbols/zymbol_list";
import {
  zymbolInfrastructureMasters,
  zymbolInfrastructureZentinels,
} from "./zyms/zymbol_infrastructure/zymbol_infrastructure";
import { defaultTraitZentinel } from "../zym_lib/zy_trait/default_trait_zentinel/default_trait_zentinel";
import { vimZentinel } from "./zentinels/vim_keypress_handler/vim_keypress_handler";
import { vimiumZentinel } from "./zyms/zymbol_infrastructure/zymbol_frame/building_blocks/vimium_mode/vimium_mode";
import {
  buildingBlockMasters,
  buildingBlockZentinels,
} from "./zyms/basic_building_blocks/basic_building_blocks";
import { editorInfrastructureMasters } from "./editor_infrastructure/editor_infrastructure";
import { fileServerClientZentinel } from "./zentinels/file_server_client/file_server_client";
import { persistenceZentinel } from "../zym_lib/persistence/persistence_zentinel";

const root = BASE_ZAGE;

export function getZymTreeRoot(): Zyact {
  return root;
}

export const zyMasterList: ZyMaster[] = [
  zageMaster,
  ...buildingBlockMasters,
  ...zymbolInfrastructureMasters,
  ...zymbolMasterList,
  ...editorInfrastructureMasters,
];

export const zentinelList: Zentinel[] = [
  defaultTraitZentinel,
  vimZentinel,
  fileServerClientZentinel,
  vimiumZentinel,
  persistenceZentinel,
  ...zymbolInfrastructureZentinels,
  ...buildingBlockZentinels,
];
