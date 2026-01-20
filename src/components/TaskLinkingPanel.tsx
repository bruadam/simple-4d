/**
 * Task Linking Panel Component
 *
 * Manages linking IFC entities to schedule tasks
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import type { ScheduleTask, TaskEntityLink, LinkRule } from '../types/schedule';

interface TaskLinkingPanelProps {
  selectedTask: ScheduleTask | null;
  tasks: ScheduleTask[];
  links: TaskEntityLink[];
  rules: LinkRule[];
  selectedEntitiesCount: number;
  onSelectTask: (taskId: string) => void;
  onLinkSelectedEntities: () => void;
  onUnlinkEntity: (entityExpressId: number) => void;
  onAddRule: (rule: Omit<LinkRule, 'id'>) => void;
  onRemoveRule: (ruleId: string) => void;
  onToggleRuleActive: (ruleId: string, isActive: boolean) => void;
  style?: object;
}

export function TaskLinkingPanel({
  selectedTask,
  tasks,
  links,
  rules,
  selectedEntitiesCount,
  onSelectTask,
  onLinkSelectedEntities,
  onUnlinkEntity,
  onAddRule,
  onRemoveRule,
  onToggleRuleActive,
  style,
}: TaskLinkingPanelProps) {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRuleType, setNewRuleType] = useState<'type_filter' | 'name_pattern'>(
    'type_filter'
  );
  const [rulePattern, setRulePattern] = useState('');
  const [ruleTypes, setRuleTypes] = useState('');

  const handleAddRule = () => {
    if (!selectedTask) return;

    const ruleConfig: any = {};

    if (newRuleType === 'name_pattern') {
      ruleConfig.pattern = rulePattern;
    } else if (newRuleType === 'type_filter') {
      ruleConfig.ifcTypes = ruleTypes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    onAddRule({
      taskId: selectedTask.taskId,
      ruleType: newRuleType,
      ruleConfig,
      isActive: true,
    });

    // Reset form
    setRulePattern('');
    setRuleTypes('');
    setShowRuleForm(false);
  };

  const flatTasks = React.useMemo(() => {
    const flatten = (tasks: ScheduleTask[]): ScheduleTask[] => {
      const result: ScheduleTask[] = [];
      tasks.forEach((task) => {
        result.push(task);
        if (task.children && task.children.length > 0) {
          result.push(...flatten(task.children));
        }
      });
      return result;
    };
    return flatten(tasks);
  }, [tasks]);

  return (
    <View style={[styles.container, style]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Task Linking</Text>
        </View>

        {/* Task Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Task</Text>
          <View style={styles.taskList}>
            {flatTasks.map((task) => (
              <TouchableOpacity
                key={task.taskId}
                style={[
                  styles.taskItem,
                  selectedTask?.taskId === task.taskId && styles.taskItemSelected,
                ]}
                onPress={() => onSelectTask(task.taskId)}
              >
                <Text
                  style={[
                    styles.taskItemText,
                    selectedTask?.taskId === task.taskId &&
                      styles.taskItemTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {'  '.repeat(task.outlineLevel - 1)}
                  {task.name}
                </Text>
                <Text
                  style={[
                    styles.taskItemDate,
                    selectedTask?.taskId === task.taskId &&
                      styles.taskItemTextSelected,
                  ]}
                >
                  {task.startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedTask && (
          <>
            {/* Manual Linking */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Manual Linking</Text>
              <Text style={styles.helpText}>
                Select entities in the 3D view, then click "Link Selected" to
                associate them with this task.
              </Text>
              <TouchableOpacity
                style={[
                  styles.linkButton,
                  selectedEntitiesCount === 0 && styles.linkButtonDisabled,
                ]}
                onPress={onLinkSelectedEntities}
                disabled={selectedEntitiesCount === 0}
              >
                <Text style={styles.linkButtonText}>
                  Link Selected ({selectedEntitiesCount})
                </Text>
              </TouchableOpacity>

              {/* Linked Entities List */}
              {links.length > 0 && (
                <View style={styles.linkedList}>
                  <Text style={styles.subTitle}>Linked Entities ({links.length})</Text>
                  {links.map((link) => (
                    <View key={link.id} style={styles.linkedItem}>
                      <View style={styles.linkedInfo}>
                        <Text style={styles.linkedType}>{link.entityType}</Text>
                        {link.entityName && (
                          <Text style={styles.linkedName}>{link.entityName}</Text>
                        )}
                        <Text style={styles.linkedId}>
                          ID: {link.entityExpressId}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.unlinkButton}
                        onPress={() => onUnlinkEntity(link.entityExpressId)}
                      >
                        <Text style={styles.unlinkButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Rule-Based Linking */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rule-Based Linking</Text>
              <Text style={styles.helpText}>
                Create rules to automatically link entities based on their
                properties.
              </Text>

              {!showRuleForm ? (
                <TouchableOpacity
                  style={styles.addRuleButton}
                  onPress={() => setShowRuleForm(true)}
                >
                  <Text style={styles.addRuleButtonText}>+ Add Rule</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.ruleForm}>
                  <Text style={styles.formLabel}>Rule Type:</Text>
                  <View style={styles.ruleTypeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.ruleTypeButton,
                        newRuleType === 'type_filter' &&
                          styles.ruleTypeButtonActive,
                      ]}
                      onPress={() => setNewRuleType('type_filter')}
                    >
                      <Text
                        style={[
                          styles.ruleTypeButtonText,
                          newRuleType === 'type_filter' &&
                            styles.ruleTypeButtonTextActive,
                        ]}
                      >
                        Type Filter
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.ruleTypeButton,
                        newRuleType === 'name_pattern' &&
                          styles.ruleTypeButtonActive,
                      ]}
                      onPress={() => setNewRuleType('name_pattern')}
                    >
                      <Text
                        style={[
                          styles.ruleTypeButtonText,
                          newRuleType === 'name_pattern' &&
                            styles.ruleTypeButtonTextActive,
                        ]}
                      >
                        Name Pattern
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {newRuleType === 'name_pattern' ? (
                    <>
                      <Text style={styles.formLabel}>Pattern (regex):</Text>
                      <TextInput
                        style={styles.input}
                        value={rulePattern}
                        onChangeText={setRulePattern}
                        placeholder="e.g., ^Wall.*"
                        placeholderTextColor="#64748b"
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.formLabel}>
                        IFC Types (comma-separated):
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={ruleTypes}
                        onChangeText={setRuleTypes}
                        placeholder="e.g., IfcWall, IfcColumn"
                        placeholderTextColor="#64748b"
                      />
                    </>
                  )}

                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowRuleForm(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleAddRule}
                    >
                      <Text style={styles.saveButtonText}>Add Rule</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Rules List */}
              {rules.length > 0 && (
                <View style={styles.rulesList}>
                  <Text style={styles.subTitle}>Active Rules ({rules.length})</Text>
                  {rules.map((rule) => (
                    <View key={rule.id} style={styles.ruleItem}>
                      <View style={styles.ruleInfo}>
                        <Text style={styles.ruleType}>
                          {rule.ruleType === 'type_filter'
                            ? 'Type Filter'
                            : 'Name Pattern'}
                        </Text>
                        <Text style={styles.ruleConfig}>
                          {rule.ruleType === 'type_filter'
                            ? rule.ruleConfig.ifcTypes?.join(', ')
                            : rule.ruleConfig.pattern}
                        </Text>
                        <Text
                          style={[
                            styles.ruleStatus,
                            rule.isActive
                              ? styles.ruleStatusActive
                              : styles.ruleStatusInactive,
                          ]}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeRuleButton}
                        onPress={() => onRemoveRule(rule.id)}
                      >
                        <Text style={styles.removeRuleButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {!selectedTask && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Select a task to start linking entities
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 18,
  },
  taskList: {
    maxHeight: 200,
  },
  taskItem: {
    padding: 10,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskItemSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  taskItemText: {
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 4,
  },
  taskItemTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  taskItemDate: {
    color: '#94a3b8',
    fontSize: 12,
  },
  linkButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  linkButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  linkButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  linkedList: {
    marginTop: 16,
  },
  linkedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    marginBottom: 4,
  },
  linkedInfo: {
    flex: 1,
  },
  linkedType: {
    color: '#64ffda',
    fontSize: 13,
    fontWeight: '600',
  },
  linkedName: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
  },
  linkedId: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  unlinkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlinkButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addRuleButton: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
    borderStyle: 'dashed',
  },
  addRuleButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  ruleForm: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  formLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
  },
  ruleTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ruleTypeButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#334155',
    borderRadius: 6,
    alignItems: 'center',
  },
  ruleTypeButtonActive: {
    backgroundColor: '#64ffda',
  },
  ruleTypeButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  ruleTypeButtonTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#334155',
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  rulesList: {
    marginTop: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    marginBottom: 4,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleType: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
  },
  ruleConfig: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
  },
  ruleStatus: {
    fontSize: 11,
    marginTop: 4,
  },
  ruleStatusActive: {
    color: '#10b981',
  },
  ruleStatusInactive: {
    color: '#64748b',
  },
  removeRuleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeRuleButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TaskLinkingPanel;
