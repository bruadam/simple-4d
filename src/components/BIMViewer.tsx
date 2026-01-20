/**
 * BIM Viewer Component
 *
 * A React component that renders the 3D BIM viewer
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface BIMViewerProps {
  onContainerReady: (container: HTMLElement) => void;
  style?: object;
}

export function BIMViewer({ onContainerReady, style }: BIMViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current && !initializedRef.current) {
      initializedRef.current = true;
      onContainerReady(containerRef.current);
    }
  }, [onContainerReady]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder}>
          {/* Non-web placeholder */}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BIMViewer;
