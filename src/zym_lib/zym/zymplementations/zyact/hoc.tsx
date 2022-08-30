import React, { useEffect } from "react";
import { useRerender } from "../../../../global_utils/useRerender";
import { ZySchema, ZyPersistenceSchema } from "../../../zy_schema/zy_schema";
import { Zyact } from "./zyact";

export function withZyactComponent<
  Schema extends ZySchema,
  PersistenceSchema extends ZyPersistenceSchema<Schema>,
  T extends object
>(
  zyact: Zyact<Schema, PersistenceSchema, T>,
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
