import React, { useEffect, useRef } from "react";
import katex from "katex";
import { INVALID_TEX } from "../../global_utils/latex_utils";
import { renderMathInText } from "./autoRender";

const DEV = false;

interface TexProps {
  tex: string;
  inlineTex?: boolean;
  className?: string;
}

function recursivelyRemovePointerEvents(e: HTMLElement) {
  if (!e.style) return;

  e.style.pointerEvents = "none";

  for (let i = 0; i < e.children.length; i++) {
    const child = e.children.item(i);

    child && recursivelyRemovePointerEvents(child as HTMLElement);
  }
}

const katexOpts: any = {
  trust: true,
  displayMode: true,
  output: "html",
  strict: false,
  throwOnError: true,
};

const invalid = katex.renderToString(INVALID_TEX, katexOpts);

const Tex: React.FC<TexProps> = (props) => {
  const cRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cRef.current) {
      recursivelyRemovePointerEvents(cRef.current);
    }
  }, [props.tex]);

  let htmlTex = invalid;
  if (!props.inlineTex) {
    try {
      htmlTex = katex.renderToString(props.tex, katexOpts);
    } catch (_e) {}
  } else {
    try {
      htmlTex = renderMathInText(props.tex, katexOpts);
    } catch (_e) {}
  }

  if (DEV) {
    return (
      <div className="flex flex-col items-start">
        <div
          ref={cRef}
          className={props.className}
          dangerouslySetInnerHTML={{
            __html: htmlTex,
          }}
        />
        {/* <div>{JSON.stringify(props.inlineTex)}</div> */}
        <div>{props.tex}</div>
      </div>
    );
  }

  return (
    <span
      ref={cRef}
      className={props.className}
      dangerouslySetInnerHTML={{
        __html: htmlTex,
      }}
    />
  );
};

export default React.memo(
  Tex,
  (prevProps, nextProps) =>
    prevProps.tex === nextProps.tex &&
    prevProps.inlineTex === nextProps.inlineTex
);
