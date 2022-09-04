import katex from "katex";
import escape_latex from "escape-latex";
import { palette } from "../global_styles/palette";
import type { TeX } from "../zym_src/zyms/zymbol/zymbol_types";
import { Cursor } from "../zym_lib/zy_god/cursor/cursor";
import { zyMath } from "../global_building_blocks/tex/autoRender";

const renderToString = katex.renderToString;

export function add_latex_color(tex: string | (() => string), color: string) {
  let final = typeof tex === "string" ? tex : tex();

  return `{\\color{${color}}{${final}}}`;
}

export function add_color_box(tex: string, color: string, inline: boolean) {
  if (inline) {
    return `\\colorbox{${color}}{$ ${tex} $}`;
  } else {
    return `\\colorbox{${color}}{$\\displaystyle ${tex} $}`;
  }
}

export function create_tex_text(text: string) {
  // @ts-ignore
  return `{\\text{${escape_latex(text, { preserveFormatting: true })}}}`;
}

export function wrapHtmlId(tex: string, html_id: string) {
  return `\\htmlId{${html_id}}{${tex}}`;
}

export function wrapHtmlClass(tex: string, class_name: string): string {
  return `\\htmlClass{${class_name}}{${tex}}`;
}

export const LATEX_SPACE = "\\;";
export const LATEX_EMPTY_SOCKET = "{\\footnotesize \\square}";
export const LATEX_NAME = "\\LaTeX";

export const CURSOR_NAME = "cursor";
export const CURSOR_LATEX: string = ` \\htmlClass{${CURSOR_NAME}}{\\color{none} \\boldsymbol{|}} `;
export const INLINE_CURSOR_LATEX: string = zyMath(CURSOR_LATEX);

export const FULL_COVER_CURSOR_CLASS_NAME = "full-cover-cursor";

export function text_with_cursor(
  text: string,
  cursor_position: number
): string {
  return `${create_tex_text(
    text.slice(0, cursor_position)
  )}${CURSOR_LATEX}${create_tex_text(text.slice(cursor_position))}`;
}

export function fullTermCursorTex(tex: string): TeX {
  return wrapHtmlClass(tex, FULL_COVER_CURSOR_CLASS_NAME);
}

export function textWithFullTermCursor(
  text: string,
  cursorPosition: number
): string {
  return `${create_tex_text(text.slice(0, cursorPosition))}${fullTermCursorTex(
    create_tex_text(text.slice(cursorPosition, cursorPosition + 1))
  )}${create_tex_text(text.slice(cursorPosition + 1))}`;
}

export const INVALID_TEX = add_latex_color(
  create_tex_text("Invalid ") + "\\TeX",
  palette.danger
);

export const ALLOWED_NON_ALPHA_NUMERIC_CHARS = [
  "/",
  "[",
  "]",
  "(",
  ")",
  ",",
  "<",
  ">",
  "-",
  "!",
  "*",
  "+",
  "=",
  "'",
  '"',
  ";",
  ":",
  "|",
];

export function tex_renders_properly(tex: string): boolean {
  let renders;

  try {
    renderToString(tex, {
      trust: true,
      displayMode: true,
      output: "html",
      strict: false,
      throwOnError: true,
    });

    renders = true;
  } catch (_) {
    renders = false;
  }

  return renders;
}

export function backslash(str: string): TeX {
  return "\\" + str;
}

export function checkLatex(tex: TeX): boolean {
  try {
    katex.renderToString(tex, {
      trust: true,
      displayMode: true,
      output: "html",
      strict: false,
      throwOnError: true,
    });

    return true;
  } catch (_e) {
    return false;
  }
}

export function cursorToString(cursor: Cursor): string {
  return cursor.map((c) => c.toString()).join(":");
}

export const TeXBinaryOperators = [
  "+",
  "=",
  "-",
  ...[
    "cdot",
    "gtrdot",
    "cdotp",
    "intercal",
    "centerdot",
    "land",
    "rhd",
    "circ",
    "leftthreetimes",
    "rightthreetimes",
    "amalg",
    "circledast",
    "ldotp",
    "rtimes",
    "And",
    "circledcirc",
    "lor",
    "setminus",
    "ast",
    "circleddash",
    "lessdot",
    "smallsetminus",
    "barwedge",
    "Cup",
    "lhd",
    "sqcap",
    "bigcirc",
    "cup",
    "ltimes",
    "sqcup",
    "bmod",
    "curlyvee",
    "times",
    "boxdot",
    "curlywedge",
    "mp",
    "unlhd",
    "boxminus",
    "div",
    "odot",
    "unrhd",
    "boxplus",
    "divideontimes",
    "ominus",
    "uplus",
    "boxtimes",
    "dotplus",
    "oplus",
    "vee",
    "bullet",
    "doublebarwedge",
    "otimes",
    "veebar",
    "Cap",
    "doublecap",
    "oslash",
    "wedge",
    "cap",
    "doublecup",
    "pm",
    "plusmn",
    "wr",
  ].map(backslash),
];
