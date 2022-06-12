import { capitalizeFirstLetter } from "../../../global_utils/text_utils";
import { Zocket } from "../../zymbol/zymbols/zocket";
import { SymbolZymbol } from "../../zymbol/zymbols/symbol_zymbol";
import { TextZymbol, TEXT_ZYMBOL_NAME } from "../../zymbol/zymbols/text_zymbol";

const lower: string[] = [
  "alpha",
  "beta",
  "gamma",
  "delta",
  "epsilon",
  "zeta",
  "eta",
  "theta",
  "iota",
  "kappa",
  "lambda",
  "mu",
  "mu",
  "xi",
  "omicron",
  "pi",
  "rho",
  "sigma",
  "tau",
  "upsilon",
  "phi",
  "chi",
  "psi",
  "omega",
];

const caps = lower.map(capitalizeFirstLetter);
const greekLetters = lower.concat(caps);

export function greekify(zocket: Zocket) {
  const zymbols = zocket.getZymbols();

  if (zymbols.length > 0) {
    const lastZymbol = zymbols[zymbols.length - 1];

    if (lastZymbol.getName() === TEXT_ZYMBOL_NAME) {
      const textZymbol = lastZymbol as TextZymbol;
      const chars = textZymbol.getCharacters();
      const words = chars.join("").split(" ");

      if (words.length > 0) {
        const lastWord = words[words.length - 1];

        if (greekLetters.includes(lastWord)) {
          const newChars = chars.slice(0, -1 * lastWord.length);
          textZymbol.setCharacters(newChars);

          zymbols.push(new SymbolZymbol(zocket, "\\" + lastWord));
        }
      }
    }

    const final = zymbols.filter(
      (z) =>
        !(
          z.getName() === TEXT_ZYMBOL_NAME &&
          (z as TextZymbol).getCharacters().length === 0
        )
    );

    zocket.setZymbols(final);
  }
}
