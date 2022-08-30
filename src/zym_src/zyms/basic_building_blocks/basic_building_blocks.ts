import { Zentinel } from "../../../zym_lib/zentinel/zentinel";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { zinputMaster } from "./zinput/zinput";

export const buildingBlockMasters: ZyMaster[] = [zinputMaster];

export const buildingBlockZentinels: Zentinel<any>[] = [];
