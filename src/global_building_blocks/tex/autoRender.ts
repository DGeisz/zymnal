import katex from "katex";
import splitAtDelimiters, { Delimiter } from "./splitAtDelimiters";

export function zySpan(
  content: string,
  attributes?: Partial<{ id: string; class: string }>
): string {
  let attributeString = "";

  if (attributes) {
    for (const key in attributes) {
      // @ts-ignore
      attributeString += `${key}="${attributes[key]}"`;
    }
  }

  return `<span ${attributeString}>${content}</span>`;
}

const zyMathDelim: Delimiter = { left: "\\(", right: "\\)", display: false };

export function zyMath(math: string): string {
  return `${zyMathDelim.left}${math}${zyMathDelim.right}`;
}

export const renderMathInText = function (text: string, optionsCopy: any) {
  optionsCopy.delimiters = optionsCopy.delimiters || [
    zyMathDelim,

    // { left: "$$", right: "$$", display: true },
    // { left: "\\(", right: "\\)", display: false },
    // LaTeX uses $…$, but it ruins the display of normal `$` in text:
    // { left: "$", right: "$", display: false },
    // $ must come after $$
    // Render AMS environments even if outside $$…$$ delimiters.
    // { left: "\\begin{equation}", right: "\\end{equation}", display: false },
    // { left: "\\begin{align}", right: "\\end{align}", display: true },
    // { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
    // { left: "\\begin{gather}", right: "\\end{gather}", display: true },
    // { left: "\\begin{CD}", right: "\\end{CD}", display: true },
    // { left: "\\[", right: "\\]", display: true },
  ];

  const data = splitAtDelimiters(text, optionsCopy.delimiters);
  if (data.length === 1 && data[0].type === "text") {
    // There is no formula in the text.
    // Let's return null which means there is no need to replace
    // the current text node with a new one.
    return data[0].data;
  }

  let frag = "";

  for (let i = 0; i < data.length; i++) {
    if (data[i].type === "text") {
      frag += data[i].data;
    } else {
      let math = data[i].data;
      // Override any display mode defined in the settings with that
      // defined by the text itself
      optionsCopy.displayMode = data[i].display;
      try {
        if (optionsCopy.preProcess) {
          math = optionsCopy.preProcess(math);
        }
        frag += zySpan(katex.renderToString(math, optionsCopy), {
          class: "zytex",
        });
      } catch (e) {
        frag += zySpan(data[i].rawData!);
        continue;
      }
    }
  }

  return zySpan(frag, { class: "zytex-wrapper" });
};
