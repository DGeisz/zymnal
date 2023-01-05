import { Zym } from "../../../../../zym_lib/zym/zym";
import {
  Cursor,
  CursorMoveResponse,
  successfulMoveResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZymKeyPress } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol, ZymbolRenderArgs } from "../../../zymbol/zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import { ZymbolFrame } from "../zymbol_frame";
import { FC } from "react";
import { TeX } from "../../../zymbol/zymbol_types";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import Tex from "../../../../../global_building_blocks/tex/tex";
import { FrameAction, FrameActionPriority } from "../actions/actions";

export enum ZymbolTransformRank {
  /* Means that the action is immediately enacted,
  and the user has to change out in order to access something else */
  Suggest = 0,
  /* The transformation is included, but the user has to select the
  transform in order to access it
   */
  Include = 1,
}

export interface ZymbolTreeTransformationPriority {
  rank: ZymbolTransformRank;
  cost: number;
}

export abstract class ZymbolTreeTransformation {
  abstract priority: ZymbolTreeTransformationPriority;

  abstract getCurrentTransformation(): {
    newTreeRoot: Zocket;
    cursor: Cursor;
  };

  abstract getTexPreview(): TeX;

  /* We use this to see if the keypress is allowed to
    be used to confirm the transformation (see in_place_symbols for 
    an example of when we don't do this)  */
  checkKeypressConfirms = (_keyPress: ZymKeyPress): boolean => true;

  /* Indicates whether the transformation did something with the keypress */
  handleKeyPress = (_keyPress: ZymKeyPress): boolean => false;

  abstract setRootParentFrame(parent: ZymbolFrame): void;
}

export class ZymbolTreeTransformationAction extends FrameAction {
  finishActionWithoutHandlingKeypress: boolean = false;
  treeTransformation: ZymbolTreeTransformation;
  priority: FrameActionPriority;

  constructor(treeTransformation: ZymbolTreeTransformation) {
    super();

    this.treeTransformation = treeTransformation;
    this.priority =
      treeTransformation.priority as unknown as FrameActionPriority;
  }

  runAction(keyPressContext?: BasicContext | undefined): CursorMoveResponse {
    if (!this.parentFrame) throw new Error("Don't have parent frame ref!");

    return successfulMoveResponse(
      this.parentFrame.enactTransformation(
        this.treeTransformation,
        keyPressContext
      )
    );
  }

  getFramePreview(): { newTreeRoot: Zocket; cursor: Cursor } | undefined {
    return this.treeTransformation.getCurrentTransformation();
  }

  getActionPreviewComponent(): FC<{}> {
    return () => {
      const tex = this.treeTransformation.getTexPreview();

      return (
        <div>
          <Tex tex={tex}></Tex>
        </div>
      );
    };
  }

  setRootParentFrame(zymbolFrame: ZymbolFrame): void {
    this.treeTransformation.setRootParentFrame(zymbolFrame);
  }

  checkKeypressConfirms = (keyPress: ZymKeyPress) =>
    this.treeTransformation.checkKeypressConfirms(keyPress);

  handleKeyPress = (keyPress: ZymKeyPress) =>
    this.treeTransformation.handleKeyPress(keyPress);
}

export type KeyPressValidator = (keyPress: ZymKeyPress) => boolean;

export const PREVIEW_TEX_RENDER_OPTS: ZymbolRenderArgs = {
  cursor: [],
  inlineTex: false,
  excludeHtmlIds: true,
};

export class BasicZymbolTreeTransformation extends ZymbolTreeTransformation {
  newTreeRoot;
  cursor: Cursor;
  priority: ZymbolTreeTransformationPriority;
  previewZymbol: Zymbol;

  keyPressValidator?: KeyPressValidator;

  constructor(
    s: {
      newTreeRoot: Zocket;
      previewZymbol: Zymbol;
      cursor: Cursor;
      priority: ZymbolTreeTransformationPriority;
    },
    keyPressValidator?: KeyPressValidator
  ) {
    super();
    const { newTreeRoot, cursor, priority, previewZymbol } = s;

    this.previewZymbol = previewZymbol;
    this.newTreeRoot = newTreeRoot;
    this.cursor = cursor;
    this.priority = priority;
    this.keyPressValidator = keyPressValidator;
  }

  getTexPreview(): string {
    return this.previewZymbol.renderTex(PREVIEW_TEX_RENDER_OPTS);
  }

  getCurrentTransformation(): { newTreeRoot: Zocket; cursor: Cursor } {
    return {
      ...this,
    };
  }

  setRootParentFrame(parent: ZymbolFrame): void {
    this.newTreeRoot.parent = parent;
    this.newTreeRoot.setParentFrame(parent);
  }

  checkKeypressConfirms = (keyPress: ZymKeyPress): boolean => {
    if (!!this.keyPressValidator) {
      return this.keyPressValidator(keyPress);
    } else {
      return true;
    }
  };
}

export type ZymbolTransformer = (
  rootZymbol: Zymbol,
  cursor: Cursor,
  keyPress: ZymKeyPress
) => Promise<ZymbolTreeTransformation[]> | ZymbolTreeTransformation[];

export type TransformerTypeFilter = string;

export interface SourcedTransformer {
  source: string;
  name: string;
  /* Help indicate if a transformer should be invoked */
  typeFilters: TransformerTypeFilter[];
  transform: ZymbolTransformer;
}

export interface TransformerFactory {
  source: string;
  name: string;
  /* Help indicate if a transformer should be invoked */
  typeFilters: TransformerTypeFilter[];
  factory: (
    root: Zym,
    cursor: Cursor
  ) => Promise<ZymbolTransformer[]> | ZymbolTransformer[];
}
