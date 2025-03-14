export type Result<T, E> = Result.Ok<T> | Result.Err<E>;

export namespace Result {
  export class Ok<T> {
    readonly value: T;

    constructor(value: T) {
      this.value = value;
    }

    isOk(): this is Ok<T> {
      return true;
    }

    isErr(): this is Err<never> {
      return false;
    }

    map<U>(fn: (value: T) => U): Result<U, never> {
      return Result.ok(fn(this.value));
    }

    mapErr<U>(fn: (error: never) => U): Result<T, U> {
      return Result.ok(this.value);
    }

    unwrap(): T {
      return this.value;
    }
  }

  export class Err<E> {
    readonly error: E;

    constructor(error: E) {
      this.error = error;
    }

    isOk(): this is Ok<never> {
      return false;
    }

    isErr(): this is Err<E> {
      return true;
    }

    map<U>(fn: (value: never) => U): Result<never, E> {
      return Result.err(this.error);
    }

    mapErr<U>(fn: (error: E) => U): Result<never, U> {
      return Result.err(fn(this.error));
    }

    unwrap(): never {
      throw new Error(this.error as unknown as string);
    }
  }

  export function ok<T>(value: T): Ok<T> {
    return new Ok(value);
  }

  export function err<E>(error: E): Err<E> {
    return new Err(error);
  }
}