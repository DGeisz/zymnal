import React, { useEffect, useRef } from "react";
import katex from "katex";
import { INVALID_TEX } from "../../global_utils/latex_utils";
import { ParsedMathType, parseInlineMathText } from "./autoRender";
import { convertToObject } from "typescript";
import { memoCompareFactory } from "../../global_utils/object_utils";
import { join } from "path";

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

/**
 * Here, we include strings that simply include tex as tex just for clarity
 */
const Tex: React.FC<TexProps> = (props) => {
  if (props.inlineTex) {
    return <MathString mathText={props.tex} />;
  }

  return <MathTex tex={props.tex} displayMode className={props.className} />;
};

export default React.memo(
  Tex,
  (prevProps, nextProps) =>
    prevProps.tex === nextProps.tex &&
    prevProps.inlineTex === nextProps.inlineTex
);

interface MathStringProps {
  mathText: string;
}

const MathString: React.FC<MathStringProps> = (props) => {
  const parsedMath = parseInlineMathText(props.mathText, katexOpts);

  return (
    <span
      className="zytex-wrapper"
      contentEditable
      suppressContentEditableWarning
    >
      {parsedMath.map((i) => {
        switch (i.type) {
          case ParsedMathType.Math: {
            return (
              <span className="zytex" key={i.math}>
                <MathTex tex={i.math} displayMode={false} />
              </span>
            );
          }
          case ParsedMathType.Text: {
            return (
              <span id={i.id} contentEditable suppressContentEditableWarning>
                {i.text}
              </span>
            );
          }
        }
      })}
    </span>
  );
};

interface MathTexProps {
  tex: string;
  displayMode: boolean;
  className?: string;
  opts?: object;
}

const MathTexInner: React.FC<MathTexProps> = (props) => {
  console.log("rendered math");

  const finalOpts = {
    ...katexOpts,
    ...props.opts,
    displayMode: props.displayMode,
  };

  const cRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cRef.current) {
      recursivelyRemovePointerEvents(cRef.current);
    }
  }, [props.tex]);

  const htmlTex = katex.renderToString(props.tex, finalOpts);

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

const mathTexComp = memoCompareFactory<MathTexProps>(["tex", "displayMode"]);

const MathTex = React.memo(MathTexInner, mathTexComp);
