import { Zyact } from "../zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym/zy_master";
import { ZyId } from "../zy_types/basic_types";

class ZyGod {
  private masterRegistry: Map<ZyId, ZyMaster> = new Map();

  registerMasters(masters: ZyMaster[]) {
    for (const master of masters) {
      this.masterRegistry.set(master.getZyId(), master);
    }
  }

  setRoot(root: Zyact) {}
}

export const zyGod = new ZyGod();
