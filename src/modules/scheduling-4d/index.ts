/**
 * 4D Scheduling Module
 *
 * Manages scheduling, task-entity links, and 4D visualization
 */

import { BIMCore } from '../bim-core';
import type {
  ScheduleTask,
  TaskEntityLink,
  LinkRule,
  TimelineState,
} from '../../types/schedule';
import * as THREE from 'three';

export interface EntityInfo {
  globalId: string;
  expressId: number;
  type: string;
  name?: string;
}

export class Scheduling4DModule {
  private tasks: ScheduleTask[] = [];
  private taskMap: Map<string, ScheduleTask> = new Map();
  private entityLinks: Map<string, TaskEntityLink[]> = new Map(); // taskId -> links
  private linkRules: Map<string, LinkRule[]> = new Map(); // taskId -> rules
  private timelineState: TimelineState;
  private animationFrameId: number | null = null;

  // Callbacks
  public onTasksLoaded?: (tasks: ScheduleTask[]) => void;
  public onTimelineStateChanged?: (state: TimelineState) => void;
  public onLinksUpdated?: (taskId: string, links: TaskEntityLink[]) => void;

  constructor() {
    const now = new Date();
    this.timelineState = {
      currentDate: now,
      startDate: now,
      endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // +90 days
      isPlaying: false,
      playbackSpeed: 1, // 1 day per second
    };
  }

  /**
   * Load tasks from parsed MS Project data
   */
  loadTasks(tasks: ScheduleTask[]): void {
    this.tasks = tasks;
    this.taskMap.clear();

    // Build task map
    const flatTasks = this.flattenTasks(tasks);
    flatTasks.forEach((task) => {
      this.taskMap.set(task.taskId, task);
    });

    // Calculate project timeline
    this.calculateProjectTimeline();

    this.onTasksLoaded?.(tasks);
  }

  /**
   * Get all tasks
   */
  getTasks(): ScheduleTask[] {
    return this.tasks;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): ScheduleTask | undefined {
    return this.taskMap.get(taskId);
  }

  /**
   * Get all flat tasks
   */
  getFlatTasks(): ScheduleTask[] {
    return this.flattenTasks(this.tasks);
  }

  /**
   * Flatten task hierarchy
   */
  private flattenTasks(tasks: ScheduleTask[]): ScheduleTask[] {
    const result: ScheduleTask[] = [];

    function traverse(task: ScheduleTask) {
      result.push(task);
      if (task.children && task.children.length > 0) {
        task.children.forEach(traverse);
      }
    }

    tasks.forEach(traverse);
    return result;
  }

  /**
   * Calculate project start and end dates
   */
  private calculateProjectTimeline(): void {
    const flatTasks = this.getFlatTasks();

    if (flatTasks.length === 0) {
      return;
    }

    let minDate = flatTasks[0].startDate;
    let maxDate = flatTasks[0].endDate;

    for (const task of flatTasks) {
      if (task.startDate < minDate) {
        minDate = task.startDate;
      }
      if (task.endDate > maxDate) {
        maxDate = task.endDate;
      }
    }

    this.timelineState.startDate = minDate;
    this.timelineState.endDate = maxDate;
    this.timelineState.currentDate = minDate;

    this.onTimelineStateChanged?.(this.timelineState);
  }

  /**
   * Link IFC entity to task (manual selection)
   */
  linkEntityToTask(taskId: string, entity: EntityInfo): void {
    const link: TaskEntityLink = {
      id: `link_${taskId}_${entity.expressId}_${Date.now()}`,
      taskId,
      entityGlobalId: entity.globalId,
      entityExpressId: entity.expressId,
      entityType: entity.type,
      entityName: entity.name,
      linkType: 'manual',
    };

    if (!this.entityLinks.has(taskId)) {
      this.entityLinks.set(taskId, []);
    }

    const links = this.entityLinks.get(taskId)!;

    // Check if already linked
    const exists = links.some(
      (l) => l.entityExpressId === entity.expressId
    );

    if (!exists) {
      links.push(link);
      this.onLinksUpdated?.(taskId, links);
    }
  }

  /**
   * Unlink entity from task
   */
  unlinkEntityFromTask(taskId: string, entityExpressId: number): void {
    const links = this.entityLinks.get(taskId);
    if (!links) return;

    const filtered = links.filter(
      (link) => link.entityExpressId !== entityExpressId
    );

    this.entityLinks.set(taskId, filtered);
    this.onLinksUpdated?.(taskId, filtered);
  }

  /**
   * Get links for a task
   */
  getTaskLinks(taskId: string): TaskEntityLink[] {
    return this.entityLinks.get(taskId) || [];
  }

  /**
   * Get all entity links
   */
  getAllLinks(): Map<string, TaskEntityLink[]> {
    return this.entityLinks;
  }

  /**
   * Add linking rule
   */
  addLinkRule(rule: LinkRule): void {
    if (!this.linkRules.has(rule.taskId)) {
      this.linkRules.set(rule.taskId, []);
    }

    this.linkRules.get(rule.taskId)!.push(rule);
  }

  /**
   * Remove linking rule
   */
  removeLinkRule(ruleId: string): void {
    for (const [taskId, rules] of this.linkRules.entries()) {
      const filtered = rules.filter((r) => r.id !== ruleId);
      this.linkRules.set(taskId, filtered);
    }
  }

  /**
   * Get rules for a task
   */
  getTaskRules(taskId: string): LinkRule[] {
    return this.linkRules.get(taskId) || [];
  }

  /**
   * Apply rules to link entities automatically
   */
  applyRulesToEntities(taskId: string, entities: EntityInfo[]): void {
    const rules = this.getTaskRules(taskId);

    for (const rule of rules) {
      if (!rule.isActive) continue;

      for (const entity of entities) {
        if (this.doesEntityMatchRule(entity, rule)) {
          this.linkEntityToTask(taskId, entity);
        }
      }
    }
  }

  /**
   * Check if entity matches a rule
   */
  private doesEntityMatchRule(entity: EntityInfo, rule: LinkRule): boolean {
    switch (rule.ruleType) {
      case 'type_filter':
        return (
          rule.ruleConfig.ifcTypes?.includes(entity.type) ?? false
        );

      case 'name_pattern':
        if (!entity.name || !rule.ruleConfig.pattern) {
          return false;
        }
        try {
          const regex = new RegExp(rule.ruleConfig.pattern, 'i');
          return regex.test(entity.name);
        } catch {
          return false;
        }

      case 'property_match':
        // Property matching would require accessing IFC properties
        // This is a simplified version
        return false;

      default:
        return false;
    }
  }

  /**
   * Get timeline state
   */
  getTimelineState(): TimelineState {
    return { ...this.timelineState };
  }

  /**
   * Set current date
   */
  setCurrentDate(date: Date): void {
    this.timelineState.currentDate = date;
    this.updateVisualization();
    this.onTimelineStateChanged?.(this.timelineState);
  }

  /**
   * Set playback speed (days per second)
   */
  setPlaybackSpeed(speed: number): void {
    this.timelineState.playbackSpeed = speed;
    this.onTimelineStateChanged?.(this.timelineState);
  }

  /**
   * Start timeline playback
   */
  play(): void {
    if (this.timelineState.isPlaying) return;

    this.timelineState.isPlaying = true;
    this.onTimelineStateChanged?.(this.timelineState);
    this.startAnimation();
  }

  /**
   * Pause timeline playback
   */
  pause(): void {
    this.timelineState.isPlaying = false;
    this.onTimelineStateChanged?.(this.timelineState);
    this.stopAnimation();
  }

  /**
   * Reset timeline to start
   */
  reset(): void {
    this.timelineState.currentDate = new Date(this.timelineState.startDate);
    this.timelineState.isPlaying = false;
    this.stopAnimation();
    this.updateVisualization();
    this.onTimelineStateChanged?.(this.timelineState);
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    let lastTime = Date.now();

    const animate = () => {
      if (!this.timelineState.isPlaying) {
        return;
      }

      const now = Date.now();
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      // Advance current date
      const daysToAdd = deltaSeconds * this.timelineState.playbackSpeed;
      const newDate = new Date(
        this.timelineState.currentDate.getTime() +
          daysToAdd * 24 * 60 * 60 * 1000
      );

      if (newDate > this.timelineState.endDate) {
        this.pause();
        this.timelineState.currentDate = new Date(this.timelineState.endDate);
      } else {
        this.timelineState.currentDate = newDate;
      }

      this.updateVisualization();
      this.onTimelineStateChanged?.(this.timelineState);

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Update 3D visualization based on current date
   */
  private updateVisualization(): void {
    const bimCore = BIMCore.getInstance();
    if (!bimCore.world) return;

    const currentDate = this.timelineState.currentDate;

    // For each task, determine if it should be visible
    for (const [taskId, links] of this.entityLinks.entries()) {
      const task = this.taskMap.get(taskId);
      if (!task) continue;

      // Determine task status
      const isStarted = currentDate >= task.startDate;
      const isCompleted = currentDate >= task.endDate;

      // Calculate visibility and color
      let visible = true;
      let opacity = 1.0;
      let color = new THREE.Color(0xffffff);

      if (!isStarted) {
        // Not started yet - make semi-transparent or hidden
        opacity = 0.2;
        color = new THREE.Color(0x888888); // Gray
      } else if (isCompleted) {
        // Completed - full opacity, green tint
        opacity = 1.0;
        color = new THREE.Color(0x88ff88); // Light green
      } else {
        // In progress - full opacity, yellow tint
        opacity = 1.0;
        color = new THREE.Color(0xffff88); // Light yellow
      }

      // Apply to all linked entities
      this.applyVisualizationToEntities(links, visible, opacity, color);
    }
  }

  /**
   * Apply visualization settings to entities
   */
  private applyVisualizationToEntities(
    links: TaskEntityLink[],
    visible: boolean,
    opacity: number,
    color: THREE.Color
  ): void {
    const bimCore = BIMCore.getInstance();
    if (!bimCore.world) return;

    // This is a simplified version
    // In a real implementation, you would:
    // 1. Get the fragment/mesh for each entity
    // 2. Update its material properties
    // 3. Set visibility, opacity, and color

    // For now, we'll just log the changes
    // The actual implementation would require accessing the fragments manager
    // and updating materials for specific express IDs
  }

  /**
   * Get tasks active on a specific date
   */
  getActiveTasksOnDate(date: Date): ScheduleTask[] {
    const flatTasks = this.getFlatTasks();
    return flatTasks.filter(
      (task) => date >= task.startDate && date <= task.endDate
    );
  }

  /**
   * Dispose module
   */
  dispose(): void {
    this.stopAnimation();
    this.tasks = [];
    this.taskMap.clear();
    this.entityLinks.clear();
    this.linkRules.clear();
  }
}

export default Scheduling4DModule;
