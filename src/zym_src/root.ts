import { Zyact } from "../zym_lib/zym/zymplementations/zyact/zyact";
import { Zage } from "./zyms/zage/zage";

const root = new Zage();

export function getZymTreeRoot(): Zyact {
  return root;
}
