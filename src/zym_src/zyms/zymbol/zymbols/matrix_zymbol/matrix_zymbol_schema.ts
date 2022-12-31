import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { ZocketSchema } from "../zocket/zocket_schema";

export const MATRIX_ZYMBOL_ID = "matrix-zymbol";

export interface MatrixWrapperTex {
  envName?: string;
  leftSymbol: string;
  rightSymbol: string;
}

export const BASIC_MATRIX_WRAPPER: MatrixWrapperTex = {
  envName: "matrix",
  leftSymbol: "",
  rightSymbol: "",
};

export type MatrixMap = Record<string, MatrixWrapperTex>;

export const MATRIX_MAP: MatrixMap = {
  mt: BASIC_MATRIX_WRAPPER,
  pmt: {
    envName: "pmatrix",
    leftSymbol: "\\lparen",
    rightSymbol: "\\rparen",
  },
  bmt: {
    envName: "bmatrix",
    leftSymbol: "\\lbrack",
    rightSymbol: "\\rbrack",
  },
  vmt: {
    envName: "vmatrix",
    leftSymbol: "\\vert",
    rightSymbol: "\\vert",
  },
  vvmt: {
    envName: "Vmatrix",
    leftSymbol: "\\Vert",
    rightSymbol: "\\Vert",
  },
  brmt: {
    envName: "Bmatrix",
    leftSymbol: "\\lbrace",
    rightSymbol: "\\rbrace",
  },
  case: {
    envName: "cases",
    leftSymbol: "\\lbrace",
    rightSymbol: "",
  },
  rcase: {
    envName: "rcases",
    leftSymbol: "",
    rightSymbol: "\\rbrace",
  },
};

export const EXTENDED_MATRIX_MAP: MatrixMap = {
  ...MATRIX_MAP,
  norm: {
    envName: "Vmatrix",
    leftSymbol: "\\Vert",
    rightSymbol: "\\Vert",
  },
  det: {
    envName: "vmatrix",
    leftSymbol: "\\vert",
    rightSymbol: "\\vert",
  },
};

export const MATRIX_MAP_LABELS = Object.keys(MATRIX_MAP);

export type MatrixZymbolSchema = CreateZySchema<
  {
    children: IdentifiedBaseSchema<ZocketSchema>[];
    wrapper: MatrixWrapperTex;
    showEmptyZockets: boolean;
    rows: number;
    cols: number;
  },
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<ZocketSchema>[];
    };
    wrapper: "w";
    rows: "r";
    cols: "cl";
    showEmptyZockets: "s";
  }
>;
