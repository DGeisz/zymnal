import React, { useEffect, useRef } from "react";
import katex from "katex";

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

const Tex: React.FC<TexProps> = (props) => {
  const cRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cRef.current) {
      recursivelyRemovePointerEvents(cRef.current);
    }
  }, [props.tex]);

  return (
    <div
      ref={cRef}
      className={props.className}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(props.tex, {
          trust: true,
          displayMode: true,
          output: "html",
          strict: false,
          throwOnError: false,
        }),
      }}
    />
  );
};

export default React.memo(
  Tex,
  (prevProps, nextProps) => prevProps.tex === nextProps.tex
);
