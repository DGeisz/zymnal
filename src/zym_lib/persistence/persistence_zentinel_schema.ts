import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../hermes/hermes";
import { SubId } from "../utils/types";

export const PERSISTENCE_ZENTINEL_ID = "persistence_zentinel";

export type PersistedDoc = any;

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

export const PersistenceMethod =
  createZentinelMethodList<PersistenceZentinelSchema>(PERSISTENCE_ZENTINEL_ID, {
    addDocChangeSubscriber: 0,
    removeSubscriber: 0,
    persistDoc: 0,
  });
