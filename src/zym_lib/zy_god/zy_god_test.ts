import { zentinelList, zyMasterList } from "../../zym_src/root";
import { Zage } from "../../zym_src/zyms/zage/zage";
import { defaultCursorImplFactory } from "./cursor/cursor_commands";
import { defaultKeyPressImplFactory } from "./event_handler/key_press";
import { defaultUndoRedoImplFactory } from "./undo_redo/undo_redo";
import { ZyGod } from "./zy_god";

export async function createTestGod(withZage?: boolean) {
  const zyGod = new ZyGod();

  defaultKeyPressImplFactory(zyGod);
  defaultCursorImplFactory(zyGod);
  defaultUndoRedoImplFactory(zyGod);

  await zyGod.registerMasters(zyMasterList);
  await zyGod.registerZentinels(zentinelList);

  if (withZage) {
    await zyGod.setRoot(new Zage(0, undefined));
  }

  return zyGod;
}
