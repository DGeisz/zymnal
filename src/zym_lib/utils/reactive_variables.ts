import { Zym } from "../zym/zym";

export class ReactiveVariable<T> {
  private value: T;
  private registeredInstances: ReactiveVariableInstance<T>[] = [];

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
    }
  };

  reRender = () => {
    this.zym.render();
  };
}
