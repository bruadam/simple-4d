/**
 * Properties Table Component
 *
 * A React component that displays and allows editing of BIM element properties
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import type { TableNode } from '../types/bim';

interface PropertiesTableProps {
  data: TableNode[];
  onPropertyChange?: (localId: number, name: string, value: string | number | boolean) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
}

interface PropertyRowProps {
  node: TableNode;
  depth: number;
  onPropertyChange?: (localId: number, name: string, value: string | number | boolean) => void;
}

function PropertyRow({ node, depth, onPropertyChange }: PropertyRowProps) {
  const [expanded, setExpanded] = useState(true);
  const [editValue, setEditValue] = useState(String(node.data.Value ?? ''));

  const hasChildren = node.children && node.children.length > 0;
  const isAttribute = node.data.Type === 'attribute';
  const isRelation = node.data.Type === 'relation';

  const handleValueChange = useCallback((text: string) => {
    setEditValue(text);
  }, []);

  const handleValueBlur = useCallback(() => {
    if (isAttribute && onPropertyChange && editValue !== String(node.data.Value)) {
      // Try to parse as number if possible
      const numValue = parseFloat(editValue);
      const finalValue = !isNaN(numValue) && String(numValue) === editValue ? numValue : editValue;
      onPropertyChange(node.data.LocalId, node.data.Name, finalValue);
    }
  }, [isAttribute, onPropertyChange, editValue, node.data]);

  const getRowStyle = () => {
    if (isRelation) return styles.relationRow;
    if (isAttribute) return styles.attributeRow;
    return styles.entityRow;
  };

  const renderValue = () => {
    if (node.data.Value === undefined) return null;

    if (typeof node.data.Value === 'boolean') {
      return (
        <TouchableOpacity
          style={[styles.checkbox, node.data.Value && styles.checkboxChecked]}
          onPress={() => {
            if (onPropertyChange) {
              onPropertyChange(node.data.LocalId, node.data.Name, !node.data.Value);
            }
          }}
        >
          {node.data.Value && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      );
    }

    return (
      <TextInput
        style={styles.valueInput}
        value={editValue}
        onChangeText={handleValueChange}
        onBlur={handleValueBlur}
        selectTextOnFocus
      />
    );
  };

  return (
    <View>
      <View style={[styles.row, getRowStyle(), { paddingLeft: 12 + depth * 16 }]}>
        {hasChildren ? (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={styles.expandButton}
          >
            <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.expandPlaceholder} />
        )}

        <Text style={[styles.nameText, isRelation && styles.relationText]} numberOfLines={1}>
          {node.data.Name}
        </Text>

        {renderValue()}
      </View>

      {expanded && hasChildren && (
        <View>
          {node.children!.map((child, index) => (
            <PropertyRow
              key={`${child.data.LocalId}-${child.data.Name}-${index}`}
              node={child}
              depth={depth + 1}
              onPropertyChange={onPropertyChange}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function PropertiesTable({
  data,
  onPropertyChange,
  onSave,
  hasUnsavedChanges,
}: PropertiesTableProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Select an element to view properties</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Properties</Text>
        {hasUnsavedChanges && onSave && (
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {data.map((node, index) => (
          <PropertyRow
            key={`root-${index}`}
            node={node}
            depth={0}
            onPropertyChange={onPropertyChange}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d3a5a',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3a5a',
  },
  entityRow: {
    backgroundColor: '#1e3a5f',
  },
  relationRow: {
    backgroundColor: '#1a2744',
  },
  attributeRow: {
    backgroundColor: '#16213e',
  },
  expandButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandPlaceholder: {
    width: 20,
  },
  expandIcon: {
    color: '#8892b0',
    fontSize: 10,
  },
  nameText: {
    flex: 1,
    color: '#ccd6f6',
    fontSize: 13,
    marginRight: 8,
  },
  relationText: {
    color: '#64ffda',
    fontWeight: '500',
  },
  valueInput: {
    flex: 1,
    maxWidth: 150,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2d3a5a',
    fontSize: 12,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#64ffda',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#64ffda',
  },
  checkmark: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 24,
  },
  emptyText: {
    color: '#8892b0',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PropertiesTable;
