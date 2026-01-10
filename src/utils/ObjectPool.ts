// src/utils/ObjectPool.ts - Object pooling for performance

export interface Poolable {
  reset(): void;
  active: boolean;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private active: T[] = [];
  private readonly factory: () => T;
  private readonly initialSize: number;
  private readonly maxSize: number;

  constructor(
    factory: () => T,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.initialSize = initialSize;
    this.maxSize = maxSize;

    // Pre-populate the pool
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else if (this.active.length < this.maxSize) {
      obj = this.factory();
    } else {
      // Pool is exhausted, recycle oldest active object
      obj = this.active.shift()!;
      obj.reset();
    }

    obj.active = true;
    this.active.push(obj);
    return obj;
  }

  release(obj: T): void {
    const index = this.active.indexOf(obj);
    if (index !== -1) {
      this.active.splice(index, 1);
      obj.reset();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  releaseAll(): void {
    while (this.active.length > 0) {
      const obj = this.active.pop()!;
      obj.reset();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  forEach(callback: (obj: T, index: number) => void): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const item = this.active[i];
      if (item) {
        callback(item, i);
      }
    }
  }

  filter(predicate: (obj: T) => boolean): T[] {
    return this.active.filter(predicate);
  }

  find(predicate: (obj: T) => boolean): T | undefined {
    return this.active.find(predicate);
  }

  get activeCount(): number {
    return this.active.length;
  }

  get availableCount(): number {
    return this.pool.length;
  }

  get totalCount(): number {
    return this.pool.length + this.active.length;
  }

  get activeObjects(): readonly T[] {
    return this.active;
  }

  clear(): void {
    this.releaseAll();
    this.pool = [];
    
    // Re-populate with initial size
    for (let i = 0; i < this.initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }
}

// Simple array-based pool for primitives or non-Poolable objects
export class SimplePool<T> {
  private pool: T[] = [];
  private readonly factory: () => T;
  private readonly reset: ((obj: T) => void) | undefined;

  constructor(factory: () => T, reset: ((obj: T) => void) | undefined = undefined, initialSize: number = 10) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.reset) {
      this.reset(obj);
    }
    this.pool.push(obj);
  }

  get available(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool = [];
  }
}
