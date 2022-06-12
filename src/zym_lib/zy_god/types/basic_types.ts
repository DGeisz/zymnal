import { Cursor } from "../cursor";

export interface KeyPressContext {
  cursor: Cursor;
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
}

export type BasicKeyPress = {
  type: KeyPressBasicType;
};

export type ComplexKeyPress = {
  type: KeyPressComplexType.Key;
  key: string;
};

export type ZymKeyPress = BasicKeyPress | ComplexKeyPress;
