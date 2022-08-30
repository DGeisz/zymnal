import { FC, useEffect, useRef } from "react";
import { useRerender } from "../../../../global_utils/useRerender";
import { safeHydrate } from "../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { CursorIndex } from "../../../../zym_lib/zy_god/cursor/cursor";
import { ZyPartialPersist } from "../../../../zym_lib/zy_schema/zy_schema";
import {
  ZinputPersistenceSchema,
  ZinputSchema,
  ZINPUT_ID,
} from "./zinput_schema";

class ZinputMaster extends ZyMaster<ZinputSchema, ZinputPersistenceSchema, {}> {
  zyId: string = ZINPUT_ID;

  newBlankChild() {
    return new Zinput(0, undefined);
  }
}

export const zinputMaster = new ZinputMaster();

interface ZinputOpts {
  text: string;
  cursor: number;
}

export class Zinput extends Zyact<ZinputSchema, ZinputPersistenceSchema> {
  zyMaster: ZyMaster = zinputMaster;
  children: Zym<any, any, any, any>[] = [];

  text: string = "";
  cursor: number = 0;

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      text: "t",
    });
  }

  component: FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);

    const { rerender, opts } = useRerender<ZinputOpts>({
      text: this.text,
      cursor: this.cursor,
    });

    useEffect(() => {
      if (inputRef.current && opts?.cursor) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd =
          opts.cursor;
      }
    }, [opts?.cursor, !!inputRef.current]);

    return (
      <input
        ref={inputRef}
        placeholder="Type / for commands"
        value={opts?.text}
      />
    );
  };

  persistData() {
    return {
      text: this.text,
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<ZinputSchema, ZinputPersistenceSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      text: (t) => {
        this.text = t;
      },
    });
  }
}
