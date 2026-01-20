import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';

export interface BIMWorld {
  components: OBC.Components;
  world: OBC.World;
  fragments: OBC.FragmentsManager;
}

export interface SelectionEvent {
  modelId: string;
  localIds: Set<number>;
}

export interface PropertyData {
  name: string;
  value: string | number | boolean;
  localId: number;
  editable: boolean;
}

export interface PropertyGroup {
  name: string;
  localId: number;
  properties: PropertyData[];
  children?: PropertyGroup[];
}

export interface TableRowData {
  Name: string;
  Value?: string | number | boolean;
  LocalId: number;
  ParentLocalId?: number;
  ParentName?: string;
  Type?: 'relation' | 'related' | 'attribute';
}

export interface TableNode {
  data: TableRowData;
  children?: TableNode[];
}

export interface AttributeType {
  name: string;
  type: string;
  value: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  loaded: boolean;
}
