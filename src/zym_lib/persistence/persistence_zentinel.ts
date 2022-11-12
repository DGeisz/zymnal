import { ZySub } from "../utils/types";
import { Zentinel } from "../zentinel/zentinel";
import {
  PersistedDoc,
  PersistenceZentinelSchema,
  PERSISTENCE_ZENTINEL_ID,
} from "./persistence_zentinel_schema";

class PersistenceZentinel extends Zentinel<PersistenceZentinelSchema> {
  zyId: string = PERSISTENCE_ZENTINEL_ID;
  subs: ZySub<PersistedDoc>[] = [];

  lastChange: null | any = null;

  constructor() {
    super();

    let vscode: any;

    try {
      // @ts-ignore
      vscode = acquireVsCodeApi();
    } catch (e) {
      console.error(
        "Not running as a vscode extension! This sandbox will not have persistence!"
      );
    }

    this.setMethodImplementation({
      addDocChangeSubscriber: async (sub) => {
        const newId = Math.random();

        this.subs.push({
          id: newId,
          sub,
        });

        if (this.lastChange !== null) {
          sub(this.lastChange);
        }

        return newId;
      },
      removeSubscriber: async (subId) => {
        this.subs = this.subs.filter((s) => s.id !== subId);
      },
      persistDoc: async (doc) => {
        /* Figure out how to actually grab the doc */

        if (vscode) {
          vscode.postMessage({
            type: "save",
            document: doc,
          });
        }
      },
    });

    this.addFileEditorMessageHandler();
  }

  addFileEditorMessageHandler = () => {
    window.addEventListener("message", (event) => {
      const message = event.data;

      switch (message.type) {
        case "update": {
          const text = message.text;
          try {
            const doc = JSON.parse(text);

            this.subs.forEach((sub) => sub.sub(doc));
          } catch (e) {
            this.subs.forEach((sub) => sub.sub(null));
          }
        }
      }
    });
  };
}

export const persistenceZentinel = new PersistenceZentinel();
