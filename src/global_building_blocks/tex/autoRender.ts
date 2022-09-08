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

const empty = katex.renderToString(" ");

export function zyMath(math: string): string {
  return `${zyMathDelim.left}${math}${zyMathDelim.right}`;
}

export const renderMathInText = function (text: string, optionsCopy: any) {
  optionsCopy = { ...optionsCopy };

  optionsCopy.delimiters = optionsCopy.delimiters || [zyMathDelim];

  const data = splitAtDelimiters(text, optionsCopy.delimiters);
  if (data.length === 1 && data[0].type === "text") {
    return zySpan(data[0].data + empty, { class: "zytex-wrapper" });
  }

  let frag = "";

  for (let i = 0; i < data.length; i++) {
    if (data[i].type === "text") {
      frag += data[i].data;
    } else {
      let math = data[i].data;
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

  return zySpan(frag + " ", { class: "zytex-wrapper" });
};
