
export interface Contractor {
  id: string;
  companyName: string;
  inn: string;
  address: string;
  contacts: Contact[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  position?: string;
}

export interface Trip {
  id: string;
  status: TripStatus;
  departureDate: Date;
  arrivalDate?: Date;
  pointA: string;
  pointB: string;
  contractorId: string;
  driver: Driver;
  vehicle: Vehicle;
  cargo: Cargo;
  comments?: string;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
  changeLog: ChangeLogEntry[];
}

export interface Driver {
  name: string;
  phone: string;
  license?: string;
}

export interface Vehicle {
  brand: string;
  model: string;
  licensePlate: string;
  capacity?: number;
}

export interface Cargo {
  description: string;
  weight: number;
  volume: number;
  value?: number;
}

export interface ChangeLogEntry {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  userId: string;
  timestamp: Date;
}

export enum TripStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
}

export enum UserRole {
  OWNER = 'owner',
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver'
}

export enum Permission {
  VIEW_TRIPS = 'view_trips',
  EDIT_TRIPS = 'edit_trips',
  VIEW_CONTRACTORS = 'view_contractors',
  EDIT_CONTRACTORS = 'edit_contractors',
  VIEW_FINANCES = 'view_finances',
  VIEW_STATISTICS = 'view_statistics',
  MANAGE_USERS = 'manage_users'
}

export interface NextCloudConfig {
  serverUrl: string;
  username: string;
  password: string;
  basePath: string;
}

export interface SyncStatus {
  lastSync: Date | null;
  pendingUploads: number;
  isOnline: boolean;
  syncInProgress: boolean;
}
