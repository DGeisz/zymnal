import React, { useEffect, useRef } from "react";
import katex from "katex";
import { ParsedMathType, parseInlineMathText } from "./autoRender";
import { memoCompareFactory } from "../../global_utils/object_utils";

const DEV = false;
const PERF = false;

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

  if (parsedMath.length === 0) {
    return (
      <span
        className="zytex-wrapper caret text-transparent"
        contentEditable
        suppressContentEditableWarning
      >
        Fuck you
      </span>
    );
  }

  return (
    <span
      className="zytex-wrapper caret"
      contentEditable
      suppressContentEditableWarning
    >
      {/* <div>{JSON.stringify(parsedMath)}</div> */}
      {parsedMath.map((i, z) => {
        switch (i.type) {
          case ParsedMathType.Math: {
            return (
              <span className="zytex" key={i.math} contentEditable={false}>
                <MathTex tex={i.math} displayMode={false} />
              </span>
            );
          }
          case ParsedMathType.Text: {
            return (
              <span
                id={i.id}
                key={z}
                contentEditable
                suppressContentEditableWarning
              >
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

  let start = 0;
  let end = 0;

  if (PERF) {
    start = performance.now();
  }

  const htmlTex = katex.renderToString(props.tex, finalOpts);

  if (PERF) {
    end = performance.now();
  }

  if (DEV) {
    return (
      <div>
        <span
          ref={cRef}
          contentEditable={false}
          className={props.className}
          dangerouslySetInnerHTML={{
            __html: htmlTex,
          }}
        />
        <div>{htmlTex}</div>
      </div>
    );
  }

  if (PERF) {
    return (
      <div>
        <span
          ref={cRef}
          contentEditable={false}
          className={props.className}
          dangerouslySetInnerHTML={{
            __html: htmlTex,
          }}
        />
        <div>{Math.round((end - start) * 100) / 100} Millis</div>
      </div>
    );
  }

  return (
    <span
      ref={cRef}
      contentEditable={false}
      className={props.className}
      dangerouslySetInnerHTML={{
        __html: htmlTex,
      }}
    />
  );
};

const mathTexComp = memoCompareFactory<MathTexProps>(["tex", "displayMode"]);

const MathTex = React.memo(MathTexInner, mathTexComp);
