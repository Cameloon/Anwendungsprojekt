//example usage
/*
import Enum from "./Enum"


type NetworkState = Enum<{
  Idle: undefined;
  Loading: undefined;
  Success: string;
  Error: { message: string; code: number };
}>;

// Create an instance.
const currentState: NetworkState = Enum.variant("Success", "User data loaded!");


currentState.match({
  Error: (x) => {},
  Idle: (x) => {},
  Loading: (x) => {},
  Success: (x) => {},

})
*/ 

export type languageSetting = Enum<{
  german: {},
  english: {},
}>

export type languageSetter = React.Dispatch<React.SetStateAction<languageSetting>>

export default class Enum<T extends Record<string, any>> {
  private constructor(
    public readonly tag: keyof T,
    public readonly value: any
  ) {}

  /**
   * Static factory to create a new variant.
   * Usage: MyEnum.variant("Success", "Hello World")
   */
  static variant<S extends Record<string, any>, K extends keyof S>(tag: K, value: S[K]): Enum<S> {
    // We cast to 'any' internally to bypass the constructor visibility 
    // and allow the generic factory to work smoothly.
    return new (Enum as any)(tag, value);
  }

  /**
   * The Pattern Matching engine.
   * The type definition here ensures that EVERY key in T must be present.
   */
  match<R>(handlers: { [K in keyof T]: (val: T[K]) => R }): R {
    const handler = handlers[this.tag as keyof typeof handlers];
    return handler(this.value);
  }

  /**
   * Type-safe check to see if the enum is a specific variant.
   * Used for 'if' statements.
   */
  is<K extends keyof T>(tag: K): this is Enum<Pick<T, K>> & { tag: K } {
    return this.tag === tag;
  }
}