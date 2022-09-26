import React, { useEffect } from "react";
import { useRerender } from "../../../../global_utils/useRerender";
import {
  ZySchema,
  ZyPersistenceSchema,
  ZyBaseSchema,
} from "../../../zy_schema/zy_schema";
import { Zyact } from "./zyact";

export function withZyactComponent<
  Schema extends ZySchema<BSchema, PSchema>,
  T extends object,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
>(
  zyact: Zyact<Schema, T>,
  Component: React.FC<T>,
  initialProps: T
): React.FC<T> {
  return (props) => {
    const { rerender, opts } = useRerender<T>(initialProps);

    useEffect(() => {
      zyact.setRerender(rerender);
    }, []);

    return <Component {...props} {...opts} />;
  };
}
