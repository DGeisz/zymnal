import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../../../zym_lib/hermes/hermes";

export const VIMIUM_MODE_ID = "vimium-mode";

export type VimiumModeZenSchema = CreateZentinelMethodSchema<{
  registerOnVimiumSelectHandler: {
    args: () => void;
    return: void;
  };
}>;

export const VimiumModeZenMethods =
  createZentinelMethodList<VimiumModeZenSchema>(VIMIUM_MODE_ID, {
    registerOnVimiumSelectHandler: 0,
  });
