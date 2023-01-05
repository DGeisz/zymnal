import clsx from "clsx";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import {
  Cursor,
  CursorMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
  NO_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  ZymKeyPress,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { Zymbol } from "../../../zymbol/zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "../transformer/std_transformers/transform_utils";
import {
  BasicZymbolTreeTransformation,
  TransformerTypeFilter,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
} from "../transformer/transformer";
import { ZymbolFrame } from "../zymbol_frame";

export interface ActionInfo {
  source: string;
  name: string;
}

export abstract class ActionFactory {
  abstract source: string;
  abstract name: string;
  abstract typeFilters: TransformerTypeFilter[];

  abstract getActions: (
    zymRoot: Zym,
    cursor: Cursor,
    zymbolRoot: Zymbol,
    zymbolCursor: Cursor
  ) => FrameAction[];
}

interface PreviewCompProps {
  selected: boolean;
}

export abstract class FrameAction {
  abstract priority: FrameActionPriority;
  abstract finishActionWithoutHandlingKeypress: boolean;
  parentFrame?: ZymbolFrame;

  /* If the action transformers the zymbol tree, 
  this is used to preview the result of the transformation */
  getFramePreview(): void | {
    newTreeRoot: Zocket;
    cursor: Cursor;
  } {}

  abstract getActionPreviewComponent(): React.FC<PreviewCompProps>;

  setRootParentFrame(_zymbolFrame: ZymbolFrame): void {}

  abstract runAction(keyPressContext?: BasicContext): CursorMoveResponse;

  setParentFrame = (p: ZymbolFrame) => {
    this.parentFrame = p;
  };

  getParentFrame(): ZymbolFrame {
    if (!this.parentFrame) throw new Error("Parent frame not set!");

    return this.parentFrame;
  }

  /* We use this to see if the keypress is allowed to
    be used to confirm the transformation (see in_place_symbols for 
    an example of when we don't do this)  */
  checkKeypressConfirms = (_keyPress: ZymKeyPress): boolean => true;

  /* Indicates whether the transformation did something with the keypress */
  handleKeyPress = (_keyPress: ZymKeyPress): boolean => false;
}

interface ActionContext {
  zymRoot: Zym;
  cursor: Cursor;
  zymbolRoot: Zymbol;
  zymbolCursor: Cursor;
}

export abstract class TextActionFactory extends ActionFactory {
  abstract source: string;
  abstract name: string;

  abstract getActionFromText(text: string, ctx: ActionContext): FrameAction[];

  getActions = (
    zymRoot: Zym,
    cursor: Cursor,
    zymbolRoot: Zymbol,
    zymbolCursor: Cursor
  ): FrameAction[] => {
    zymbolCursor = makeHelperCursor(zymbolCursor, zymbolRoot);

    const textTransform = getTransformTextZymbolAndParent(
      zymbolRoot,
      zymbolCursor
    );

    if (!textTransform.isTextZymbol) return [];

    return this.getActionFromText(textTransform.text.getText(), {
      zymRoot,
      cursor,
      zymbolRoot,
      zymbolCursor,
    });
  };

  getStrippedTreeTransformation(
    zymbolRoot: Zymbol,
    cursor: Cursor
  ): ZymbolTreeTransformation {
    cursor = makeHelperCursor(cursor, zymbolRoot);

    const transformText = getTransformTextZymbolAndParent(zymbolRoot, cursor);

    if (!transformText.isTextZymbol) throw new Error("Not a text symbol");

    const { parent, zymbolIndex, text } = transformText;
    parent.children.splice(zymbolIndex, 1);

    cursor.splice(cursor.length - 2, 2, zymbolIndex);
    zymbolRoot.recursivelyReIndexChildren();

    return new BasicZymbolTreeTransformation({
      newTreeRoot: zymbolRoot as Zocket,
      cursor: recoverAllowedCursor(cursor, zymbolRoot),
      priority: {
        rank: ZymbolTransformRank.Suggest,
        cost: 100,
      },
      previewZymbol: text,
    });

    throw new Error();
  }
}

interface TextActionContext extends ActionContext {
  text: string;
}

export type TextActionGenerator = (
  ctx: TextActionContext
) => BasicFunctionAction[];

export class AutocompleteTextActionFactory extends TextActionFactory {
  typeFilters: TransformerTypeFilter[];
  source: string;
  name: string;
  keyword: string;
  actionGenerator: TextActionGenerator;

  constructor(i: {
    source: string;
    name: string;
    actionGenerator: TextActionGenerator;
    keyword: string;
    typeFilters: TransformerTypeFilter[];
  }) {
    super();
    const { source, name, keyword, actionGenerator, typeFilters } = i;

    this.source = source;
    this.name = name;
    this.keyword = keyword;
    this.actionGenerator = actionGenerator;
    this.typeFilters = typeFilters;
  }

  getActionFromText(text: string, ctx: ActionContext): FrameAction[] {
    if (this.keyword.startsWith(text)) {
      const actions = this.actionGenerator({ ...ctx, text });
      const { zymbolCursor, zymbolRoot } = ctx;

      actions.forEach((a) =>
        a.setTransformationGenerator(() =>
          this.getStrippedTreeTransformation(zymbolRoot, zymbolCursor)
        )
      );

      return actions;
    }

    return [];
  }
}

export class BasicFunctionAction extends FrameAction {
  priority: FrameActionPriority;

  name: string;
  description?: string;
  finalTreeTransformationGenerator?: () => ZymbolTreeTransformation;
  finishActionWithoutHandlingKeypress: boolean = true;

  action: (ctx?: BasicContext) => void;

  constructor(i: {
    action: (ctx?: BasicContext) => CursorMoveResponse;
    name: string;
    priority: FrameActionPriority;
    description?: string;
  }) {
    super();
    const { action, name, priority, description } = i;

    this.action = action;
    this.priority = priority;
    this.name = name;
    this.description = description;

    this.parentFrame;
  }

  setTransformationGenerator(generator: () => ZymbolTreeTransformation) {
    this.finalTreeTransformationGenerator = generator;
  }

  getActionPreviewComponent(): React.FC<PreviewCompProps> {
    return ({ selected }) => {
      const textColor = selected ? "" : "text-gray-400";

      return (
        <div>
          <div className={clsx("font-semibold", textColor)}>{this.name}</div>
          {this.description && (
            <div className={clsx("text-sm", textColor)}>{this.description}</div>
          )}
        </div>
      );
    };
  }

  runAction = (
    keyPressContext?: BasicContext | undefined
  ): CursorMoveResponse => {
    this.action(keyPressContext);

    if (this.finalTreeTransformationGenerator) {
      if (!this.parentFrame) throw new Error("Parent frame not set!");

      return successfulMoveResponse(
        this.parentFrame.enactTransformation(
          this.finalTreeTransformationGenerator(),
          keyPressContext
        )
      );
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  checkKeypressConfirms = (keyPress: ZymKeyPress): boolean => {
    return (
      keyPress.type === KeyPressBasicType.Enter &&
      (!keyPress.modifiers || keyPress.modifiers.length === 0)
    );
  };
}

export class DefaultNoOpAction extends FrameAction {
  finishActionWithoutHandlingKeypress: boolean = false;

  constructor(parentFrame: ZymbolFrame) {
    super();
    this.parentFrame = parentFrame;
  }

  runAction(_keyPressContext?: BasicContext | undefined): CursorMoveResponse {
    this.getParentFrame().setNewActions([]);

    return NO_CURSOR_MOVE_RESPONSE;
  }
  /* This doesn't actually matter */
  priority: FrameActionPriority = { cost: 0, rank: FrameActionRank.Include };

  getActionPreviewComponent(): React.FC<{}> {
    return () => {
      return <div className="font-semibold text-gray-400">Default</div>;
    };
  }
}

export enum FrameActionRank {
  /* Means that the action is immediately enacted,
  and the user has to change out in order to access something else */
  Suggest = 0,
  /* The transformation is included, but the user has to select the
  transform in order to access it
   */
  Include = 1,
}

export interface FrameActionPriority {
  rank: FrameActionRank;
  cost: number;
}
