import { Zocket } from "./zocket";
import { Zymbol } from "../zymbol";
import { SymbolZymbol } from "./symbol_zymbol";
import { TextZymbol } from "./text_zymbol";

describe("Zocket", () => {
  it("Text merge works", () => {
    const zocket = new Zocket();

    /* First round, simply merge several basic text zymbols */
    {
      const zymbols = zocket.getZymbols();

      const charSets = ["aa", "bb", "cc"];

      for (const set of charSets) {
        const z = new TextZymbol(zocket);
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
          const z = new TextZymbol(zocket);
          z.setCharacters(set.split(""));

          zymbols.push(z);
        }

        zymbols.push(new SymbolZymbol(zocket, "\\alpha"));
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
