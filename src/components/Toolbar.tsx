/**
 * Toolbar Component
 *
 * A React component that provides BIM application controls
 */

import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { ModelInfo } from '../types/bim';

interface ToolbarProps {
  loadedModels: ModelInfo[];
  isLoading: boolean;
  loadProgress: number;
  onLoadFile: (file: File) => void;
  onLoadUrl?: (url: string) => void;
  onClearSelection: () => void;
  selectedCount: number;
}

export function Toolbar({
  loadedModels,
  isLoading,
  loadProgress,
  onLoadFile,
  onLoadUrl,
  onClearSelection,
  selectedCount,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = useCallback(() => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onLoadFile]);

  const handleLoadSample = useCallback(() => {
    if (onLoadUrl) {
      // Load Schneestock IFC sample from Swiss-Property-AG
      onLoadUrl('https://raw.githubusercontent.com/Swiss-Property-AG/Schneestock-Public/main/ZGRAGGEN.ifc');
    }
  }, [onLoadUrl]);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>Simple 4D BIM</Text>

        <View style={styles.buttonGroup}>
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".ifc"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleFileButtonClick}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Load IFC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleLoadSample}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Load Sample</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.centerSection}>
        {isLoading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${loadProgress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Loading... {Math.round(loadProgress * 100)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        {selectedCount > 0 && (
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              {selectedCount} element{selectedCount !== 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={onClearSelection}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {loadedModels.length > 0 && (
          <View style={styles.modelsInfo}>
            <Text style={styles.modelsText}>
              {loadedModels.length} model{loadedModels.length !== 1 ? 's' : ''} loaded
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f0f1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3a5a',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: '#64ffda',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: '#2d3a5a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
  },
  progressText: {
    color: '#8892b0',
    fontSize: 12,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionText: {
    color: '#64ffda',
    fontSize: 13,
  },
  modelsInfo: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#2d3a5a',
  },
  modelsText: {
    color: '#8892b0',
    fontSize: 13,
  },
});

export default Toolbar;
