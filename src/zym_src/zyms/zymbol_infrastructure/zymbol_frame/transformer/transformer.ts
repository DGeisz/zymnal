import { Zym } from "../../../../../zym_lib/zym/zym";
import { Cursor } from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZymKeyPress } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "../../../zymbol/zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import { ZymbolFrame } from "../zymbol_frame";

export enum ZymbolTransformRank {
  /* Means that the transform is immediately used to transform the input, 
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

  /* We use this to see if the keypress is allowed to
    be used to confirm the transformation (see in_place_symbols for 
    an example of when we don't do this)  */
  checkKeypressConfirms = (_keyPress: ZymKeyPress): boolean => true;

  /* Indicates whether the transformation did something with the keypress */
  handleKeyPress = (_keyPress: ZymKeyPress): boolean => false;

  abstract setRootParentFrame(parent: ZymbolFrame): void;
}

export type KeyPressValidator = (keyPress: ZymKeyPress) => boolean;

export class BasicZymbolTreeTransformation extends ZymbolTreeTransformation {
  newTreeRoot;
  cursor: Cursor;
  priority: ZymbolTreeTransformationPriority;

  keyPressValidator?: KeyPressValidator;

  constructor(
    s: {
      newTreeRoot: Zocket;
      cursor: Cursor;
      priority: ZymbolTreeTransformationPriority;
    },
    keyPressValidator?: KeyPressValidator
  ) {
    const { newTreeRoot, cursor, priority } = s;
    super();
    this.newTreeRoot = newTreeRoot;
    this.cursor = cursor;
    this.priority = priority;
    this.keyPressValidator = keyPressValidator;
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
