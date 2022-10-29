import { ZymbolFrame } from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { Zymbol } from "../../zymbol";
import { SymbolZymbol } from "../symbol_zymbol/symbol_zymbol";
import { TextZymbol } from "../text_zymbol/text_zymbol";
import { Zocket } from "./zocket";

describe("Zocket", () => {
  const DUMMY_FRAME = new ZymbolFrame(0, undefined);

  it("Text merge works", () => {
    const zocket = new Zocket(DUMMY_FRAME, 0, undefined);

    /* First round, simply merge several basic text zymbols */
    {
      const zymbols = zocket.getZymbols();

      const charSets = ["aa", "bb", "cc"];

      for (const set of charSets) {
        const z = new TextZymbol(DUMMY_FRAME, 0, zocket);
        z.setCharacters(set.split(""));

        zymbols.push(z);
      }

      expect(zocket.getZymbols().length).toBe(3);

      const res = zocket.__mergeTextZymbols([1, 1]);

      expect(res.success).toBe(true);
      expect(res.newRelativeCursor).toEqual([0, 3]);

      expect(zocket.getZymbols().length).toBe(1);
      expect(
        (zocket.getZymbols()[0] as TextZymbol).getCharacters().join("")
      ).toBe("aabbcc");
    }

    /* Second round, merge basic text zymbols surrounded by tex symbols */

    {
      const zymbols: Zymbol[] = [];

      const charSuperSets = [
        ["aa", "bb", "cc"],
        ["dd", "ee", "ff"],
        ["gg", "hh", "ii"],
      ];

      for (const superSet of charSuperSets) {
        for (const set of superSet) {
          const z = new TextZymbol(DUMMY_FRAME, -1, zocket);
          z.setCharacters(set.split(""));

          zymbols.push(z);
        }

        zymbols.push(new SymbolZymbol("\\alpha", DUMMY_FRAME, 0, zocket));
      }

      zocket.setZymbols(zymbols);

      expect(zocket.getZymbols().length).toBe(12);

      const res = zocket.__mergeTextZymbols([5, 2]);

      expect(zocket.getZymbols().length).toBe(6);

      expect(res.success).toBe(true);
      expect(res.newRelativeCursor).toEqual([2, 4]);
    }
  });
});
