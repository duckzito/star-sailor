export interface State {
  enter?: () => void;
  update?: (delta: number) => void;
  exit?: () => void;
}

export class StateMachine {
  private states = new Map<string, State>();
  private currentState: string | null = null;

  addState(name: string, state: State): this {
    this.states.set(name, state);
    return this;
  }

  transition(name: string): void {
    if (name === this.currentState) return;
    if (!this.states.has(name)) {
      console.warn(`StateMachine: unknown state "${name}"`);
      return;
    }

    if (this.currentState) {
      this.states.get(this.currentState)?.exit?.();
    }
    this.currentState = name;
    this.states.get(name)?.enter?.();
  }

  update(delta: number): void {
    if (this.currentState) {
      this.states.get(this.currentState)?.update?.(delta);
    }
  }

  getCurrentState(): string | null {
    return this.currentState;
  }
}
