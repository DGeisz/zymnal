import { Cursor, CursorIndex, extractCursorInfo } from "../cursor";

export interface KeyPressContext {
  cursor: Cursor;
}

interface ContextCursorInfo {
  /* Indicates whether the current zocket is the parent of the cursor element */
  parentOfCursorElement: boolean;
  /* This will be the next index in the cursor, and = -1 if the cursor doesn't have any more elements */
  nextCursorIndex: CursorIndex;
  /* If this isn't the parent, this is the relative cursor to pass onto the child */
  newChildContext: KeyPressContext;
}

export function extractCursorInfoFromContext(
  ctx: KeyPressContext
): ContextCursorInfo {
  const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
    extractCursorInfo(ctx.cursor);

  return {
    parentOfCursorElement,
    nextCursorIndex,
    newChildContext: {
      ...ctx,
      cursor: childRelativeCursor,
    },
  };
}

export enum KeyPressComplexType {
  Key,
}

export enum KeyPressBasicType {
  Enter = KeyPressComplexType.Key + 1,
  Tab,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Delete,
}

export type BasicKeyPress = {
  type: KeyPressBasicType;
};

export type ComplexKeyPress = {
  type: KeyPressComplexType.Key;
  key: string;
};

export type ZymKeyPress = BasicKeyPress | ComplexKeyPress;

/* 
==================================== 
RENDER CONTEXT
====================================
*/

export interface RenderCursor {
  oldCursor?: Cursor;
  newCursor?: Cursor;
}

export interface RenderContext {
  renderCursor: RenderCursor;
}
