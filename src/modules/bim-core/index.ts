/**
 * BIM Core Module
 *
 * This module provides the core BIM functionality including:
 * - Three.js scene setup
 * - ThatOpen Components initialization
 * - World management
 * - Camera controls
 */

import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as BUI from '@thatopen/ui';

export interface BIMCoreConfig {
  container: HTMLElement;
  backgroundColor?: number;
}

export class BIMCore {
  private static instance: BIMCore | null = null;

  public components: OBC.Components;
  public world: OBC.World | null = null;
  public container: HTMLElement | null = null;

  private _initialized = false;

  private constructor() {
    this.components = new OBC.Components();
  }

  static getInstance(): BIMCore {
    if (!BIMCore.instance) {
      BIMCore.instance = new BIMCore();
    }
    return BIMCore.instance;
  }

  async initialize(config: BIMCoreConfig): Promise<void> {
    if (this._initialized) {
      console.warn('BIMCore already initialized');
      return;
    }

    this.container = config.container;

    // Initialize ThatOpen UI
    BUI.Manager.init();

    // Get the worlds manager
    const worlds = this.components.get(OBC.Worlds);

    // Create a new world with scene, camera, and renderer
    this.world = worlds.create<
      OBC.SimpleScene,
      OBC.OrthoPerspectiveCamera,
      OBC.SimpleRenderer
    >();

    // Setup scene
    this.world.scene = new OBC.SimpleScene(this.components);
    const simpleScene = this.world.scene as OBC.SimpleScene;
    if ('setup' in simpleScene) {
      (simpleScene as unknown as { setup: () => void }).setup();
    }

    // Set background color
    const scene = this.world.scene.three as THREE.Scene;
    scene.background = new THREE.Color(config.backgroundColor ?? 0x1a1a2e);

    // Setup renderer
    this.world.renderer = new OBC.SimpleRenderer(this.components, config.container);

    // Setup camera
    this.world.camera = new OBC.OrthoPerspectiveCamera(this.components);
    const camera = this.world.camera as OBC.OrthoPerspectiveCamera;
    if (camera.controls) {
      camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Add grid
    const grids = this.components.get(OBC.Grids);
    grids.create(this.world);

    // Initialize components
    this.components.init();

    this._initialized = true;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  dispose(): void {
    if (this._initialized) {
      this.components.dispose();
      this._initialized = false;
      this.world = null;
      this.container = null;
      BIMCore.instance = null;
    }
  }
}

export default BIMCore;
