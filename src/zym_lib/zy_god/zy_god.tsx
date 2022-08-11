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
  ZyResult,
} from "../zy_commands/zy_command_types";
import { ZyId } from "../zy_types/basic_types";
import { Cursor, CursorMoveResponse } from "./cursor/cursor";
import {
  CursorCommand,
  CursorRenderArgs,
  GetInitialCursorReturn,
  ModifyNodeAndReRenderArgs,
} from "./cursor/cursor_commands";
import { docEventHandler } from "./event_handler/document_event_handler";
import {
  KeyPressArgs,
  KeyPressCommand,
  KeyPressComplexType,
  KeyPressModifier,
  ZymKeyPress,
} from "./event_handler/key_press";
import { BasicContext, newContext } from "./types/context_types";
import {
  getZymChangeLinks,
  UndoRedoCommand,
  UndoRedoStack,
} from "./undo_redo/undo_redo";

export const ZyGodId: ZyId = "zyGod";

enum ZyGodZentinelMessage {
  GetZymRoot = "gzr",
  HydratePersistedZym = "hpr",
  QueueSimulatedKeyPress = "qsk",
  TakeCursor = "tk",
}

export const CreateZyGodMessage = {
  hydrateZym(p: ZymPersist<any>): HermesMessage {
    return {
      zentinelId: ZyGodId,
      message: ZyGodZentinelMessage.HydratePersistedZym,
      content: p,
    };
  },
  queueSimulatedKeyPress(keyPress: ZymKeyPress): HermesMessage {
    return {
      zentinelId: ZyGodId,
      message: ZyGodZentinelMessage.QueueSimulatedKeyPress,
      content: keyPress,
    };
  },
  takeCursor(cursor: Cursor): HermesMessage {
    return {
      zentinelId: ZyGodId,
      message: ZyGodZentinelMessage.TakeCursor,
      content: cursor,
    };
  },
};

export const GET_ZYM_ROOT: HermesMessage = {
  zentinelId: ZyGodId,
  message: ZyGodZentinelMessage.GetZymRoot,
};

export const CONTEXT_CURSOR = "content-cursor-f4994b65";

export function getFullContextCursor(ctx: BasicContext): Cursor {
  return [...(ctx.get(CONTEXT_CURSOR) as Cursor)];
}

class ZyGod extends ZyMaster {
  zyId: string = ZyGodId;

  /* ZyGod Creates and Manages Hermes */
  private zyGodHermes: Hermes = new Hermes();

  private masterRegistry: Map<ZyId, ZyMaster> = new Map();
  private cursor: Cursor = [];
  private root?: Zyact;
  private rootAwaiter = new ControlledAwaiter();

  simulatedKeyPressQueue: ZymKeyPress[] = [];
  undoRedoStack: UndoRedoStack = new UndoRedoStack();

  constructor() {
    super();

    // @ts-ignore
    window.undo = this.undoRedoStack;

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

  handleUndo = async () => {
    await this.root?.cmd(UndoRedoCommand.prepUndoRedo);

    const frame = this.undoRedoStack.undo();

    if (frame) {
      const { links, beforeCursor } = frame;
      for (const link of links.reverse()) {
        const {
          beforeChange: { zymState, renderOpts },
          zymLocation,
        } = link;

        await this.root?.cmd<any, ModifyNodeAndReRenderArgs>(
          CursorCommand.modifyNodeAndReRender,
          {
            cursor: zymLocation,
            updates: zymState,
            renderOpts,
          }
        );
      }

      await this.handleCursorChange(beforeCursor);
    }
  };

  handleRedo = async () => {
    // await this.handleChangeFrame(this.undoRedoStack.redo(), false);

    await this.root?.cmd(UndoRedoCommand.prepUndoRedo);

    const frame = this.undoRedoStack.redo();

    if (frame) {
      const { links, afterCursor } = frame;
      for (const link of links.reverse()) {
        const {
          afterChange: { zymState, renderOpts },
          zymLocation,
        } = link;

        await this.root?.cmd<any, ModifyNodeAndReRenderArgs>(
          CursorCommand.modifyNodeAndReRender,
          {
            cursor: zymLocation,
            updates: zymState,
            renderOpts,
          }
        );
      }

      await this.handleCursorChange(afterCursor);
    }
  };

  handleKeyPress = async (event: ZymKeyPress) => {
    if (this.root) {
      if (
        event.type === KeyPressComplexType.Key &&
        event.modifiers &&
        event.modifiers.includes(KeyPressModifier.Cmd)
      ) {
        if (
          event.key === "z" &&
          !event.modifiers.includes(KeyPressModifier.Shift)
        ) {
          return await this.handleUndo();
        } else if (
          event.key === "z" &&
          event.modifiers.includes(KeyPressModifier.Shift)
        ) {
          return await this.handleRedo();
        } else if (event.key === "y") {
          return await this.handleRedo();
        }
      }

      const ctx = newContext();
      ctx.set(CONTEXT_CURSOR, [...this.cursor]);

      const moveResponse = unwrap(
        await this.root.cmd<CursorMoveResponse, KeyPressArgs>(
          KeyPressCommand.handleKeyPress,
          {
            cursor: this.cursor,
            keyPress: event,
            keyPressContext: ctx,
          }
        )
      );

      const beforeCursor = [...this.cursor];

      if (moveResponse.success)
        this.handleCursorChange(moveResponse.newRelativeCursor);

      const afterCursor = [...this.cursor];

      const links = getZymChangeLinks(ctx);

      if (links)
        this.undoRedoStack.addChangeFrame({
          links,
          beforeCursor,
          afterCursor,
        });

      if (this.simulatedKeyPressQueue.length > 0)
        this.handleKeyPress(this.simulatedKeyPressQueue.shift()!);
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
      this.undoRedoStack.setFirstFrame({
        beforeCursor: [],
        afterCursor: cursorOpt.val,
        links: [
          {
            zymLocation: [],
            beforeChange: {
              zymState: {},
            },
            afterChange: {
              zymState: this.root.persistData(),
            },
          },
        ],
      });

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
      case ZyGodZentinelMessage.QueueSimulatedKeyPress: {
        this.simulatedKeyPressQueue.push(msg.content);

        return ok(NONE);
      }
      case ZyGodZentinelMessage.TakeCursor: {
        this.handleCursorChange(msg.content);

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
