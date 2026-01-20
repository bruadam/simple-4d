/**
 * MS Project XML Parser Module
 *
 * Parses Microsoft Project XML files and extracts task information
 */

import { XMLParser } from 'fast-xml-parser';
import type { ScheduleTask, MSProjectXML } from '../../types/schedule';

export class MSProjectParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });
  }

  /**
   * Parse MS Project XML from string
   */
  async parseXML(xmlContent: string): Promise<MSProjectXML> {
    try {
      const result = this.parser.parse(xmlContent);

      if (!result.Project) {
        throw new Error('Invalid MS Project XML: Missing Project element');
      }

      const project = result.Project;
      const projectName = project.Name || 'Untitled Project';
      const startDate = this.parseDate(project.StartDate);
      const finishDate = this.parseDate(project.FinishDate);

      // Parse tasks
      const tasks = this.parseTasks(project.Tasks?.Task);

      return {
        project: {
          name: projectName,
          startDate,
          finishDate,
          tasks,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to parse MS Project XML: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse MS Project XML from file
   */
  async parseFile(file: File): Promise<MSProjectXML> {
    const content = await this.readFileAsText(file);
    return this.parseXML(content);
  }

  /**
   * Parse tasks from XML structure
   */
  private parseTasks(tasksData: any): ScheduleTask[] {
    if (!tasksData) {
      return [];
    }

    // Handle both single task and array of tasks
    const taskArray = Array.isArray(tasksData) ? tasksData : [tasksData];

    const tasks: ScheduleTask[] = [];
    const taskMap = new Map<string, ScheduleTask>();

    // First pass: create all tasks
    for (const taskData of taskArray) {
      if (!taskData.UID) continue;

      const task: ScheduleTask = {
        id: `task_${taskData.UID}`,
        taskId: String(taskData.UID),
        name: taskData.Name || 'Unnamed Task',
        startDate: this.parseDate(taskData.Start),
        endDate: this.parseDate(taskData.Finish),
        duration: this.parseDuration(taskData.Duration),
        percentComplete: parseFloat(taskData.PercentComplete || 0),
        predecessors: this.parsePredecessors(taskData.PredecessorLink),
        resources: this.parseResources(taskData.Assignments),
        notes: taskData.Notes || undefined,
        outlineLevel: parseInt(taskData.OutlineLevel || 1, 10),
        outlineNumber: taskData.OutlineNumber || undefined,
        children: [],
      };

      tasks.push(task);
      taskMap.set(task.taskId, task);
    }

    // Second pass: build hierarchy
    const rootTasks: ScheduleTask[] = [];

    for (const task of tasks) {
      // Find parent based on outline structure
      const parent = this.findParentTask(task, tasks);

      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(task);
      } else {
        rootTasks.push(task);
      }
    }

    return rootTasks;
  }

  /**
   * Find parent task based on outline level and number
   */
  private findParentTask(task: ScheduleTask, allTasks: ScheduleTask[]): ScheduleTask | null {
    if (task.outlineLevel <= 1) {
      return null; // Root level task
    }

    // Find the task with outline level one less and matching outline number prefix
    for (const potentialParent of allTasks) {
      if (
        potentialParent.outlineLevel === task.outlineLevel - 1 &&
        task.outlineNumber &&
        potentialParent.outlineNumber &&
        task.outlineNumber.startsWith(potentialParent.outlineNumber + '.')
      ) {
        return potentialParent;
      }
    }

    return null;
  }

  /**
   * Parse date from MS Project format
   */
  private parseDate(dateString: string): Date {
    if (!dateString) {
      return new Date();
    }

    // MS Project uses ISO 8601 format
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      return new Date();
    }

    return date;
  }

  /**
   * Parse duration (in MS Project format PT###H###M###S)
   */
  private parseDuration(durationString: string): number {
    if (!durationString) {
      return 0;
    }

    // MS Project duration format: PT###H###M###S or simple hours
    // Convert to days (assuming 8-hour workday)

    if (durationString.startsWith('PT')) {
      // Parse ISO 8601 duration
      const hours = this.extractNumber(durationString, 'H');
      const minutes = this.extractNumber(durationString, 'M');
      const totalHours = hours + minutes / 60;
      return totalHours / 8; // Convert to days
    }

    // Fallback: try parsing as number
    const num = parseFloat(durationString);
    return isNaN(num) ? 0 : num / 8;
  }

  /**
   * Extract number before a specific character
   */
  private extractNumber(str: string, marker: string): number {
    const regex = new RegExp(`(\\d+(?:\\.\\d+)?)${marker}`);
    const match = str.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Parse predecessor links
   */
  private parsePredecessors(predecessorData: any): string[] {
    if (!predecessorData) {
      return [];
    }

    const predecessorArray = Array.isArray(predecessorData)
      ? predecessorData
      : [predecessorData];

    return predecessorArray
      .map((pred) => String(pred.PredecessorUID))
      .filter(Boolean);
  }

  /**
   * Parse resource assignments
   */
  private parseResources(assignmentsData: any): string[] {
    if (!assignmentsData || !assignmentsData.Assignment) {
      return [];
    }

    const assignmentArray = Array.isArray(assignmentsData.Assignment)
      ? assignmentsData.Assignment
      : [assignmentsData.Assignment];

    return assignmentArray
      .map((assignment: any) => assignment.ResourceUID)
      .filter(Boolean)
      .map(String);
  }

  /**
   * Read file content as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Flatten task hierarchy for easier processing
   */
  static flattenTasks(tasks: ScheduleTask[]): ScheduleTask[] {
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
}

export default MSProjectParser;
