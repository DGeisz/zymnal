import { ControlledAwaiter } from "../../global_utils/promise_utils";
import { Hermes, HermesMessage, ZentinelMessage } from "../hermes/hermes";
import { Zentinel } from "../zentinel/zentinel";
import { Zym, ZymPersist } from "../zym/zym";
import { Zyact } from "../zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../zym/zy_master";
import {
  isSome,
  NONE,
  ok,
  some,
  UNIMPLEMENTED,
  unwrap,
  unwrapOption,
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
} from "./event_handler/key_press";
import { newContext } from "./types/context_types";

export const ZyGodId: ZyId = "zyGod";

enum ZyGodZentinelMessage {
  GetZymRoot = "gzr",
  HydratePersistedZym = "hpr",
}

export const CreateZyGodMessage = {
  hydrateZym(p: ZymPersist<any>): HermesMessage {
    return {
      zentinelId: ZyGodId,
      message: ZyGodZentinelMessage.HydratePersistedZym,
      content: p,
    };
  },
};

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
    this.zyGodHermes.registerZentinel(this);
  }

  private handleCursorChange = (newCursor: Cursor) => {
    this.root?.cmd<any, CursorRenderArgs>(CursorCommand.cursorRender, {
      oldCursor: some(this.cursor),
      newCursor: some(newCursor),
    });

    this.cursor = newCursor;
  };

  handleKeyPress = async (event: ZymKeyPress) => {
    if (this.root) {
      const moveResponse = unwrap(
        await this.root.cmd<CursorMoveResponse, KeyPressArgs>(
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

  async setRoot(root: Zyact) {
    this.root = root;
    this.rootAwaiter.trigger();

    const cursorOpt = unwrap(
      await this.root.cmd<GetInitialCursorReturn>(
        CursorCommand.getInitialCursor
      )
    );

    if (isSome(cursorOpt)) {
      this.cursor = cursorOpt.val;
    }
  }

  handleMessage = async (msg: ZentinelMessage): Promise<ZyResult<any>> => {
    switch (msg.message) {
      case ZyGodZentinelMessage.GetZymRoot: {
        await this.rootAwaiter.awaitTrigger();

        return ok(this.root);
      }
      case ZyGodZentinelMessage.HydratePersistedZym: {
        const { m: masterId, d: zymData }: ZymPersist<any> = msg.content!;

        const master = this.masterRegistry.get(masterId);

        if (master) {
          const zym = await master.hydrate(zymData);

          return ok(some(zym));
        }

        return ok(NONE);
      }
      default: {
        return UNIMPLEMENTED;
      }
    }
  };

  hydrate(_p: {}): Promise<Zym<any, any, any>> {
    throw new Error(
      "If you're hydrating the zym god, something's gone horribly wrong"
    );
  }

  newBlankChild(): Zym<any, any, any> {
    throw new Error("This god don't have no son bitches");
  }
}

export const zyGod = new ZyGod();
