import { Zym } from "../../zym/zym";
import {
  NONE,
  pointerToPath,
  some,
  ZyCmdPointer,
  ZyCommandGroupRegistration,
  ZyOption,
  ZyResult,
} from "../../zy_commands/zy_command_types";
import { Cursor } from "../cursor/cursor";

const PROPAGATING_COMMANDS_ID = "8d13258b-0201-4907-b880-319a238decac";

const pc = (name: string) => [{ groupId: PROPAGATING_COMMANDS_ID, name }];

/* Types for the single cursor prop */
interface SingleCursorPropCmdArgs<A = any> {
  cursor: Cursor;
  nodeCmd: ZyCmdPointer;
  initialArgs: A;
}

export interface CmdArgs<A = any> {
  cursor: Cursor;
  args: A;
}

export type ContinueCmd<A = any> = {
  terminated: false;
  nextArgs: A;
};

export type TerminateCmd<T = any> = {
  terminated: true;
  return: T;
};

export type SingleCursorPropReturn<T = any, A = any> =
  | TerminateCmd<T>
  | ContinueCmd<A>;

export function runSingleCursorTreePropagator<R, A = any>(
  root: Zym,
  args: SingleCursorPropCmdArgs<A>
): ZyOption<R> {
  const { cursor, initialArgs, nodeCmd } = args;

  const path = pointerToPath(nodeCmd);

  let nodeArgs = initialArgs;
  let currZym = root;
  let cursorCopy = [...cursor];

  for (const index of cursor) {
    cursorCopy.shift();

    const r = currZym.cmd<SingleCursorPropReturn<R>, CmdArgs>(path, {
      cursor: [...cursorCopy],
      args: nodeArgs,
    });

    if (r.ok) {
      if (r.val.terminated) {
        return some(r.val.return);
      } else {
        nodeArgs = r.val.nextArgs;
      }
    }

    currZym = currZym.children[index];
  }

  return NONE;
}

export const PropagatingCommands: ZyCommandGroupRegistration = {
  singleCursorTreePropagator: {
    path: pc("sctp"),
    handler: {
      call: runSingleCursorTreePropagator,
    },
  },
};
