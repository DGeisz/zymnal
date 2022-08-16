import { DotModifierMap } from "../dot_modifiers/dot_modifiers_schema";

export const StdDotModMap: DotModifierMap = {
  id: {
    group: "std",
    item: "dot",
  },
  cost: 100,
  map: {
    vc: "vec",
    ht: "hat",
    dt: "dot",
    ddt: "ddot",
    ul: "underline",
    bd: "bold",
    scr: "mathscr",
    cal: "mathcal",
    tt: "text",
  },
};
