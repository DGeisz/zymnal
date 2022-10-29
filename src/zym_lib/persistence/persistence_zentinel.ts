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

  constructor() {
    super();
    this.setMethodImplementation({
      addDocChangeSubscriber: async (sub) => {
        const newId = Math.random();

        this.subs.push({
          id: newId,
          sub,
        });

        return newId;
      },
      removeSubscriber: async (subId) => {
        this.subs = this.subs.filter((s) => s.id !== subId);
      },
      persistDoc: async (doc) => {
        /* Figure out how to actually grab the doc */
      },
    });
  }

  addFileEditorMessageHandler = () => {
    window.addEventListener("message", (event) => {
      const message = event.data;

      switch (message.type) {
        case "update": {
          const text = message.text;
        }
      }
    });
  };
}
