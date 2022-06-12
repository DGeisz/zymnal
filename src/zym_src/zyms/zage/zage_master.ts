import { ZyMaster } from "../../../zym_lib/zym/zy_master";

export const ZAGE_ID = "zage";

class ZageMaster extends ZyMaster {
  getZyId(): string {
    return ZAGE_ID;
  }
}

export const zageMaster = new ZageMaster();
