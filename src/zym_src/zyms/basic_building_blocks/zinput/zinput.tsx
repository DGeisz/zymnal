import Tex from "../../../../global_building_blocks/tex/tex";
import {
  LATEX_EMPTY_SOCKET,
  text_with_cursor,
} from "../../../../global_utils/latex_utils";
import { stringSplice } from "../../../../global_utils/string_utils";
import { safeHydrate } from "../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorIndex,
  FAILED_CURSOR_MOVE_RESPONSE,
  extractCursorInfo,
  getRelativeCursor,
  successfulMoveResponse,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressTrait,
} from "../../../../zym_lib/zy_god/event_handler/key_press";
import { ZyPartialPersist } from "../../../../zym_lib/zy_schema/zy_schema";
import { ZinputSchema, ZINPUT_ID } from "./zinput_schema";
import { useHermesValue } from "../../../../zym_lib/hermes/hermes";
import { ZyGodMethod } from "../../../../zym_lib/zy_god/zy_god_schema";
import { isSome } from "../../../../zym_lib/utils/zy_option";

class ZinputMaster extends ZyMaster<ZinputSchema> {
  zyId: string = ZINPUT_ID;

  newBlankChild() {
    return new Zinput(0, undefined);
  }
}

export const zinputMaster = new ZinputMaster();

interface ZinputProps {
  text: string;
  cursor: number;
}

export class Zinput extends Zyact<ZinputSchema, ZinputProps> {
  zyMaster: ZyMaster = zinputMaster;
  children: Zym<any, any, any, any>[] = [];

  text: string = "";
  cursor: number = 0;

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      text: "t",
    });
  }

  setTextAndCursor = (props: Partial<ZinputProps>) => {
    const { text, cursor } = props;

    if (text !== undefined) this.text = text;
    if (cursor !== undefined) {
      this.cursor = cursor;
    }

    this.rerender(
      Object.assign({}, { text: this.text, cursor: this.cursor }, props)
    );
  };

  getInitialProps = () => ({
    text: this.text,
    cursor: this.cursor,
  });

  getRefreshedChildrenPointer(): Zym[] {
    return [];
  }

  component: React.FC<ZinputProps> = ({ text, cursor }) => {
    let zinputCursor = -1;

    const fullCursor = useHermesValue(
      this,
      ZyGodMethod.getFullCursor,
      undefined
    );

    if (fullCursor) {
      const opt = getRelativeCursor(this.getFullCursorPointer(), fullCursor);

      if (isSome(opt)) {
        const { parentOfCursorElement, nextCursorIndex } = extractCursorInfo(
          opt.val
        );

        if (parentOfCursorElement) {
          zinputCursor = nextCursorIndex;
        }
      }
    }

    return (
      <div className="flex self-start mt-3">
        {zinputCursor > -1 ? (
          <Tex tex={text_with_cursor(text, zinputCursor)} />
        ) : (
          <Tex tex={!!text ? text : LATEX_EMPTY_SOCKET} />
        )}
      </div>
    );
  };

  persistData() {
    return {
      text: this.text,
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<ZinputSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      text: (t) => {
        this.text = t;
      },
    });
  }
}

zinputMaster.implementTrait(KeyPressTrait, {
  handleKeyPress: async (zym, args) => {
    const z = zym as Zinput;
    const { keyPress, cursor: zymCursor } = args;

    const success = successfulMoveResponse(zymCursor);

    switch (keyPress.type) {
      case KeyPressComplexType.Key: {
        if (z.cursor >= 0 && z.cursor <= z.text.length) {
          z.setTextAndCursor({
            cursor: z.cursor + 1,
            text: stringSplice(z.text, z.cursor, 0, keyPress.key),
          });

          if (keyPress.key === " ") {
            setTimeout(() => {
              z.rerender();
            }, 20);
          }
          return success;
        } else {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }

      case KeyPressBasicType.Delete: {
        if (z.cursor > 0 && z.cursor <= z.text.length) {
          z.setTextAndCursor({
            cursor: z.cursor - 1,
            text: stringSplice(z.text, z.cursor - 1, 1),
          });
          return success;
        } else {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }

      case KeyPressBasicType.ArrowLeft: {
        if (z.cursor > 0) {
          z.setTextAndCursor({ cursor: z.cursor - 1 });
          return success;
        } else {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }
      case KeyPressBasicType.ArrowRight: {
        if (z.cursor < z.text.length) {
          z.setTextAndCursor({ cursor: z.cursor + 1 });
          return success;
        } else {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
  },
});
