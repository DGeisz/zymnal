import katex from "katex";
import { json } from "stream/consumers";
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

export enum ParsedMathType {
  Text,
  Math,
}

type ParsedMathText = {
  id: string;
  text: string;
};

interface ParsedMathMathText extends ParsedMathText {
  type: ParsedMathType.Text;
}

export type ParsedMath =
  | { type: ParsedMathType.Math; math: string }
  | ParsedMathMathText;

export function getParsedText(str: string): ParsedMathText {
  return JSON.parse(str);
}

export function createMathText(text: string, id: string): string {
  return JSON.stringify({
    id,
    text,
  });
}
export function parseInlineMathText(
  text: string,
  optionsCopy: any
): ParsedMath[] {
  optionsCopy = { ...optionsCopy };
  optionsCopy.delimiters = optionsCopy.delimiters || [zyMathDelim];

  const data = splitAtDelimiters(text, optionsCopy.delimiters);
  if (data.length === 1 && data[0].type === "text") {
    return [
      {
        type: ParsedMathType.Text,
        ...getParsedText(data[0].data),
      },
    ];
  }

  const mathElements: ParsedMath[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].type === "text") {
      mathElements.push({
        type: ParsedMathType.Text,
        ...getParsedText(data[i].data),
      });
    } else {
      let math = data[i].data;
      optionsCopy.displayMode = data[i].display;
      try {
        if (optionsCopy.preProcess) {
          math = optionsCopy.preProcess(math);
        }

        mathElements.push({
          type: ParsedMathType.Math,
          math,
        });
      } catch (e) {
        mathElements.push({
          type: ParsedMathType.Text,
          id: "ERROR",
          text: data[i].rawData ?? "",
        });
        continue;
      }
    }
  }

  return mathElements;
}
