/**
 * Gantt Chart Component
 *
 * Displays project schedule using jsGantt-improved
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { ScheduleTask } from '../types/schedule';

// jsgantt-improved types
declare global {
  interface Window {
    JSGantt?: any;
  }
}

interface GanttChartProps {
  tasks: ScheduleTask[];
  currentDate?: Date;
  onTaskSelect?: (taskId: string) => void;
  style?: object;
}

export function GanttChart({
  tasks,
  currentDate,
  onTaskSelect,
  style,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load jsGantt script if not already loaded
    if (!window.JSGantt) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsgantt-improved@2.7.0/dist/jsgantt.min.js';
      script.async = true;
      script.onload = () => initializeGantt();
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/jsgantt-improved@2.7.0/dist/jsgantt.css';
      document.head.appendChild(link);
    } else {
      initializeGantt();
    }

    return () => {
      // Cleanup
      if (ganttRef.current) {
        ganttRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (ganttRef.current && tasks.length > 0) {
      updateGanttTasks();
    }
  }, [tasks]);

  useEffect(() => {
    if (ganttRef.current && currentDate) {
      updateCurrentDateMarker();
    }
  }, [currentDate]);

  const initializeGantt = () => {
    if (!window.JSGantt || !containerRef.current) return;

    const { JSGantt } = window;

    // Create Gantt chart
    const g = new JSGantt.GanttChart(containerRef.current, 'day');

    // Configure chart
    g.setOptions({
      vCaptionType: 'Complete',
      vQuarterColWidth: 36,
      vDateTaskDisplayFormat: 'day dd month yyyy',
      vDayMajorDateDisplayFormat: 'mon yyyy',
      vWeekMinorDateDisplayFormat: 'dd mon',
      vShowTaskInfoLink: 1,
      vShowEndWeekDate: 0,
      vUseSingleCell: 10000,
      vFormatArr: ['Day', 'Week', 'Month', 'Quarter'],
      vShowRes: 1,
      vShowComp: 1,
      vShowDur: 1,
      vShowStartDate: 1,
      vShowEndDate: 1,
      vAdditionalHeaders: {},
      vEvents: {
        taskname: (task: any) => {
          if (onTaskSelect) {
            onTaskSelect(task.getOriginalID());
          }
        },
      },
    });

    ganttRef.current = g;

    if (tasks.length > 0) {
      updateGanttTasks();
    }
  };

  const updateGanttTasks = () => {
    if (!ganttRef.current || !window.JSGantt) return;

    const g = ganttRef.current;
    const { JSGantt } = window;

    // Clear existing tasks
    g.clearTasks();

    // Add tasks recursively
    const addTask = (task: ScheduleTask, parentId: string | null = null) => {
      // Format dates
      const startDate = formatDate(task.startDate);
      const endDate = formatDate(task.endDate);

      // Determine if task is a group
      const isGroup = task.children && task.children.length > 0 ? 1 : 0;

      // Get predecessors
      const dependencies = task.predecessors.join(',');

      // Add task to gantt
      g.AddTaskItem(new JSGantt.TaskItem(
        task.taskId,
        task.name,
        startDate,
        endDate,
        'gtaskblue',
        '',
        task.percentComplete,
        task.resources.join(', '),
        parentId || 0,
        isGroup,
        dependencies,
        '',
        ''
      ));

      // Add children
      if (task.children && task.children.length > 0) {
        task.children.forEach((child) => addTask(child, task.taskId));
      }
    };

    // Add all tasks
    tasks.forEach((task) => addTask(task));

    // Draw chart
    g.Draw();
  };

  const updateCurrentDateMarker = () => {
    if (!currentDate || !ganttRef.current) return;

    // jsGantt doesn't have built-in current date marker
    // We could implement a custom overlay here
    // For now, we'll just redraw the chart
    ganttRef.current.Draw();
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  };

  return (
    <View style={[styles.container, style]}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          backgroundColor: '#ffffff',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default GanttChart;
