import React, { useEffect } from "react";
import { useRerender } from "../../../../global_utils/useRerender";
import { Zyact } from "./zyact";

export function withZyactComponent<P, T extends object>(
  zyact: Zyact<P, T>,
  Component: React.FC<T>
): React.FC<T> {
  return (props) => {
    const { rerender } = useRerender();

    useEffect(() => {
      zyact.setRerender(rerender);
    }, []);

    return <Component {...props} />;
  };
}
