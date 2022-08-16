import React, { useEffect, useRef } from "react";
import katex from "katex";
import { INVALID_TEX } from "../../global_utils/latex_utils";

const DEV = false;

interface TexProps {
  tex: string;
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
  throwOnError: false,
};

const Tex: React.FC<TexProps> = (props) => {
  const cRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cRef.current) {
      recursivelyRemovePointerEvents(cRef.current);
    }
  }, [props.tex]);

  let renders = true;
  try {
    katex.renderToString(props.tex, {
      ...katexOpts,
      throwOnError: true,
    });
  } catch (_e) {
    renders = false;
  }

  if (DEV) {
    return (
      <div className="flex flex-col items-start">
        <div
          ref={cRef}
          className={props.className}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(
              renders ? props.tex : INVALID_TEX,
              katexOpts
            ),
          }}
        />
        <div>{props.tex}</div>
      </div>
    );
  }

  return (
    <div
      ref={cRef}
      className={props.className}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(
          renders ? props.tex : INVALID_TEX,
          katexOpts
        ),
      }}
    />
  );
};

export default React.memo(
  Tex,
  (prevProps, nextProps) => prevProps.tex === nextProps.tex
);
