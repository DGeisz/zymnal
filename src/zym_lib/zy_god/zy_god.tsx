import { Zyact } from "../zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym/zy_master";
import { ZyId } from "../zy_types/basic_types";
import { Cursor } from "./cursor";
import { docEventHandler } from "./event_handler/document_event_handler";
import { ZymKeyPress } from "./types/basic_types";

class ZyGod {
  private masterRegistry: Map<ZyId, ZyMaster> = new Map();
  private cursor: Cursor = [];
  private root?: Zyact;

  constructor() {
    docEventHandler.addKeyHandler(this.handleKeyPress);
  }

  handleKeyPress = (event: ZymKeyPress) => {
    if (this.root) {
      const _res = this.root.handleKeyPress(event, { cursor: this.cursor });

      /* TODO: Handle cursor response */
    }
  };

  registerMasters(masters: ZyMaster[]) {
    for (const master of masters) {
      this.masterRegistry.set(master.getZyId(), master);
    }
  }

  setRoot(root: Zyact) {
    this.root = root;

    this.cursor = this.root!.getInitialCursor();
  }
}

export const zyGod = new ZyGod();
