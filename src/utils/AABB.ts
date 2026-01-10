// src/utils/AABB.ts - Axis-Aligned Bounding Box for collision detection

import { Vector2 } from './Vector2';

export interface AABBLike {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class AABB {
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number
  ) {}

  static fromCenter(cx: number, cy: number, width: number, height: number): AABB {
    return new AABB(cx - width / 2, cy - height / 2, width, height);
  }

  static fromMinMax(minX: number, minY: number, maxX: number, maxY: number): AABB {
    return new AABB(minX, minY, maxX - minX, maxY - minY);
  }

  static fromPoints(p1: Vector2, p2: Vector2): AABB {
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxX = Math.max(p1.x, p2.x);
    const maxY = Math.max(p1.y, p2.y);
    return new AABB(minX, minY, maxX - minX, maxY - minY);
  }

  clone(): AABB {
    return new AABB(this.x, this.y, this.w, this.h);
  }

  copy(other: AABBLike): this {
    this.x = other.x;
    this.y = other.y;
    this.w = other.w;
    this.h = other.h;
    return this;
  }

  set(x: number, y: number, w: number, h: number): this {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    return this;
  }

  // Getters for bounds
  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.w;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.h;
  }

  get centerX(): number {
    return this.x + this.w / 2;
  }

  get centerY(): number {
    return this.y + this.h / 2;
  }

  get center(): Vector2 {
    return new Vector2(this.centerX, this.centerY);
  }

  get width(): number {
    return this.w;
  }

  get height(): number {
    return this.h;
  }

  // Setters
  setCenter(x: number, y: number): this {
    this.x = x - this.w / 2;
    this.y = y - this.h / 2;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setSize(width: number, height: number): this {
    this.w = width;
    this.h = height;
    return this;
  }

  translate(dx: number, dy: number): this {
    this.x += dx;
    this.y += dy;
    return this;
  }

  // Collision detection
  intersects(other: AABBLike): boolean {
    return (
      this.x < other.x + other.w &&
      this.x + this.w > other.x &&
      this.y < other.y + other.h &&
      this.y + this.h > other.y
    );
  }

  contains(other: AABBLike): boolean {
    return (
      this.x <= other.x &&
      this.y <= other.y &&
      this.x + this.w >= other.x + other.w &&
      this.y + this.h >= other.y + other.h
    );
  }

  containsPoint(x: number, y: number): boolean {
    return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
  }

  containsVector(point: Vector2): boolean {
    return this.containsPoint(point.x, point.y);
  }

  // Get overlap between two AABBs
  getOverlap(other: AABBLike): { x: number; y: number } | null {
    if (!this.intersects(other)) {
      return null;
    }

    const overlapX = Math.min(this.right, other.x + other.w) - Math.max(this.left, other.x);
    const overlapY = Math.min(this.bottom, other.y + other.h) - Math.max(this.top, other.y);

    return { x: overlapX, y: overlapY };
  }

  // Get minimum translation vector to resolve collision
  getMTV(other: AABBLike): Vector2 | null {
    const overlap = this.getOverlap(other);
    if (!overlap) {
      return null;
    }

    const mtv = new Vector2();

    // Push in the direction of least overlap
    if (overlap.x < overlap.y) {
      // Push horizontally
      mtv.x = this.centerX < other.x + other.w / 2 ? -overlap.x : overlap.x;
    } else {
      // Push vertically
      mtv.y = this.centerY < other.y + other.h / 2 ? -overlap.y : overlap.y;
    }

    return mtv;
  }

  // Expand the AABB by a given amount
  expand(amount: number): this {
    this.x -= amount;
    this.y -= amount;
    this.w += amount * 2;
    this.h += amount * 2;
    return this;
  }

  // Contract the AABB by a given amount
  contract(amount: number): this {
    this.x += amount;
    this.y += amount;
    this.w -= amount * 2;
    this.h -= amount * 2;
    return this;
  }

  // Get union of two AABBs
  union(other: AABBLike): AABB {
    const minX = Math.min(this.x, other.x);
    const minY = Math.min(this.y, other.y);
    const maxX = Math.max(this.right, other.x + other.w);
    const maxY = Math.max(this.bottom, other.y + other.h);
    return new AABB(minX, minY, maxX - minX, maxY - minY);
  }

  // Get intersection of two AABBs
  intersection(other: AABBLike): AABB | null {
    if (!this.intersects(other)) {
      return null;
    }

    const minX = Math.max(this.x, other.x);
    const minY = Math.max(this.y, other.y);
    const maxX = Math.min(this.right, other.x + other.w);
    const maxY = Math.min(this.bottom, other.y + other.h);

    return new AABB(minX, minY, maxX - minX, maxY - minY);
  }

  // Distance to another AABB (0 if intersecting)
  distanceTo(other: AABBLike): number {
    if (this.intersects(other)) {
      return 0;
    }

    let dx = 0;
    let dy = 0;

    if (this.right < other.x) {
      dx = other.x - this.right;
    } else if (other.x + other.w < this.x) {
      dx = this.x - (other.x + other.w);
    }

    if (this.bottom < other.y) {
      dy = other.y - this.bottom;
    } else if (other.y + other.h < this.y) {
      dy = this.y - (other.y + other.h);
    }

    return Math.sqrt(dx * dx + dy * dy);
  }

  // Check if a ray intersects this AABB
  raycast(
    origin: Vector2,
    direction: Vector2,
    maxDistance: number = Infinity
  ): { hit: boolean; distance: number; point: Vector2 | null } {
    const invDirX = 1 / direction.x;
    const invDirY = 1 / direction.y;

    const t1 = (this.x - origin.x) * invDirX;
    const t2 = (this.right - origin.x) * invDirX;
    const t3 = (this.y - origin.y) * invDirY;
    const t4 = (this.bottom - origin.y) * invDirY;

    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    if (tmax < 0 || tmin > tmax || tmin > maxDistance) {
      return { hit: false, distance: 0, point: null };
    }

    const distance = tmin < 0 ? tmax : tmin;
    const point = new Vector2(
      origin.x + direction.x * distance,
      origin.y + direction.y * distance
    );

    return { hit: true, distance, point };
  }

  equals(other: AABBLike, epsilon: number = 0.0001): boolean {
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon &&
      Math.abs(this.w - other.w) < epsilon &&
      Math.abs(this.h - other.h) < epsilon
    );
  }

  toString(): string {
    return `AABB(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.w.toFixed(2)}, ${this.h.toFixed(2)})`;
  }

  toObject(): AABBLike {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}

// Static helper for quick intersection check without creating objects
export function aabbIntersects(a: AABBLike, b: AABBLike): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
