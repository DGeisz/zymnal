import { Zyact } from "../zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym/zy_master";
import { ZyId } from "../zy_types/basic_types";
import { Cursor, CursorMoveResponse, getInitialCursor } from "./cursor/cursor";
import { docEventHandler } from "./event_handler/document_event_handler";
import {
  KeyPressArgs,
  KeyPressCommand,
  ZymKeyPress,
} from "./event_handler/key_press";
import { newContext } from "./types/context_types";

export const ZyGodId: ZyId = "zyGod";

class ZyGod extends ZyMaster {
  zyId: string = ZyGodId;
  private masterRegistry: Map<ZyId, ZyMaster> = new Map();
  private cursor: Cursor = [];
  private root?: Zyact;

  constructor() {
    super();
    docEventHandler.addKeyHandler(this.handleKeyPress);
  }

  handleKeyPress = (event: ZymKeyPress) => {
    if (this.root) {
      /* TODO: Handle move response... */
      this.root.cmd<CursorMoveResponse, KeyPressArgs>(
        KeyPressCommand.handleKeyPress,
        {
          cursor: this.cursor,
          keyPress: event,
          keyPressContext: newContext(),
        }
      );
    }
  };

  registerMasters(masters: ZyMaster[]) {
    for (const master of masters) {
      this.masterRegistry.set(master.zyId, master);
    }
  }

  setRoot(root: Zyact) {
    this.root = root;
    this.cursor = getInitialCursor(this.root);

    console.log("This is cursor", this.cursor);
  }
}

export const zyGod = new ZyGod();
