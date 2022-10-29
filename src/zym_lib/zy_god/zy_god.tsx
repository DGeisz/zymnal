import { ControlledAwaiter } from "../../global_utils/promise_utils";
import { Hermes } from "../hermes/hermes";
import { Zentinel } from "../zentinel/zentinel";
import { Zym } from "../zym/zym";
import { ZyMaster } from "../zym/zy_master";
import { isSome, NONE, zySome } from "../utils/zy_option";
import { unwrapTraitResponse } from "../zy_trait/zy_trait";
import { ZyId } from "../zy_schema/zy_schema";
import {
  Cursor,
  cursorBlink,
  getRemainingCursorAfterZymId,
} from "./cursor/cursor";
import {
  CursorCommandTrait,
  defaultCursorImplFactory,
} from "./cursor/cursor_commands";
import {
  defaultKeyPressImplFactory,
  KeyPressComplexType,
  KeyPressModifier,
  KeyPressTrait,
  ZymKeyPress,
} from "./event_handler/key_press";
import { WindowEventHandler } from "./event_handler/window_event_handler";
import { createContextVariable, newContext } from "../utils/basic_context";
import {
  defaultUndoRedoImplFactory,
  getZymChangeLinks,
  UndoRedoStack,
  UndoRedoTrait,
} from "./undo_redo/undo_redo";
import { CustomKeyPressHandler, ZyGodSchema, ZY_GOD_ID } from "./zy_god_schema";
import { godlyZentinels } from "./zentinels/zentinels";
import { KeyEventHandlerMethod } from "./zentinels/key_event_handler/key_event_handler_schema";
import { ZYMBOL_FRAME_MASTER_ID } from "../../zym_src/zyms/zymbol_infrastructure/zymbol_frame/zymbol_frame_schema";
import { downloadObjectAsJson } from "../../global_utils/file_utils";
import {
  RecordedTestSequence,
  TestRecordedAction,
  TestRecordedActionType,
} from "./testing/basic_testing";
import { DISPLAY_EQ_ID } from "../../zym_src/zyms/zymbol_infrastructure/zymbol_module/module_lines/display_equation/display_equation_schema";

/* Determine whether we want to record the inputs to this page for use in tests */
const TEST_RECORD_MODE = true;

const WINDOW_BLUR = true;

export const { get: getFullContextCursor, set: setFullContextCursor } =
  createContextVariable<Cursor>("full-context-cursor");

export class ZyGod extends Zentinel<ZyGodSchema> {
  zyId: string = ZY_GOD_ID;

  /* ZyGod Creates and Manages Hermes */
  private zyGodHermes: Hermes = new Hermes();

  private masterRegistry: Map<ZyId, ZyMaster<any, any, any>> = new Map();
  private cursor: Cursor = [];
  private root?: Zym<any, any>;
  private rootAwaiter = new ControlledAwaiter();

  private windowInFocus = true;
  private customKeyPressHandler: CustomKeyPressHandler | undefined;

  private recordedKeystrokesForTest: TestRecordedAction[] = [];

  simulatedKeyPressQueue: ZymKeyPress[] = [];
  keyPressCallbackQueue: (() => Promise<void>)[] = [];
  undoRedoStack: UndoRedoStack = new UndoRedoStack();

  constructor() {
    super();

    this.setMethodImplementation({
      getZymRoot: async () => {
        await this.rootAwaiter.awaitTrigger();

        return this.root!;
      },
      getZymAtCursor: async (cursor) => {
        let currZym = this.root;

        for (const i of cursor) {
          currZym = currZym?.children[i];

          if (!currZym) {
            return NONE;
          }
        }

        return zySome(currZym!);
      },
      reRender: async () => {
        await this.handleCursorChange(this.cursor);
      },
      hydratePersistedZym: async (persisted) => {
        const { m: masterId, d: zymData } = persisted;

        const master = this.masterRegistry.get(masterId);

        if (master) {
          const zym = await master.hydrate(zymData);

          return zym;
        } else {
          throw new Error(
            `Master with id: ${masterId} hasn't been registered!`
          );
        }
      },
      queueSimulatedKeyPress: async (keyPress) => {
        this.simulatedKeyPressQueue.push(keyPress);
      },
      queueKeyPressCallback: async (callback) => {
        this.keyPressCallbackQueue.push(callback);
      },
      simulateKeyPress: async (keyPress) => {
        this.basicHandleKeyPress(keyPress);
      },
      takeCursor: async (cursor) => {
        this.handleCursorChange(cursor);
      },
      getFullCursor: async () => {
        return this.windowInFocus ? this.cursor : [];
      },
      registerCustomKeyPressHandler: async (customHandlerProducer) => {
        this.customKeyPressHandler = customHandlerProducer(
          this.basicHandleKeyPress
        );

        cursorBlink.setPreventCursorBlink(
          this.customKeyPressHandler.shouldPreventCursorBlink()
        );
      },
    });

    // @ts-ignore
    window.undo = this.undoRedoStack;
    this.callZentinelMethod(
      KeyEventHandlerMethod.addKeyHandler,
      this.handleKeyPress
    );

    /* Add our window blur and window focus events */
    WindowEventHandler.addEventListener("blur", this.onWindowBlur);
    WindowEventHandler.addEventListener("focus", this.onWindowFocus);

    /* There are moments when we don't properly catch window events so just poll to be sure */
    setInterval(() => {
      if (document.hasFocus()) {
        this.onWindowFocus();
      } else {
        this.onWindowBlur();
      }
    }, 1000);

    /* If we're in test mode, then we have two extra window commands */
    if (TEST_RECORD_MODE) {
      // @ts-ignore
      window.checkPoint = () => {
        const frameCursor = getRemainingCursorAfterZymId(
          this.root!,
          this.cursor,
          ZYMBOL_FRAME_MASTER_ID
        );

        this.recordedKeystrokesForTest.push({
          type: TestRecordedActionType.checkpoint,
          cursor: frameCursor,
        });
      };

      // @ts-ignore
      window.saveTestJson = () => {
        const currentFrameCursor = getRemainingCursorAfterZymId(
          this.root!,
          this.cursor,
          ZYMBOL_FRAME_MASTER_ID
        );

        const storedObj: RecordedTestSequence = {
          testActions: this.recordedKeystrokesForTest,
          finalFrameCursor: currentFrameCursor,
        };

        downloadObjectAsJson(storedObj, "rename_test");
      };
    }

    /* 
    We have to add this line because the zy god is both the 
    carrier of hermes and also a zentinel
    */
    this.zyGodHermes.registerZentinel(this as Zentinel<any>);
    this.registerZentinels(godlyZentinels);
  }

  private handleCursorChange = (newCursor: Cursor) => {
    this.root?.callTraitMethod(CursorCommandTrait.cursorRender, {
      oldCursor: zySome(this.cursor),
      newCursor: zySome(newCursor),
    });

    this.cursor = newCursor;
  };

  onWindowBlur = () => {
    if (WINDOW_BLUR && this.windowInFocus) {
      this.windowInFocus = false;

      this.root?.callTraitMethod(CursorCommandTrait.cursorRender, {
        oldCursor: zySome(this.cursor),
        newCursor: NONE,
      });
    }
  };

  onWindowFocus = () => {
    if (WINDOW_BLUR && !this.windowInFocus) {
      this.windowInFocus = true;

      this.root?.callTraitMethod(CursorCommandTrait.cursorRender, {
        oldCursor: NONE,
        newCursor: zySome(this.cursor),
      });
    }
  };

  handleUndo = async () => {
    await this.root?.callTraitMethod(UndoRedoTrait.prepUndoRedo, undefined);

    const frame = this.undoRedoStack.undo();

    if (frame) {
      const { links, beforeCursor } = frame;
      for (const link of links.reverse()) {
        const {
          beforeChange: { zymState, renderOpts },
          zymLocation,
        } = link;

        await this.root?.callTraitMethod(
          CursorCommandTrait.modifyNodeAndReRender,
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
    await this.root?.callTraitMethod(UndoRedoTrait.prepUndoRedo, undefined);

    const frame = this.undoRedoStack.redo();

    if (frame) {
      const { links, afterCursor } = frame;
      for (const link of links.reverse()) {
        const {
          afterChange: { zymState, renderOpts },
          zymLocation,
        } = link;

        await this.root?.callTraitMethod(
          CursorCommandTrait.modifyNodeAndReRender,
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
    if (TEST_RECORD_MODE) {
      this.recordedKeystrokesForTest.push({
        type: TestRecordedActionType.key,
        keyPress: event,
      });
    }

    if (this.customKeyPressHandler) {
      await this.customKeyPressHandler.handleKeyPress(event);
      cursorBlink.setPreventCursorBlink(
        this.customKeyPressHandler.shouldPreventCursorBlink()
      );
    } else {
      await this.basicHandleKeyPress(event);
    }
  };

  basicHandleKeyPress = async (event: ZymKeyPress | undefined) => {
    /* Handle no-op */
    if (!event) {
      if (this.customKeyPressHandler)
        cursorBlink.setPreventCursorBlink(
          this.customKeyPressHandler.shouldPreventCursorBlink()
        );

      return this.handleCursorChange(this.cursor);
    }

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
      setFullContextCursor(ctx, [...this.cursor]);

      if (this.customKeyPressHandler) {
        this.customKeyPressHandler.beforeKeyPress(ctx, event);
      }

      const moveResponse = unwrapTraitResponse(
        await this.root.callTraitMethod(KeyPressTrait.handleKeyPress, {
          cursor: this.cursor,
          keyPress: event,
          keyPressContext: ctx,
        })
      );

      if (this.customKeyPressHandler) {
        this.customKeyPressHandler.afterKeyPress(ctx);
      }

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

      if (this.keyPressCallbackQueue.length > 0) {
        for (const callback of this.keyPressCallbackQueue) {
          await callback();
        }

        this.keyPressCallbackQueue = [];
      }
    }
  };

  getCursorCopy = () => [...this.cursor];

  registerMasters(masters: ZyMaster<any, any, any>[]) {
    for (const master of masters) {
      this.masterRegistry.set(master.zyId, master);
      this.zyGodHermes.registerZentinel(master);
    }
  }

  registerZentinels(zentinels: Zentinel<any>[]) {
    for (const z of zentinels) {
      this.zyGodHermes.registerZentinel(z);
    }
  }

  async setRoot(root: Zym<any, any, any>) {
    this.root = root;
    this.rootAwaiter.trigger();

    const cursorOpt = unwrapTraitResponse(
      await this.root.callTraitMethod(
        CursorCommandTrait.getInitialCursor,
        undefined
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

  /* !!! TEST METHODS !!!  */
  __getRoot() {
    return this.root;
  }
}

export const zyGod = new ZyGod();

defaultKeyPressImplFactory(zyGod);
defaultCursorImplFactory(zyGod);
defaultUndoRedoImplFactory(zyGod);
