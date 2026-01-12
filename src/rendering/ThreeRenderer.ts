/**
 * ThreeRenderer - Three.js rendering setup
 *
 * Manages the Three.js scene, camera, and renderer.
 * See .claude/skills/threejs-builder/SKILL.md for patterns.
 */

import * as THREE from 'three';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_FAR,
  CAMERA_POSITION,
  CAMERA_LOOK_AT,
  COLORS,
} from '../constants';

export class ThreeRenderer {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;

  private shakeOffset = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.bgDark);

    // Camera setup - side-scrolling 2.5D perspective
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      SCREEN_WIDTH / SCREEN_HEIGHT,
      CAMERA_NEAR,
      CAMERA_FAR
    );
    this.camera.position.set(
      CAMERA_POSITION.x,
      CAMERA_POSITION.y,
      CAMERA_POSITION.z
    );
    this.camera.lookAt(
      CAMERA_LOOK_AT.x,
      CAMERA_LOOK_AT.y,
      CAMERA_LOOK_AT.z
    );

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Handle resize
    window.addEventListener('resize', this.handleResize);

    // Setup initial lighting
    this.setupLighting();
  }

  private setupLighting(): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 15);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    this.scene.add(mainLight);

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.3);
    fillLight.position.set(-5, 5, -10);
    this.scene.add(fillLight);
  }

  private handleResize = (): void => {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Maintain aspect ratio
    const targetAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    const windowAspect = width / height;

    let renderWidth: number;
    let renderHeight: number;

    if (windowAspect > targetAspect) {
      // Window is wider than game
      renderHeight = height;
      renderWidth = height * targetAspect;
    } else {
      // Window is taller than game
      renderWidth = width;
      renderHeight = width / targetAspect;
    }

    this.renderer.setSize(renderWidth, renderHeight);
    this.camera.aspect = targetAspect;
    this.camera.updateProjectionMatrix();

    // Center the canvas
    this.renderer.domElement.style.marginLeft = `${(width - renderWidth) / 2}px`;
    this.renderer.domElement.style.marginTop = `${(height - renderHeight) / 2}px`;
  };

  /**
   * Set camera shake offset (for screen shake effect)
   */
  setShakeOffset(x: number, y: number): void {
    this.shakeOffset.x = x;
    this.shakeOffset.y = y;
  }

  /**
   * Update camera position to follow a target
   * Note: shakeOffset is applied only in render() to avoid double-application
   */
  setCameraTarget(x: number, y: number): void {
    this.camera.position.x = x;
    this.camera.position.y = CAMERA_POSITION.y + y * 0.3;
  }

  /**
   * Render the scene
   */
  render(): void {
    if (this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) {
      this.camera.position.x += this.shakeOffset.x;
      this.camera.position.y += this.shakeOffset.y;
      this.renderer.render(this.scene, this.camera);
      this.camera.position.x -= this.shakeOffset.x;
      this.camera.position.y -= this.shakeOffset.y;
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Add object to scene
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
