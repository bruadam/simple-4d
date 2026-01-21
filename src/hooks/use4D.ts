/**
 * Custom React hook for 4D functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MSProjectParser } from '../modules/msproject-parser';
import { Scheduling4DModule, type EntityInfo } from '../modules/scheduling-4d';
import type { ScheduleTask, TaskEntityLink, LinkRule, TimelineState } from '../types/schedule';
import { databaseService } from '../services/database.service';

export interface Use4DReturn {
  // Schedule state
  tasks: ScheduleTask[];
  selectedTask: ScheduleTask | null;
  timelineState: TimelineState;

  // Linking state
  taskLinks: Map<string, TaskEntityLink[]>;
  taskRules: Map<string, LinkRule[]>;

  // Actions
  loadMSProjectFile: (file: File) => Promise<void>;
  loadMSProjectXML: (xmlContent: string) => Promise<void>;
  selectTask: (taskId: string) => void;
  linkEntitiesToTask: (taskId: string, entities: EntityInfo[]) => void;
  unlinkEntityFromTask: (taskId: string, entityExpressId: number) => void;
  addLinkRule: (rule: Omit<LinkRule, 'id'>) => void;
  removeLinkRule: (ruleId: string) => void;
  applyRulesToEntities: (taskId: string, entities: EntityInfo[]) => void;

  // Timeline controls
  playTimeline: () => void;
  pauseTimeline: () => void;
  resetTimeline: () => void;
  setCurrentDate: (date: Date) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Persistence
  saveToDatabase: (projectId: string, ifcModelId: string) => Promise<void>;
  loadFromDatabase: (projectId: string) => Promise<void>;

  // Loading state
  isLoading: boolean;
  error: string | null;
}

export function use4D(): Use4DReturn {
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ScheduleTask | null>(null);
  const [timelineState, setTimelineState] = useState<TimelineState>({
    currentDate: new Date(),
    startDate: new Date(),
    endDate: new Date(),
    isPlaying: false,
    playbackSpeed: 1,
  });
  const [taskLinks, setTaskLinks] = useState<Map<string, TaskEntityLink[]>>(new Map());
  const [taskRules, setTaskRules] = useState<Map<string, LinkRule[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parserRef = useRef<MSProjectParser>(new MSProjectParser());
  const schedulingRef = useRef<Scheduling4DModule>(new Scheduling4DModule());

  // Setup callbacks
  useEffect(() => {
    const scheduling = schedulingRef.current;

    scheduling.onTasksLoaded = (loadedTasks) => {
      setTasks(loadedTasks);
    };

    scheduling.onTimelineStateChanged = (state) => {
      setTimelineState(state);
    };

    scheduling.onLinksUpdated = (taskId, links) => {
      setTaskLinks((prev) => {
        const updated = new Map(prev);
        updated.set(taskId, links);
        return updated;
      });
    };

    return () => {
      scheduling.dispose();
    };
  }, []);

  /**
   * Load MS Project file
   */
  const loadMSProjectFile = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = await parserRef.current.parseFile(file);
      schedulingRef.current.loadTasks(parsed.project.tasks);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load MS Project file';
      setError(errorMsg);
      console.error('Error loading MS Project file:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load MS Project XML from string
   */
  const loadMSProjectXML = useCallback(async (xmlContent: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = await parserRef.current.parseXML(xmlContent);
      schedulingRef.current.loadTasks(parsed.project.tasks);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load MS Project XML';
      setError(errorMsg);
      console.error('Error loading MS Project XML:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Select a task
   */
  const selectTask = useCallback((taskId: string) => {
    const task = schedulingRef.current.getTask(taskId);
    setSelectedTask(task || null);
  }, []);

  /**
   * Link entities to task
   */
  const linkEntitiesToTask = useCallback((taskId: string, entities: EntityInfo[]) => {
    entities.forEach((entity) => {
      schedulingRef.current.linkEntityToTask(taskId, entity);
    });
  }, []);

  /**
   * Unlink entity from task
   */
  const unlinkEntityFromTask = useCallback((taskId: string, entityExpressId: number) => {
    schedulingRef.current.unlinkEntityFromTask(taskId, entityExpressId);
  }, []);

  /**
   * Add linking rule
   */
  const addLinkRule = useCallback((rule: Omit<LinkRule, 'id'>) => {
    const fullRule: LinkRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    schedulingRef.current.addLinkRule(fullRule);

    // Update local state
    setTaskRules((prev) => {
      const updated = new Map(prev);
      const rules = updated.get(rule.taskId) || [];
      updated.set(rule.taskId, [...rules, fullRule]);
      return updated;
    });
  }, []);

  /**
   * Remove linking rule
   */
  const removeLinkRule = useCallback((ruleId: string) => {
    schedulingRef.current.removeLinkRule(ruleId);

    // Update local state
    setTaskRules((prev) => {
      const updated = new Map(prev);
      for (const [taskId, rules] of updated.entries()) {
        updated.set(
          taskId,
          rules.filter((r) => r.id !== ruleId)
        );
      }
      return updated;
    });
  }, []);

  /**
   * Apply rules to entities
   */
  const applyRulesToEntities = useCallback((taskId: string, entities: EntityInfo[]) => {
    schedulingRef.current.applyRulesToEntities(taskId, entities);
  }, []);

  /**
   * Play timeline
   */
  const playTimeline = useCallback(() => {
    schedulingRef.current.play();
  }, []);

  /**
   * Pause timeline
   */
  const pauseTimeline = useCallback(() => {
    schedulingRef.current.pause();
  }, []);

  /**
   * Reset timeline
   */
  const resetTimeline = useCallback(() => {
    schedulingRef.current.reset();
  }, []);

  /**
   * Set current date
   */
  const setCurrentDate = useCallback((date: Date) => {
    schedulingRef.current.setCurrentDate(date);
  }, []);

  /**
   * Set playback speed
   */
  const setPlaybackSpeed = useCallback((speed: number) => {
    schedulingRef.current.setPlaybackSpeed(speed);
  }, []);

  /**
   * Save to database
   */
  const saveToDatabase = useCallback(
    async (projectId: string, ifcModelId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Save tasks
        await databaseService.saveTasks(projectId, tasks);

        // Save links
        const allLinks: TaskEntityLink[] = [];
        for (const links of taskLinks.values()) {
          allLinks.push(...links);
        }
        if (allLinks.length > 0) {
          await databaseService.saveTaskLinks(projectId, ifcModelId, allLinks);
        }

        // Save rules
        const allRules: LinkRule[] = [];
        for (const rules of taskRules.values()) {
          allRules.push(...rules);
        }
        if (allRules.length > 0) {
          await databaseService.saveLinkRules(projectId, allRules);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to save to database';
        setError(errorMsg);
        console.error('Error saving to database:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [tasks, taskLinks, taskRules]
  );

  /**
   * Load from database
   */
  const loadFromDatabase = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Load tasks
      const { tasks: loadedTasks, error: tasksError } = await databaseService.getTasks(
        projectId
      );
      if (tasksError) {
        throw tasksError;
      }

      schedulingRef.current.loadTasks(loadedTasks);

      // Load links
      const { links: loadedLinks, error: linksError } = await databaseService.getTaskLinks(
        projectId
      );
      if (linksError) {
        throw linksError;
      }

      // Group links by task
      const linksByTask = new Map<string, TaskEntityLink[]>();
      loadedLinks.forEach((link) => {
        const existing = linksByTask.get(link.taskId) || [];
        linksByTask.set(link.taskId, [...existing, link]);
      });
      setTaskLinks(linksByTask);

      // Load rules
      const { rules: loadedRules, error: rulesError } = await databaseService.getLinkRules(
        projectId
      );
      if (rulesError) {
        throw rulesError;
      }

      // Group rules by task
      const rulesByTask = new Map<string, LinkRule[]>();
      loadedRules.forEach((rule) => {
        const existing = rulesByTask.get(rule.taskId) || [];
        rulesByTask.set(rule.taskId, [...existing, rule]);

        // Add to scheduling module
        schedulingRef.current.addLinkRule(rule);
      });
      setTaskRules(rulesByTask);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load from database';
      setError(errorMsg);
      console.error('Error loading from database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tasks,
    selectedTask,
    timelineState,
    taskLinks,
    taskRules,
    loadMSProjectFile,
    loadMSProjectXML,
    selectTask,
    linkEntitiesToTask,
    unlinkEntityFromTask,
    addLinkRule,
    removeLinkRule,
    applyRulesToEntities,
    playTimeline,
    pauseTimeline,
    resetTimeline,
    setCurrentDate,
    setPlaybackSpeed,
    saveToDatabase,
    loadFromDatabase,
    isLoading,
    error,
  };
}

export default use4D;
