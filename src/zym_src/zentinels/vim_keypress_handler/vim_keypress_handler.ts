import { BasicContext } from "../../../zym_lib/utils/basic_context";
import { Zentinel } from "../../../zym_lib/zentinel/zentinel";
import {
  CursorMode,
  setCursorMode,
} from "../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
  ZymKeyPress,
} from "../../../zym_lib/zy_god/event_handler/key_press";
import {
  CustomKeyPressHandler,
  KeyPressHandler,
  ZyGodMethod,
} from "../../../zym_lib/zy_god/zy_god_schema";
import { VimiumModeZenMethods } from "../../zyms/zymbol_infrastructure/zymbol_frame/building_blocks/vimium_mode/vimium_mode_zen_schema";

const USE_VIM = false;

const vimiumSelectHandler: (() => void)[] = [];

enum VimMode {
  Normal,
  Insert,
  Visual,
}

const basicKeyPress = (type: KeyPressBasicType): ZymKeyPress => ({
  type,
});

const keyKeyPress = (key: string): ZymKeyPress => ({
  type: KeyPressComplexType.Key,
  key,
});

const normalKeyMap: { [key: string]: ZymKeyPress } = {
  j: basicKeyPress(KeyPressBasicType.ArrowDown),
  k: basicKeyPress(KeyPressBasicType.ArrowUp),
  h: basicKeyPress(KeyPressBasicType.ArrowLeft),
  l: basicKeyPress(KeyPressBasicType.ArrowRight),
};

const fullWordKeyMap = {
  w: {
    type: KeyPressBasicType.ArrowRight,
    modifiers: [KeyPressModifier.Option],
  },
  e: {
    type: KeyPressBasicType.ArrowRight,
    modifiers: [KeyPressModifier.Option],
  },
  b: {
    type: KeyPressBasicType.ArrowLeft,
    modifiers: [KeyPressModifier.Option],
  },
};

for (const [key, value] of Object.entries(fullWordKeyMap)) {
  normalKeyMap[key] = value;
  normalKeyMap[key.toUpperCase()] = value;
}

const customKeyMap: { [key: string]: ZymKeyPress } = {
  jj: basicKeyPress(KeyPressBasicType.Escape),
};

const customKeyMapKeys = Object.keys(customKeyMap);

class VimCustomKeyPressHandler extends CustomKeyPressHandler {
  mode: VimMode = VimMode.Normal;
  customKeyPress = "";

  customKeyPressTimeout: NodeJS.Timeout | undefined;

  constructor(baseKeyPressHandler: KeyPressHandler) {
    super(baseKeyPressHandler);

    vimiumSelectHandler.push(() => {
      setTimeout(() => {
        this.mainHandleKeyPress(basicKeyPress(KeyPressBasicType.Escape));
      }, 100);
    });
  }

  shouldPreventCursorBlink(): boolean {
    return this.mode !== VimMode.Insert;
  }

  private clearCustomKeyPress = () => {
    this.customKeyPress = "";
    clearTimeout(this.customKeyPressTimeout);
  };

  async handleKeyPress(keyPress: ZymKeyPress): Promise<void> {
    if (this.mode === VimMode.Insert) {
      if (keyPress.type === KeyPressComplexType.Key) {
        const newCustomKey = this.customKeyPress + keyPress.key;

        if (customKeyMapKeys.includes(newCustomKey)) {
          this.clearCustomKeyPress();

          return this.mainHandleKeyPress(customKeyMap[newCustomKey]);
        } else if (customKeyMapKeys.some((k) => k.startsWith(newCustomKey))) {
          this.customKeyPress = newCustomKey;
          clearTimeout(this.customKeyPressTimeout);

          this.customKeyPressTimeout = setTimeout(async () => {
            for (const char of newCustomKey) {
              await this.mainHandleKeyPress(keyKeyPress(char));
            }
          }, 1000);

          return;
        } else if (this.customKeyPress) {
          for (const char of this.customKeyPress) {
            await this.mainHandleKeyPress(keyKeyPress(char));
          }

          this.clearCustomKeyPress();
        }
      } else {
        this.clearCustomKeyPress();
      }
    }

    this.mainHandleKeyPress(keyPress);
  }

  async mainHandleKeyPress(keyPress: ZymKeyPress): Promise<void> {
    switch (this.mode) {
      case VimMode.Normal: {
        switch (keyPress.type) {
          case KeyPressComplexType.Key: {
            if (keyPress.key in normalKeyMap) {
              return this.baseKeyPressHandler(normalKeyMap[keyPress.key]);
            }

            switch (keyPress.key) {
              case "i": {
                this.mode = VimMode.Insert;
                return;
              }
              case "f": {
                this.mode = VimMode.Insert;
                return this.baseKeyPressHandler({
                  type: KeyPressComplexType.Key,
                  key: "f",
                  modifiers: [KeyPressModifier.Cmd],
                });
              }
              case "x": {
                await this.baseKeyPressHandler(
                  basicKeyPress(KeyPressBasicType.ArrowRight)
                );
                await this.baseKeyPressHandler(
                  basicKeyPress(KeyPressBasicType.Delete)
                );

                return;
              }
            }
            break;
          }
        }

        break;
      }
      case VimMode.Insert: {
        switch (keyPress.type) {
          case KeyPressComplexType.Key: {
            return this.baseKeyPressHandler(keyPress);
          }
          case KeyPressBasicType.Escape: {
            this.mode = VimMode.Normal;
            /* No-op */
            return this.baseKeyPressHandler(undefined);
          }
        }
      }
    }

    if (keyPress.type !== KeyPressComplexType.Key) {
      return this.baseKeyPressHandler(keyPress);
    }
  }

  beforeKeyPress(ctx: BasicContext, _keyPress: ZymKeyPress): void {
    /* We want to set the cursor type */
    setCursorMode(
      ctx,
      this.mode === VimMode.Insert ? CursorMode.Basic : CursorMode.FullCover
    );
  }

  afterKeyPress(): void {}
}

class VimZentinel extends Zentinel {
  zyId: string = "vim-mode";

  onRegistration = async () => {
    if (USE_VIM) {
      this.callZentinelMethod(
        ZyGodMethod.registerCustomKeyPressHandler,
        (baseKeyPressHandler) =>
          new VimCustomKeyPressHandler(baseKeyPressHandler)
      );

      this.callZentinelMethod(
        VimiumModeZenMethods.registerOnVimiumSelectHandler,
        () => {
          vimiumSelectHandler.forEach((h) => h());
        }
      );
    }
  };
}

export const vimZentinel = new VimZentinel();
