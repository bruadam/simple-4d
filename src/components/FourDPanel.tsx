/**
 * 4D Panel Component
 *
 * Main panel for 4D scheduling features
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GanttChart } from './GanttChart';
import { TimelineControls } from './TimelineControls';
import { TaskLinkingPanel } from './TaskLinkingPanel';
import type { ScheduleTask, TaskEntityLink, LinkRule, TimelineState } from '../types/schedule';

interface FourDPanelProps {
  tasks: ScheduleTask[];
  selectedTask: ScheduleTask | null;
  timelineState: TimelineState;
  taskLinks: Map<string, TaskEntityLink[]>;
  taskRules: Map<string, LinkRule[]>;
  selectedEntitiesCount: number;
  onSelectTask: (taskId: string) => void;
  onLinkSelectedEntities: () => void;
  onUnlinkEntity: (taskId: string, entityExpressId: number) => void;
  onAddRule: (rule: Omit<LinkRule, 'id'>) => void;
  onRemoveRule: (ruleId: string) => void;
  onToggleRuleActive: (ruleId: string, isActive: boolean) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onDateChange: (date: Date) => void;
  onSpeedChange: (speed: number) => void;
  onLoadMSProject: (file: File) => void;
  style?: object;
}

export function FourDPanel({
  tasks,
  selectedTask,
  timelineState,
  taskLinks,
  taskRules,
  selectedEntitiesCount,
  onSelectTask,
  onLinkSelectedEntities,
  onUnlinkEntity,
  onAddRule,
  onRemoveRule,
  onToggleRuleActive,
  onPlay,
  onPause,
  onReset,
  onDateChange,
  onSpeedChange,
  onLoadMSProject,
  style,
}: FourDPanelProps) {
  const [activeTab, setActiveTab] = useState<'gantt' | 'linking'>('gantt');

  const handleFileInput = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoadMSProject(file);
    }
  };

  const currentTaskLinks = selectedTask ? taskLinks.get(selectedTask.taskId) || [] : [];
  const currentTaskRules = selectedTask ? taskRules.get(selectedTask.taskId) || [] : [];

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>4D Scheduling</Text>

        {/* Load MS Project Button */}
        <label htmlFor="ms-project-upload" style={{ cursor: 'pointer' }}>
          <View style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Load MS Project XML</Text>
          </View>
          <input
            id="ms-project-upload"
            type="file"
            accept=".xml"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gantt' && styles.tabActive]}
          onPress={() => setActiveTab('gantt')}
        >
          <Text style={[styles.tabText, activeTab === 'gantt' && styles.tabTextActive]}>
            Gantt Chart
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'linking' && styles.tabActive]}
          onPress={() => setActiveTab('linking')}
        >
          <Text style={[styles.tabText, activeTab === 'linking' && styles.tabTextActive]}>
            Task Linking
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'gantt' ? (
          <View style={styles.ganttContainer}>
            {tasks.length > 0 ? (
              <>
                <GanttChart
                  tasks={tasks}
                  currentDate={timelineState.currentDate}
                  onTaskSelect={onSelectTask}
                  style={styles.gantt}
                />
                <TimelineControls
                  timelineState={timelineState}
                  onPlay={onPlay}
                  onPause={onPause}
                  onReset={onReset}
                  onDateChange={onDateChange}
                  onSpeedChange={onSpeedChange}
                  style={styles.timelineControls}
                />
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No schedule loaded. Load an MS Project XML file to get started.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <TaskLinkingPanel
            selectedTask={selectedTask}
            tasks={tasks}
            links={currentTaskLinks}
            rules={currentTaskRules}
            selectedEntitiesCount={selectedEntitiesCount}
            onSelectTask={onSelectTask}
            onLinkSelectedEntities={onLinkSelectedEntities}
            onUnlinkEntity={(entityExpressId) => {
              if (selectedTask) {
                onUnlinkEntity(selectedTask.taskId, entityExpressId);
              }
            }}
            onAddRule={onAddRule}
            onRemoveRule={onRemoveRule}
            onToggleRuleActive={onToggleRuleActive}
          />
        )}
      </View>

      {/* Stats Bar */}
      {tasks.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            Tasks: {tasks.length}
          </Text>
          <Text style={styles.statsSeparator}>•</Text>
          <Text style={styles.statsText}>
            Linked: {Array.from(taskLinks.values()).reduce((sum, links) => sum + links.length, 0)}
          </Text>
          <Text style={styles.statsSeparator}>•</Text>
          <Text style={styles.statsText}>
            Rules: {Array.from(taskRules.values()).reduce((sum, rules) => sum + rules.length, 0)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#64ffda',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#64ffda',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  ganttContainer: {
    flex: 1,
  },
  gantt: {
    flex: 1,
  },
  timelineControls: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statsText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  statsSeparator: {
    color: '#475569',
    marginHorizontal: 12,
  },
});

export default FourDPanel;
