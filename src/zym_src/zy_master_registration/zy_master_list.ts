import { ZyMaster } from "../../zym_lib/zym/zy_master";
import { zageMaster } from "../zyms/zage/zage_master";
import { zymbolInfrastructureMasters } from "../zyms/zymbol_infrastructure/zymbol_infrastructure";

export const zyMasterList: ZyMaster[] = [
  zageMaster,
  ...zymbolInfrastructureMasters,
];
