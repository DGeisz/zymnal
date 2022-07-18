import { EventEmitter } from "eventemitter3";

export class ControlledAwaiter {
  private ee?: any;
  private triggered = false;

  trigger = () => {
    if (this.ee) {
      this.ee.emit("trigger");
    }

    this.triggered = true;
  };

  awaitTrigger = async () => {
    if (!this.ee) {
      this.ee = new EventEmitter();
    }

    if (this.triggered) {
      return;
    } else {
      return new Promise((resolve) => this.ee!.once("trigger", resolve));
    }
  };

  reset = () => {
    this.triggered = false;
  };
}
