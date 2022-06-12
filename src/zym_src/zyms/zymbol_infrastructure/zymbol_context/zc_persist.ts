import { ZymbolProgressionPersist } from "../zymbol_progression/zp_persist";

export const ZCP_FIELDS: {
  PROGRESSION: "p";
} = {
  PROGRESSION: "p",
};

export interface ZymbolContextPersist {
  [ZCP_FIELDS.PROGRESSION]: ZymbolProgressionPersist;
}
