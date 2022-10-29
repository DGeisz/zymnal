import { CreateZentinelMethodSchema } from "../hermes/hermes";
import { SubId } from "../utils/types";

export const PERSISTENCE_ZENTINEL_ID = "persistence_zentinel";

export type PersistedDoc = string;

export type PersistenceZentinelSchema = CreateZentinelMethodSchema<{
  addDocChangeSubscriber: {
    args: (doc: PersistedDoc) => void;
    return: SubId;
  };
  removeSubscriber: {
    args: SubId;
    return: void;
  };
  persistDoc: {
    args: PersistedDoc;
    return: void;
  };
}>;
