import { useEffect, useMemo, useState } from "react";
import { Zym } from "../zym/zym";

export class ReactiveVariable<T> {
  private value: T;
  private registeredInstances: (
    | ReactiveVariableInstance<T>
    | HookInstance<T>
  )[] = [];

  constructor(value: T) {
    this.value = value;
  }

  get(): T {
    return this.value;
  }

  set = (t: T) => {
    this.value = t;

    this.registeredInstances.forEach((i) => i.reRender());
  };

  new = (zym: Zym, readonly?: boolean): ReactiveVariableInstance<T> => {
    const inst = new ReactiveVariableInstance(this, zym, !!readonly);
    this.registeredInstances.push(inst);

    return inst;
  };

  unRegisterInstance = (id: number) => {
    this.registeredInstances = this.registeredInstances.filter(
      (i) => i.__id !== id
    );
  };

  newHook = (render: () => void): HookInstance<T> => {
    const hook = new HookInstance<T>(this, render);
    this.registeredInstances.push(hook);

    return hook;
  };
}

class ReactiveVariableInstance<T> {
  private variable: ReactiveVariable<T>;
  private readonly: boolean;
  private zym: Zym;
  __id = Math.random();

  constructor(variable: ReactiveVariable<T>, zym: Zym, readonly: boolean) {
    this.variable = variable;
    this.readonly = readonly;
    this.zym = zym;
  }

  get = (): T => this.variable.get();

  set = (t: T) => {
    if (this.readonly) {
      throw new Error("can't set a readonly variable");
    } else {
      this.variable.set(t);
    }
  };

  reRender = () => {
    this.zym.render();
  };
}

class HookInstance<T> {
  private variable: ReactiveVariable<T>;
  reRender: () => void;
  __id = Math.random();

  constructor(variable: ReactiveVariable<T>, reRender: () => void) {
    this.variable = variable;
    this.reRender = reRender;
  }

  set = (t: T) => {
    this.variable.set(t);
  };

  get = (): T => this.variable.get();

  unRegister = () => {
    this.variable.unRegisterInstance(this.__id);
  };
}

export function useReactiveVariable<T>(
  reactiveVariable: ReactiveVariable<T>
): [T, (t: T | ((v: T) => T)) => void] {
  const [a, setA] = useState(0);
  const [registerCount, setRegCount] = useState(0);

  const hookVar = useMemo(() => {
    return reactiveVariable.newHook(() => {
      setA((a) => {
        return a + 1;
      });
    });
  }, [registerCount]);

  useEffect(() => {
    setRegCount((r) => r + 1);
    return () => {
      hookVar.unRegister();
    };
  }, []);

  const setter = (t: T | ((v: T) => T)) => {
    if (typeof t === "function") {
      const fn = t as (v: T) => T;

      hookVar.set(fn(hookVar.get()));
    } else {
      hookVar.set(t);
    }
  };

  return [hookVar.get(), setter];
}
