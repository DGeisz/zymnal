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

export type MatrixZymbolSchema = CreateZySchema<
  {
    children: IdentifiedBaseSchema<ZocketSchema>[];
    wrapper: MatrixWrapperTex;
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
  }
>;
