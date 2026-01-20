/**
 * Selection Module
 *
 * This module handles element selection and highlighting:
 * - Click-based selection
 * - Hover highlighting
 * - Selection events
 * - Multi-selection support
 */

import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import { BIMCore } from '../bim-core';

export interface SelectionConfig {
  selectColor?: THREE.Color;
  hoverColor?: THREE.Color;
  selectOpacity?: number;
}

export interface SelectedElement {
  modelId: string;
  localId: number;
  data?: Record<string, unknown>;
}

export class SelectionModule {
  private bimCore: BIMCore;
  private highlighter: OBCF.Highlighter | null = null;
  private raycasters: OBC.Raycasters | null = null;
  private _initialized = false;
  private selectedElements: Map<string, Set<number>> = new Map();

  // Event callbacks
  public onSelect?: (elements: SelectedElement[]) => void;
  public onDeselect?: () => void;
  public onHover?: (element: SelectedElement | null) => void;

  constructor() {
    this.bimCore = BIMCore.getInstance();
  }

  async initialize(config: SelectionConfig = {}): Promise<void> {
    if (this._initialized) {
      console.warn('SelectionModule already initialized');
      return;
    }

    if (!this.bimCore.isInitialized) {
      throw new Error('BIMCore must be initialized before SelectionModule');
    }

    const { components, world } = this.bimCore;
    if (!world) {
      throw new Error('World not available');
    }

    // Setup Raycasters
    this.raycasters = components.get(OBC.Raycasters);
    this.raycasters.get(world);

    // Setup Highlighter
    this.highlighter = components.get(OBCF.Highlighter);

    const selectColor = config.selectColor ?? new THREE.Color('#bcf124');
    const selectOpacity = config.selectOpacity ?? 1;

    await this.highlighter.setup({
      world,
      selectMaterialDefinition: {
        color: selectColor,
        opacity: selectOpacity,
        transparent: selectOpacity < 1,
        renderedFaces: 0,
      },
    });

    // Setup selection event handlers
    this.highlighter.events.select.onHighlight.add(async (modelIdMap) => {
      const elements: SelectedElement[] = [];

      for (const [modelId, localIds] of Object.entries(modelIdMap)) {
        const localIdSet = localIds as Set<number>;

        // Store selection
        if (!this.selectedElements.has(modelId)) {
          this.selectedElements.set(modelId, new Set());
        }
        localIdSet.forEach((id) => this.selectedElements.get(modelId)!.add(id));

        // Get element data
        const fragmentsManager = components.get(OBC.FragmentsManager);
        const model = fragmentsManager.list.get(modelId);

        if (model) {
          try {
            const itemsData = await model.getItemsData([...localIdSet]);
            for (let i = 0; i < itemsData.length; i++) {
              elements.push({
                modelId,
                localId: [...localIdSet][i],
                data: itemsData[i] as Record<string, unknown>,
              });
            }
          } catch {
            // If getItemsData fails, still report selection without data
            localIdSet.forEach((localId) => {
              elements.push({ modelId, localId });
            });
          }
        } else {
          // If model not found, still report selection without data
          localIdSet.forEach((localId) => {
            elements.push({ modelId, localId });
          });
        }
      }

      this.onSelect?.(elements);
    });

    this.highlighter.events.select.onClear.add(() => {
      this.selectedElements.clear();
      this.onDeselect?.();
    });

    this._initialized = true;
  }

  clearSelection(): void {
    if (this.highlighter) {
      this.highlighter.clear('select');
      this.selectedElements.clear();
      this.onDeselect?.();
    }
  }

  getSelectedElements(): SelectedElement[] {
    const elements: SelectedElement[] = [];
    this.selectedElements.forEach((localIds, modelId) => {
      localIds.forEach((localId) => {
        elements.push({ modelId, localId });
      });
    });
    return elements;
  }

  async highlightByIds(modelId: string, localIds: number[]): Promise<void> {
    if (!this.highlighter) {
      throw new Error('SelectionModule not initialized');
    }

    const { components } = this.bimCore;
    const fragmentsManager = components.get(OBC.FragmentsManager);
    const model = fragmentsManager.list.get(modelId);

    if (model) {
      // Create a map for the highlighter
      const fragmentIdMap: Record<string, Set<number>> = {};
      fragmentIdMap[modelId] = new Set(localIds);

      await this.highlighter.highlightByID('select', fragmentIdMap);
    }
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  dispose(): void {
    this.clearSelection();
    this._initialized = false;
    this.highlighter = null;
    this.raycasters = null;
  }
}

export default SelectionModule;
