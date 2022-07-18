import { ControlledAwaiter } from "../../global_utils/promise_utils";
import { Hermes, HermesMessage, ZentinelMessage } from "../hermes/hermes";
import { Zentinel } from "../zentinel/zentinel";
import { Zyact } from "../zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym/zy_master";
import {
  isSome,
  ok,
  some,
  UNIMPLEMENTED,
  unwrap,
  ZyResult,
} from "../zy_commands/zy_command_types";
import { ZyId } from "../zy_types/basic_types";
import { Cursor, CursorMoveResponse } from "./cursor/cursor";
import {
  CursorCommand,
  CursorRenderArgs,
  GetInitialCursorReturn,
} from "./cursor/cursor_commands";
import { docEventHandler } from "./event_handler/document_event_handler";
import {
  KeyPressArgs,
  KeyPressCommand,
  ZymKeyPress,
  KeyPressBasicType,
} from "./event_handler/key_press";
import { newContext } from "./types/context_types";

export const ZyGodId: ZyId = "zyGod";

enum ZyGodZentinelMessage {
  GetZymRoot = "gzr",
}

export const GET_ZYM_ROOT: HermesMessage = {
  zentinelId: ZyGodId,
  message: ZyGodZentinelMessage.GetZymRoot,
};

class ZyGod extends ZyMaster {
  zyId: string = ZyGodId;

  /* ZyGod Creates and Manages Hermes */
  private zyGodHermes: Hermes = new Hermes();

  private masterRegistry: Map<ZyId, ZyMaster> = new Map();
  private cursor: Cursor = [];
  private root?: Zyact;
  private rootAwaiter = new ControlledAwaiter();

  constructor() {
    super();

    docEventHandler.addKeyHandler(this.handleKeyPress);

    /* 
    We have to add this line because the zy god is both the 
    carrier of hermes and also a zentinel
    */
    this.fixHermes(this.zyGodHermes);
  }

  private handleCursorChange = (newCursor: Cursor) => {
    console.log("change cursor", this.cursor, newCursor);

    this.root?.cmd<any, CursorRenderArgs>(CursorCommand.cursorRender, {
      oldCursor: some(this.cursor),
      newCursor: some(newCursor),
    });

    this.cursor = newCursor;
  };

  handleKeyPress = (event: ZymKeyPress) => {
    console.log("kp", event, KeyPressBasicType.Delete);
    if (this.root) {
      const moveResponse = unwrap(
        this.root.cmd<CursorMoveResponse, KeyPressArgs>(
          KeyPressCommand.handleKeyPress,
          {
            cursor: this.cursor,
            keyPress: event,
            keyPressContext: newContext(),
          }
        )
      );

      if (moveResponse.success) {
        this.handleCursorChange(moveResponse.newRelativeCursor);
      }
    }
  };

  getCursorCopy = () => [...this.cursor];

  registerMasters(masters: ZyMaster[]) {
    for (const master of masters) {
      this.masterRegistry.set(master.zyId, master);
      this.zyGodHermes.registerZentinel(master);
    }
  }

  registerZentinels(zentinels: Zentinel[]) {
    for (const z of zentinels) {
      this.zyGodHermes.registerZentinel(z);
    }
  }

  setRoot(root: Zyact) {
    this.root = root;
    const cursorOpt = unwrap(
      this.root.cmd<GetInitialCursorReturn>(CursorCommand.getInitialCursor)
    );

    if (isSome(cursorOpt)) {
      this.cursor = cursorOpt.val;
    }

    console.log("This is cursor", this.cursor);
  }

  handleMessage = async (msg: ZentinelMessage): Promise<ZyResult<any>> => {
    switch (msg.message) {
      case ZyGodZentinelMessage.GetZymRoot: {
        await this.rootAwaiter.awaitTrigger();

        return ok(this.root);
      }
      default: {
        return UNIMPLEMENTED;
      }
    }
  };
}

export const zyGod = new ZyGod();
