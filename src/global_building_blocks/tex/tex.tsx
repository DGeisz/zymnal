import React from "react";
import katex from "katex";

interface TexProps {
  tex: string;
  className?: string;
}

const Tex: React.FC<TexProps> = (props) => {
  return (
    <div
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

export default Tex;
