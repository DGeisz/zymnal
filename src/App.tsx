import React, { useMemo } from "react";
import logo from "./logo.svg";
import "./App.css";
import Tex from "./global_building_blocks/tex/tex";
import { useRerender } from "./global_utils/useRerender";
import { ZymbolController } from "./lib/zymbol_controller";

function App() {
  const { rerender } = useRerender();

  const zymbolController = useMemo(() => new ZymbolController(rerender), []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Tex
          tex={zymbolController.renderTex()}
          className="text-bold text-lg mb-4"
        />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
