import { ZYMBOL_MODULE_ID } from "../zymbol_module_schema";
import { ZymbolModule } from "../zymbol_module";
import {
  CursorIndex,
  FAILED_CURSOR_MOVE_RESPONSE,
  getLastZymInCursorWithId,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import { SNIPPET_MODAL_ID, SnippetModalSchema } from "./snippet_modal_schema";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { FC } from "react";
import {
  hydrateChildren,
  safeHydrate,
} from "../../../../../zym_lib/zym/utils/hydrate";
import clsx from "clsx";
import {
  AutocompleteTextActionFactory,
  BasicFunctionAction,
  FrameActionRank,
} from "../../zymbol_frame/actions/actions";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../../zymbol_frame/transformer/std_transformers/std_transformer_type_filters";

export const snippetActionFactory = new AutocompleteTextActionFactory({
  source: "snippet",
  name: "open-modal",
  typeFilters: [STD_TRANSFORMER_TYPE_FILTERS.EQUATION],
  actionGenerator: (ctx) => {
    /* Get the particular module with which this modal will be associated */
    const { zymRoot: root, cursor, text } = ctx;

    const lastModuleOp = getLastZymInCursorWithId<ZymbolModule>(
      root,
      cursor,
      ZYMBOL_MODULE_ID
    );

    if (!lastModuleOp.some) return [];

    const lastModule = lastModuleOp.val.zym;

    let priorityCost: number;
    const l = text.length;

    if (l === 1) {
      priorityCost = 10000;
    } else if (l === 2) {
      priorityCost = 500;
    } else {
      priorityCost = -200;
    }

    return [
      new BasicFunctionAction({
        name: "Snippets",
        description: "Open the snippets modal for this module",
        priority: {
          rank: FrameActionRank.Suggest,
          cost: priorityCost,
        },
        action: () => {
          lastModule.toggleSnippetsModal(true);

          return FAILED_CURSOR_MOVE_RESPONSE;
        },
      }),
    ];
  },
  keyword: "snippet",
});

class SnippetModalMaster extends ZyMaster<SnippetModalSchema> {
  zyId = SNIPPET_MODAL_ID;

  newBlankChild(): Zym {
    return new SnippetModal(0, undefined);
  }
}

export const snippetModalMaster = new SnippetModalMaster();

export class SnippetModal extends Zyact<SnippetModalSchema> {
  zyMaster: ZyMaster = snippetModalMaster;
  children: Zym[] = [];

  constructor(cursorIndex: CursorIndex, parent: Zym | undefined) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      children: "c",
    });
  }

  getModule(): ZymbolModule {
    if (!this.parent) {
      throw new Error("Parent not set yet!");
    }

    return this.parent as ZymbolModule;
  }

  component: FC<{}> = () => {
    return (
      <div>
        <div className={clsx("flex flex-row items-start")}>
          <div
            className={clsx("bg-red-400 cursor-pointer rounded-md px-2")}
            onClick={() => this.getModule().toggleSnippetsModal(false)}
          >
            X
          </div>
        </div>
        <div></div>
      </div>
    );
  };

  persistData(): ZyPartialPersist<SnippetModalSchema> {
    return {
      children: this.children.map((c) => c.persist()),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<SnippetModalSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      children: async (children) => {
        this.children = await hydrateChildren(this, children);
      },
    });
  }

  getRefreshedChildrenPointer(): Zym[] {
    return this.children;
  }
}
