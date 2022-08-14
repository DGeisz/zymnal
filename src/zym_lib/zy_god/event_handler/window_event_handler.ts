type EventListenerRemover = () => void;

export class WindowEventHandler {
  static addEventListener = (
    event: string,
    handler: (a: any) => void
  ): EventListenerRemover => {
    window.addEventListener(event, handler);

    return () => {
      window.removeEventListener(event, handler);
    };
  };
}

// export const windowEventHandler = new WindowEventHandler();
