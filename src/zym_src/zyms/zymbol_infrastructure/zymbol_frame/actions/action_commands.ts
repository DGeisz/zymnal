import {
  Cursor,
  extractCursorInfo,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { zyGod } from "../../../../../zym_lib/zy_god/zy_god";
import { defaultTraitImplementation } from "../../../../../zym_lib/zy_trait/default_trait_zentinel/default_trait_zentinel_schema";
import {
  CreateZyTraitSchema,
  createZyTrait,
} from "../../../../../zym_lib/zy_trait/zy_trait";
import { Zym } from "../../../../../zym_lib/zym/zym";

const ACTION_COMMAND_ID = "action-command";

export type ActionCommandSchema = CreateZyTraitSchema<{
  checkActionLock: {
    args: Cursor;
    return: boolean;
  };
}>;

export const ActionCommandTrait = createZyTrait<ActionCommandSchema>(
  ACTION_COMMAND_ID,
  {
    checkActionLock: "cal",
  }
);

defaultTraitImplementation(ActionCommandTrait, zyGod, {
  checkActionLock: async (zym, cursor) => {
    const { nextCursorIndex, parentOfCursorElement, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) return false;

    const child = zym.children[nextCursorIndex] as Zym;

    if (child) {
      return await child.call(
        ActionCommandTrait.checkActionLock,
        childRelativeCursor
      );
    }

    return false;
  },
});
