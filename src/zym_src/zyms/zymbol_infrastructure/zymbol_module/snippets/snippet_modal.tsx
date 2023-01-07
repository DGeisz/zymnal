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
import { Snippet } from "./snippet";
import { ZyComp } from "../../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { IoClose } from "react-icons/io5";
import { HiPlus } from "react-icons/hi";
import { ZyGodMethod } from "../../../../../zym_lib/zy_god/zy_god_schema";
import { sleep } from "../../../../../global_utils/promise_utils";

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

const SnippetModalStyles: Record<string, string> = {
  TableName: clsx("text-left"),
};

export class SnippetModal extends Zyact<SnippetModalSchema> {
  zyMaster: ZyMaster = snippetModalMaster;
  children: Snippet[] = [new Snippet(0, this)];

  constructor(cursorIndex: CursorIndex, parent: Zym | undefined) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      children: "c",
    });
  }

  addSnippet = () => {
    this.children.push(new Snippet(0, this));
    this.recursivelyReIndexChildren();
    this.rerender();
  };

  getModule(): ZymbolModule {
    if (!this.parent) {
      throw new Error("Parent not set yet!");
    }

    return this.parent as ZymbolModule;
  }

  focusOnFirstSnippet = async () => {
    const firstSnippetCursor = [...this.getFullCursorPointer(), 0, 0, 0, 0];

    await sleep(100);
    await this.callZ(ZyGodMethod.takeCursor, firstSnippetCursor);
    // await this.callZ(ZyGodMethod.takeCursor, a);
  };

  component: FC<{}> = () => {
    return (
      <div>
        <div className={"flex items-start"}>
          <div
            className={clsx(
              "cursor-pointer rounded-md",
              "p-1",
              "mb-4",
              "hover:bg-gray-300"
            )}
            onClick={() => this.getModule().toggleSnippetsModal(false)}
          >
            <IoClose size={20} />
          </div>
        </div>
        <table className="table-fixed w-full">
          <thead>
            <tr className={clsx("border-b border-solid border-gray-200")}>
              <th className={SnippetModalStyles.TableName}>Keyword</th>
              <th className={SnippetModalStyles.TableName}>Snippet</th>
            </tr>
          </thead>
          <tbody>
            {this.children.map((s, i) => (
              <ZyComp zyact={s} key={i} />
            ))}
          </tbody>
        </table>
        <div className="flex items-start">
          <div
            className={clsx(
              "mt-3",
              "opacity-50 hover:opacity-100",
              "cursor-pointer rounded-md",
              "p-1",
              "hover:bg-gray-300"
            )}
            onClick={this.addSnippet}
          >
            <HiPlus size={20} />
          </div>
        </div>
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
