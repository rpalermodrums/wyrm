// src/utils/Vector2.ts - 2D Vector math utilities

export class Vector2 {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static one(): Vector2 {
    return new Vector2(1, 1);
  }

  static up(): Vector2 {
    return new Vector2(0, -1);
  }

  static down(): Vector2 {
    return new Vector2(0, 1);
  }

  static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  static right(): Vector2 {
    return new Vector2(1, 0);
  }

  static from(x: number, y: number): Vector2 {
    return new Vector2(x, y);
  }

  static fromAngle(angle: number, magnitude: number = 1): Vector2 {
    return new Vector2(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }

  static distance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distanceSquared(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
  }

  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }

  static dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  }

  static cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  copy(other: Vector2): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  add(other: Vector2): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  addScalar(scalar: number): this {
    this.x += scalar;
    this.y += scalar;
    return this;
  }

  addXY(x: number, y: number): this {
    this.x += x;
    this.y += y;
    return this;
  }

  sub(other: Vector2): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  subScalar(scalar: number): this {
    this.x -= scalar;
    this.y -= scalar;
    return this;
  }

  mul(other: Vector2): this {
    this.x *= other.x;
    this.y *= other.y;
    return this;
  }

  scale(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  div(other: Vector2): this {
    this.x /= other.x;
    this.y /= other.y;
    return this;
  }

  divScalar(scalar: number): this {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): this {
    const mag = this.magnitude();
    if (mag > 0) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }

  normalized(): Vector2 {
    return this.clone().normalize();
  }

  limit(max: number): this {
    const magSq = this.magnitudeSquared();
    if (magSq > max * max) {
      this.divScalar(Math.sqrt(magSq)).scale(max);
    }
    return this;
  }

  setMagnitude(magnitude: number): this {
    return this.normalize().scale(magnitude);
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(other: Vector2): number {
    return Math.atan2(other.y - this.y, other.x - this.x);
  }

  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  perpendicular(): Vector2 {
    return new Vector2(-this.y, this.x);
  }

  floor(): this {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  }

  ceil(): this {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    return this;
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }

  abs(): this {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    return this;
  }

  min(other: Vector2): this {
    this.x = Math.min(this.x, other.x);
    this.y = Math.min(this.y, other.y);
    return this;
  }

  max(other: Vector2): this {
    this.x = Math.max(this.x, other.x);
    this.y = Math.max(this.y, other.y);
    return this;
  }

  clamp(min: Vector2, max: Vector2): this {
    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));
    return this;
  }

  equals(other: Vector2, epsilon: number = 0.0001): boolean {
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon
    );
  }

  isZero(epsilon: number = 0.0001): boolean {
    return Math.abs(this.x) < epsilon && Math.abs(this.y) < epsilon;
  }

  toString(): string {
    return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  toObject(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
