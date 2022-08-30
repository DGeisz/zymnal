import clsx from "clsx";
import { Zentinel } from "../../../../../../zym_lib/zentinel/zentinel";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  keyPressEqual,
  KeyPressModifier,
  ZymKeyPress,
} from "../../../../../../zym_lib/zy_god/event_handler/key_press";
import { VimiumModeZenSchema, VIMIUM_MODE_ID } from "./vimium_mode_zen_schema";

enum VimiumState {
  None,
  Active,
}

export const VimiumHint: React.FC<{ hint: string; str: string }> = ({
  hint,
  str,
}) => {
  return (
    <span
      className={clsx(
        "bg-green-200",
        "px-[3px]",
        "rounded-sm",
        "text-sm font-semibold text-green-600",
        "z-50"
      )}
    >
      {hint.startsWith(str) ? (
        <>
          <span className="text-gray-300">{str}</span>
          {hint.substring(str.length)}
        </>
      ) : (
        hint
      )}
    </span>
  );
};

export class VimiumZentinel extends Zentinel<VimiumModeZenSchema> {
  zyId: string = VIMIUM_MODE_ID;
  selectHandlers: (() => void)[] = [];

  constructor() {
    super();

    this.setMethodImplementation({
      registerOnVimiumSelectHandler: async (handler) => {
        this.selectHandlers.push(handler);
      },
    });
  }

  onSelect = () => {
    this.selectHandlers.forEach((h) => h());
  };
}

export const vimiumZentinel = new VimiumZentinel();

export class VimiumMode {
  private chars = "";
  private state = VimiumState.None;

  /* Return true if the keypress was intercepted and handled*/
  handleKeyPress = (keyPress: ZymKeyPress): boolean => {
    switch (this.state) {
      case VimiumState.None: {
        if (
          keyPressEqual(keyPress, {
            type: KeyPressComplexType.Key,
            key: "f",
            modifiers: [KeyPressModifier.Cmd],
          })
        ) {
          this.state = VimiumState.Active;
          this.chars = "";
          return true;
        }

        break;
      }
      case VimiumState.Active: {
        if (keyPress.type === KeyPressComplexType.Key) {
          if (/^[a-zA-Z]$/.test(keyPress.key)) {
            this.chars += keyPress.key;
            return true;
          }
        } else if (keyPress.type === KeyPressBasicType.Escape) {
          this.escapeVimiumMode();
          return false;
        }

        break;
      }
    }

    return false;
  };

  handleTermSelected = () => {
    this.escapeVimiumMode();
    vimiumZentinel.onSelect();
  };

  escapeVimiumMode = () => {
    this.state = VimiumState.None;
    this.chars = "";
  };

  isActive = () => this.state === VimiumState.Active;
  getChars = () => this.chars;
}
