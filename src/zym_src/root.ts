import { Zyact } from "../zym_lib/zym/zym_types";
import { Zage } from "./zage/zage";

const root = new Zage();

export function getZymTreeRoot(): Zyact {
  return root;
}
