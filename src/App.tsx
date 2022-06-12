import "./App.css";
import { zyMasterList } from "./zym_tree/master_registration/master_list";
import { getZymTreeRoot } from "./zym_tree/root";

function App() {
  /* Create the ZyBridge */
  const ZyBridge = useZyBridge(zyMasterList);

  return <ZyBridge root={getZymTreeRoot()} />;
}

export default App;
