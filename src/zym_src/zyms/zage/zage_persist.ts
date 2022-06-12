import { ZymbolContextPersist } from "../zymbol_infrastructure/zymbol_context/zc_persist";

export const ZAGE_PERSIST_FIELDS: {
  CONTEXT: "c";
} = {
  CONTEXT: "c",
};

export interface ZagePersist {
  [ZAGE_PERSIST_FIELDS.CONTEXT]: ZymbolContextPersist;
}
