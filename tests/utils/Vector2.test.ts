import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../src/utils/Vector2';

describe('Vector2', () => {
  it('creates a vector with x and y coordinates', () => {
    const v = new Vector2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it('creates zero vector by default', () => {
    const v = new Vector2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('calculates magnitude correctly', () => {
    const v = new Vector2(3, 4);
    expect(v.magnitude()).toBe(5);
  });

  it('adds vectors correctly (mutating)', () => {
    const v1 = new Vector2(1, 2);
    const v2 = new Vector2(3, 4);
    v1.add(v2);
    expect(v1.x).toBe(4);
    expect(v1.y).toBe(6);
  });

  it('subtracts vectors correctly (mutating)', () => {
    const v1 = new Vector2(5, 7);
    const v2 = new Vector2(2, 3);
    v1.sub(v2);
    expect(v1.x).toBe(3);
    expect(v1.y).toBe(4);
  });

  it('scales vectors correctly (mutating)', () => {
    const v = new Vector2(2, 3);
    v.scale(2);
    expect(v.x).toBe(4);
    expect(v.y).toBe(6);
  });

  it('normalizes vectors correctly', () => {
    const v = new Vector2(3, 4);
    v.normalize();
    expect(v.x).toBeCloseTo(0.6);
    expect(v.y).toBeCloseTo(0.8);
  });

  it('calculates dot product correctly (static)', () => {
    const v1 = new Vector2(1, 2);
    const v2 = new Vector2(3, 4);
    expect(Vector2.dot(v1, v2)).toBe(11);
  });

  it('calculates distance between vectors (static)', () => {
    const v1 = new Vector2(0, 0);
    const v2 = new Vector2(3, 4);
    expect(Vector2.distance(v1, v2)).toBe(5);
  });

  it('clones vectors correctly', () => {
    const v1 = new Vector2(3, 4);
    const v2 = v1.clone();
    v1.x = 10;
    expect(v2.x).toBe(3);
  });

  it('creates directional vectors', () => {
    expect(Vector2.up().y).toBe(-1);
    expect(Vector2.down().y).toBe(1);
    expect(Vector2.left().x).toBe(-1);
    expect(Vector2.right().x).toBe(1);
  });
});
