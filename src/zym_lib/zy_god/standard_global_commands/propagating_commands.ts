import {
  ZyCmdPath,
  ZyCommandGroupRegistration,
} from "../../zy_commands/zy_command_types";
import { Cursor } from "../cursor/cursor";

const PROPAGATING_COMMANDS_ID = "8d13258b-0201-4907-b880-319a238decac";

const pc = (name: string) => [{ groupId: PROPAGATING_COMMANDS_ID, name }];

/* Types for the single cursor prop */
interface SingleCursorPropCmdArgs {
  cursor: Cursor;
  nodeCmd: ZyCmdPath;
  initialArgs: any;
}

type ContinueCmd = {
  terminated: false;
  nextArgs: any;
};

type TerminateCmd = {
  terminated: true;
  return: any;
};

type SingleCursorPropReturn = ContinueCmd | TerminateCmd;

export const PropagatingCommands: ZyCommandGroupRegistration = {
  singleCursorTreePropagator: {
    path: pc("sctp"),
    handler: {
      call: (zym, args: SingleCursorPropCmdArgs) => {
        const { cursor, initialArgs, nodeCmd } = args;

        let nodeArgs = initialArgs;
        let currZym = zym;

        for (const index of cursor) {
          const r = currZym.cmd<SingleCursorPropReturn>(nodeCmd, nodeArgs);

          if (r.ok) {
            if (r.val.terminated) {
              return r.val.return;
            } else {
              nodeArgs = r.val.nextArgs;
            }
          }

          currZym = currZym.children[index];
        }
      },
    },
  },
};
