import _ from "underscore";
import { backslash } from "../../../../../../global_utils/latex_utils";
import {
  InPlaceSymbolMap,
  SlashMap,
} from "../in_place_symbols/in_place_symbols";

const lowerGreekSlashMap: SlashMap = {
  a: "alpha",
  b: "beta",
  g: "gamma",
  dg: "digamma",
  d: "delta",
  ep: "epsilon",
  vep: "varepsilon",
  z: "zeta",
  th: "theta",
  vth: "vartheta",
  i: "iota",
  k: "kappa",
  vk: "varkappa",
  l: "lambda",
  oc: "omicron",
  s: "sigma",
  vs: "varsigma",
  u: "upsilon",
  om: "omega",
  w: "omega",
  m: "mu",
  n: "nu",
  vpi: "varpi",
  vph: "varphi",
  vro: "varrho",
};

const upperGreekSlashMap: SlashMap = {
  G: "Gamma",
  D: "Delta",
  Th: "Theta",
  L: "Lambda",
  S: "Sigma",
  E: "Sigma",
  U: "Upsilon",
  Om: "Omega",
  W: "Omega",
  vW: "varOmega",
  vPh: "varPhi",
  vPi: "varPi",
  vPs: "varPsi",
  vX: "varXi",
  vU: "varUpsilon",
  vE: "varSigma",
  vS: "varSigma",
  vL: "varLambda",
  vG: "varGamma",
  vD: "varDelta",
  vTh: "varTheta",
};

export const greekSlashMap: InPlaceSymbolMap = {
  symMap: _.mapObject(
    {
      ...lowerGreekSlashMap,
      ...upperGreekSlashMap,
    },
    backslash
  ),
  id: {
    group: "greek",
    item: "slash",
  },
  cost: 100,
};

export const greekDirectMap: InPlaceSymbolMap = {
  symMap: _.mapObject(
    {
      moo: "mu",
      noo: "nu",
      Lm: "Lambda",
      lm: "lambda",
    },
    backslash
  ),
  id: {
    group: "greek",
    item: "direct",
  },
  cost: 100,
};
