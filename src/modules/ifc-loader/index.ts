/**
 * IFC Loader Module
 *
 * This module handles loading and managing IFC files:
 * - IFC file loading and conversion to Fragments
 * - Model management
 * - Fragment worker setup
 */

import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import { BIMCore } from '../bim-core';
import type { ModelInfo } from '../../types/bim';

export interface IFCLoaderConfig {
  wasmPath?: string;
  workerUrl?: string;
}

const DEFAULT_WASM_PATH = 'https://unpkg.com/web-ifc@0.0.72/';
const DEFAULT_WORKER_URL = 'https://thatopen.github.io/engine_fragment/resources/worker.mjs';

export class IFCLoaderModule {
  private bimCore: BIMCore;
  private ifcLoader: OBC.IfcLoader | null = null;
  private fragmentsManager: OBC.FragmentsManager | null = null;
  private _initialized = false;
  private loadedModels: Map<string, ModelInfo> = new Map();

  // Event callbacks
  public onModelLoaded?: (modelInfo: ModelInfo) => void;
  public onLoadProgress?: (progress: number) => void;
  public onLoadError?: (error: Error) => void;

  constructor() {
    this.bimCore = BIMCore.getInstance();
  }

  async initialize(config: IFCLoaderConfig = {}): Promise<void> {
    if (this._initialized) {
      console.warn('IFCLoaderModule already initialized');
      return;
    }

    if (!this.bimCore.isInitialized) {
      throw new Error('BIMCore must be initialized before IFCLoaderModule');
    }

    const { components, world } = this.bimCore;
    if (!world) {
      throw new Error('World not available');
    }

    // Setup FragmentsManager
    this.fragmentsManager = components.get(OBC.FragmentsManager);
    const workerUrl = config.workerUrl ?? DEFAULT_WORKER_URL;
    await this.fragmentsManager.init(workerUrl);

    // Setup IFC Loader
    this.ifcLoader = components.get(OBC.IfcLoader);
    await this.ifcLoader.setup({
      autoSetWasm: false,
      wasm: {
        path: config.wasmPath ?? DEFAULT_WASM_PATH,
        absolute: true,
      },
    });

    // Listen for IFC class conversions
    this.ifcLoader.onIfcImporterInitialized.add((importer) => {
      const classCount = importer.classes ? Object.keys(importer.classes).length : 0;
      console.log('IFC Importer initialized with classes:', classCount);
    });

    this._initialized = true;
  }

  async loadFromUrl(url: string, modelId?: string): Promise<string> {
    if (!this._initialized || !this.ifcLoader || !this.fragmentsManager) {
      throw new Error('IFCLoaderModule not initialized');
    }

    const { world } = this.bimCore;
    if (!world) {
      throw new Error('World not available');
    }

    try {
      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch IFC file: ${response.statusText}`);
      }

      const data = await response.arrayBuffer();
      const buffer = new Uint8Array(data);

      // Generate model ID if not provided
      const id = modelId ?? `model_${Date.now()}`;
      const fileName = url.split('/').pop() ?? 'unknown.ifc';

      // Load the IFC file
      const model = await this.ifcLoader.load(buffer, false, id, {
        processData: {
          progressCallback: (progress: number) => {
            this.onLoadProgress?.(progress);
          },
        },
      });

      // Add model to scene - model has an 'object' property that is the Three.js object
      const modelObject = (model as unknown as { object?: THREE.Object3D }).object;
      if (modelObject) {
        (world.scene.three as THREE.Scene).add(modelObject);
      }

      // Track loaded model
      const modelInfo: ModelInfo = {
        id,
        name: fileName,
        loaded: true,
      };
      this.loadedModels.set(id, modelInfo);

      this.onModelLoaded?.(modelInfo);

      return id;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onLoadError?.(err);
      throw err;
    }
  }

  async loadFromFile(file: File, modelId?: string): Promise<string> {
    if (!this._initialized || !this.ifcLoader || !this.fragmentsManager) {
      throw new Error('IFCLoaderModule not initialized');
    }

    const { world } = this.bimCore;
    if (!world) {
      throw new Error('World not available');
    }

    try {
      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);

      // Generate model ID if not provided
      const id = modelId ?? `model_${Date.now()}`;

      // Load the IFC file
      const model = await this.ifcLoader.load(buffer, false, id, {
        processData: {
          progressCallback: (progress: number) => {
            this.onLoadProgress?.(progress);
          },
        },
      });

      // Add model to scene - model has an 'object' property that is the Three.js object
      const modelObject = (model as unknown as { object?: THREE.Object3D }).object;
      if (modelObject) {
        (world.scene.three as THREE.Scene).add(modelObject);
      }

      // Track loaded model
      const modelInfo: ModelInfo = {
        id,
        name: file.name,
        loaded: true,
      };
      this.loadedModels.set(id, modelInfo);

      this.onModelLoaded?.(modelInfo);

      return id;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onLoadError?.(err);
      throw err;
    }
  }

  getLoadedModels(): ModelInfo[] {
    return Array.from(this.loadedModels.values());
  }

  getFragmentsManager(): OBC.FragmentsManager | null {
    return this.fragmentsManager;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  dispose(): void {
    this.loadedModels.clear();
    this._initialized = false;
    this.ifcLoader = null;
    this.fragmentsManager = null;
  }
}

export default IFCLoaderModule;
