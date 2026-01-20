/**
 * 4D Scheduling Type Definitions
 */

export interface ScheduleTask {
  id: string;
  taskId: string; // Original ID from MS Project
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  percentComplete: number;
  predecessors: string[];
  resources: string[];
  notes?: string;
  outlineLevel: number;
  outlineNumber?: string;
  children?: ScheduleTask[];
}

export interface MSProjectXML {
  project: {
    name: string;
    startDate: Date;
    finishDate: Date;
    tasks: ScheduleTask[];
  };
}

export interface TaskEntityLink {
  id: string;
  taskId: string;
  entityGlobalId: string;
  entityExpressId: number;
  entityType: string;
  entityName?: string;
  linkType: 'manual' | 'rule';
}

export interface LinkRule {
  id: string;
  taskId: string;
  ruleType: 'property_match' | 'name_pattern' | 'type_filter';
  ruleConfig: {
    propertyName?: string;
    propertyValue?: string;
    pattern?: string;
    ifcTypes?: string[];
  };
  isActive: boolean;
}

export interface TimelineState {
  currentDate: Date;
  startDate: Date;
  endDate: Date;
  isPlaying: boolean;
  playbackSpeed: number; // days per second
}
