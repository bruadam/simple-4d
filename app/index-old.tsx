/**
 * Main Application Screen
 *
 * This is the main entry point for the Simple 4D BIM application.
 * It combines the BIM viewer, toolbar, and properties panel.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { BIMViewer, PropertiesTable, Toolbar } from '../src/components';
import { useBIM } from '../src/hooks/useBIM';

export default function HomeScreen() {
  const {
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
  } = useBIM();

  const handleContainerReady = useCallback(
    async (container: HTMLElement) => {
      await initialize(container);
    },
    [initialize]
  );

  const handleLoadFile = useCallback(
    (file: File) => {
      loadIFCFromFile(file);
    },
    [loadIFCFromFile]
  );

  const handleLoadUrl = useCallback(
    (url: string) => {
      loadIFCFromUrl(url);
    },
    [loadIFCFromUrl]
  );

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedText}>
            This application is designed for web only.
          </Text>
          <Text style={styles.unsupportedSubtext}>
            Please access it through a web browser.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <Toolbar
        loadedModels={loadedModels}
        isLoading={isLoading}
        loadProgress={loadProgress}
        onLoadFile={handleLoadFile}
        onLoadUrl={handleLoadUrl}
        onClearSelection={clearSelection}
        selectedCount={selectedElements.length}
      />

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* BIM Viewer */}
        <View style={styles.viewerContainer}>
          <BIMViewer onContainerReady={handleContainerReady} />

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Loading Overlay */}
          {!isInitialized && !error && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Initializing BIM Engine...</Text>
            </View>
          )}
        </View>

        {/* Properties Panel */}
        <View style={styles.propertiesPanel}>
          <PropertiesTable
            data={properties}
            onPropertyChange={updateProperty}
            onSave={savePropertyChanges}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </View>
      </View>

      {/* Footer with instructions */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Click to select elements • Double-click for detailed selection • Escape to deselect
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  viewerContainer: {
    flex: 1,
    position: 'relative',
  },
  propertiesPanel: {
    width: 350,
    backgroundColor: '#16213e',
    borderLeftWidth: 1,
    borderLeftColor: '#2d3a5a',
    padding: 12,
  },
  errorContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64ffda',
    fontSize: 16,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unsupportedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  unsupportedSubtext: {
    color: '#8892b0',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#0f0f1a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2d3a5a',
  },
  footerText: {
    color: '#8892b0',
    fontSize: 12,
    textAlign: 'center',
  },
});
