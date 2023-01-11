import { FC } from "react";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { SNIPPET_ID, SnippetSchema } from "./snippet_schema";
import { ZymbolFrame } from "../../zymbol_frame/zymbol_frame";
import { displayEquationTypeFilters } from "../module_lines/display_equation/display_equation_schema";
import {
  CursorIndex,
  NO_CURSOR_MOVE_RESPONSE,
  chainMoveResponse,
  extractCursorInfo,
  successfulMoveResponse,
  wrapChildCursorResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { SnippetModal } from "./snippet_modal";
import {
  hydrateChildren,
  safeHydrate,
} from "../../../../../zym_lib/zym/utils/hydrate";
import { ZyComp } from "../../../../../zym_lib/zym/zymplementations/zyact/hooks";
import clsx from "clsx";
import {
  KeyPressBasicType,
  KeyPressTrait,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import _ from "underscore";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import { keyEventHandler } from "../../../../../zym_lib/zy_god/zentinels/key_event_handler/key_event_handler";
import { TextZymbol } from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../../zymbol_frame/transformer/std_transformers/std_transformer_type_filters";

class SnippetMaster extends ZyMaster<SnippetSchema> {
  zyId: string = SNIPPET_ID;

  newBlankChild(): Zym {
    throw new Error("Method not implemented.");
  }
}

export const snippetMaster = new SnippetMaster();

const KEYWORD_DEFAULT_TEXT = "Enter Keyword...";

export interface SnippetInfo {
  keyword: string;
  template: Zocket;
}

export class Snippet extends Zyact<SnippetSchema> {
  zyMaster: ZyMaster = snippetMaster;

  children: [ZymbolFrame, ZymbolFrame] = [
    new ZymbolFrame(0, this, {
      getTypeFilters: () => [],
      inlineTex: true,
      defaultText: KEYWORD_DEFAULT_TEXT,
    }),
    new ZymbolFrame(1, this, {
      // @We don't want any transformers related to snippets
      getTypeFilters: () => [
        STD_TRANSFORMER_TYPE_FILTERS.EQUATION,
        STD_TRANSFORMER_TYPE_FILTERS.SNIPPET_EDITOR,
      ],
    }),
  ];

  constructor(cursorIndex: CursorIndex, parent: SnippetModal | undefined) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      children: "c",
    });
  }

  component: FC<{}> = () => {
    const [zinput, frame] = this.children;

    const ItemStyle = clsx("pb-3");

    return (
      <tr className={clsx("border-b border-solid border-gray-100")}>
        <td className={ItemStyle}>
          <ZyComp zyact={zinput} />
        </td>
        <td className={ItemStyle}>
          <ZyComp zyact={frame} />
        </td>
      </tr>
    );
  };

  parseChildren = (): { keyword: ZymbolFrame; template: ZymbolFrame } => {
    return {
      keyword: this.children[0],
      template: this.children[1],
    };
  };

  getSnippetInfo = async (): Promise<SnippetInfo | undefined> => {
    /* Making sure both of our lads have children */
    if (this.children.some((c) => c.baseZocket.children.length === 0))
      return undefined;

    /* Get keyword */
    const { keyword: keywordFrame, template: templateFrame } =
      this.parseChildren();

    const keyword = (
      keywordFrame.baseZocket.children[0] as TextZymbol
    ).getText();

    const template = (await templateFrame.baseZocket.clone(1))[0] as Zocket;

    if (!keyword) return undefined;

    return { keyword, template };
  };

  persistData(): ZyPartialPersist<SnippetSchema> {
    return {
      children: [this.children[0].persist(), this.children[1].persist()],
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<SnippetSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      children: async (c) => {
        this.children = (await hydrateChildren(this, c)) as [
          ZymbolFrame,
          ZymbolFrame
        ];
      },
    });

    // Setting this here so persistence isn't too bloated
    this.children[0].setDefaultText(KEYWORD_DEFAULT_TEXT);
  }

  getRefreshedChildrenPointer(): Zym[] {
    return this.children;
  }
}

snippetMaster.implementTrait(KeyPressTrait, {
  handleKeyPress: async (zym, { cursor, keyPress, keyPressContext }) => {
    const snippet = zym as Snippet;

    const { nextCursorIndex, childRelativeCursor, parentOfCursorElement } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement || nextCursorIndex < 0)
      return NO_CURSOR_MOVE_RESPONSE;

    const moveCursorToSnippet = () => {
      return chainMoveResponse(
        snippet.children[1].baseZocket.takeCursorFromLeft(keyPressContext),
        (newRelativeCursor) => {
          return successfulMoveResponse([1, 0, ...newRelativeCursor]);
        }
      );
    };

    const moveCursorToKeyword = () => {
      return chainMoveResponse(
        snippet.children[0].baseZocket.takeCursorFromRight(keyPressContext),
        (newRelativeCursor) => {
          return successfulMoveResponse([0, 0, ...newRelativeCursor]);
        }
      );
    };

    /* Check if we're deleting from the beginning of the keyword */
    if (
      _.isEqual(cursor, [0, 0, 0]) &&
      keyPress.type === KeyPressBasicType.Delete
    ) {
      return NO_CURSOR_MOVE_RESPONSE;
    }

    if (
      nextCursorIndex === 0 &&
      (keyPress.type === KeyPressBasicType.Enter ||
        keyPress.type === KeyPressBasicType.Tab)
    ) {
      return moveCursorToSnippet();
    } else if (
      _.isEqual(cursor, [1, 0, 0]) &&
      keyPress.type === KeyPressBasicType.Delete
    ) {
      return moveCursorToKeyword();
    }

    const move = await snippet.children[nextCursorIndex].call(
      KeyPressTrait.handleKeyPress,
      { cursor: childRelativeCursor, keyPress, keyPressContext }
    );

    if (move.success) return wrapChildCursorResponse(move, nextCursorIndex);

    if (
      nextCursorIndex === 0 &&
      keyPress.type === KeyPressBasicType.ArrowRight
    ) {
      return moveCursorToSnippet();
    } else if (
      nextCursorIndex === 1 &&
      keyPress.type === KeyPressBasicType.ArrowLeft
    ) {
      return moveCursorToKeyword();
    }

    return NO_CURSOR_MOVE_RESPONSE;
  },
});
