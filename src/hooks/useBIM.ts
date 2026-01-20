/**
 * Custom React hooks for BIM functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BIMCore } from '../modules/bim-core';
import { IFCLoaderModule } from '../modules/ifc-loader';
import { SelectionModule, type SelectedElement } from '../modules/selection';
import { PropertiesModule } from '../modules/properties';
import type { ModelInfo, TableNode } from '../types/bim';

export interface UseBIMReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  loadProgress: number;
  error: string | null;
  loadedModels: ModelInfo[];
  selectedElements: SelectedElement[];
  properties: TableNode[];

  // Actions
  initialize: (container: HTMLElement) => Promise<void>;
  loadIFCFromUrl: (url: string) => Promise<void>;
  loadIFCFromFile: (file: File) => Promise<void>;
  clearSelection: () => void;
  updateProperty: (localId: number, name: string, value: string | number | boolean) => void;
  savePropertyChanges: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

export function useBIM(): UseBIMReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadedModels, setLoadedModels] = useState<ModelInfo[]>([]);
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
  const [properties, setProperties] = useState<TableNode[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const bimCoreRef = useRef<BIMCore | null>(null);
  const ifcLoaderRef = useRef<IFCLoaderModule | null>(null);
  const selectionRef = useRef<SelectionModule | null>(null);
  const propertiesRef = useRef<PropertiesModule | null>(null);

  const initialize = useCallback(async (container: HTMLElement) => {
    if (isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);

      // Initialize BIM Core
      const bimCore = BIMCore.getInstance();
      await bimCore.initialize({ container });
      bimCoreRef.current = bimCore;

      // Initialize IFC Loader
      const ifcLoader = new IFCLoaderModule();
      ifcLoader.onLoadProgress = setLoadProgress;
      ifcLoader.onModelLoaded = (model) => {
        setLoadedModels((prev) => [...prev, model]);
      };
      ifcLoader.onLoadError = (err) => {
        setError(err.message);
      };
      await ifcLoader.initialize();
      ifcLoaderRef.current = ifcLoader;

      // Initialize Selection Module
      const selection = new SelectionModule();
      selection.onSelect = async (elements) => {
        setSelectedElements(elements);

        // Load properties for first selected element
        if (elements.length > 0 && propertiesRef.current) {
          const firstElement = elements[0];
          try {
            const props = await propertiesRef.current.loadPropertiesForElement(
              firstElement.modelId,
              firstElement.localId
            );
            setProperties(props);
          } catch (err) {
            console.error('Failed to load properties:', err);
          }
        }
      };
      selection.onDeselect = () => {
        setSelectedElements([]);
        setProperties([]);
        if (propertiesRef.current) {
          propertiesRef.current.clearCurrentSelection();
        }
      };
      await selection.initialize();
      selectionRef.current = selection;

      // Initialize Properties Module
      const propertiesModule = new PropertiesModule();
      propertiesModule.onPropertiesLoaded = setProperties;
      propertiesModule.onPropertiesUpdated = () => {
        setHasUnsavedChanges(false);
      };
      await propertiesModule.initialize();
      propertiesRef.current = propertiesModule;

      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize BIM');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const loadIFCFromUrl = useCallback(async (url: string) => {
    if (!ifcLoaderRef.current) {
      setError('IFC Loader not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setLoadProgress(0);
      setError(null);
      await ifcLoaderRef.current.loadFromUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load IFC');
    } finally {
      setIsLoading(false);
      setLoadProgress(0);
    }
  }, []);

  const loadIFCFromFile = useCallback(async (file: File) => {
    if (!ifcLoaderRef.current) {
      setError('IFC Loader not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setLoadProgress(0);
      setError(null);
      await ifcLoaderRef.current.loadFromFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load IFC');
    } finally {
      setIsLoading(false);
      setLoadProgress(0);
    }
  }, []);

  const clearSelection = useCallback(() => {
    selectionRef.current?.clearSelection();
  }, []);

  const updateProperty = useCallback((localId: number, name: string, value: string | number | boolean) => {
    if (propertiesRef.current) {
      propertiesRef.current.updatePropertyValue(localId, name, value);
      setHasUnsavedChanges(true);
    }
  }, []);

  const savePropertyChanges = useCallback(async () => {
    if (propertiesRef.current) {
      await propertiesRef.current.applyChanges();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      propertiesRef.current?.dispose();
      selectionRef.current?.dispose();
      ifcLoaderRef.current?.dispose();
      bimCoreRef.current?.dispose();
    };
  }, []);

  return {
    isInitialized,
    isLoading,
    loadProgress,
    error,
    loadedModels,
    selectedElements,
    properties,
    initialize,
    loadIFCFromUrl,
    loadIFCFromFile,
    clearSelection,
    updateProperty,
    savePropertyChanges,
    hasUnsavedChanges,
  };
}
