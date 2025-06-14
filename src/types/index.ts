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

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license?: string;
  passportData?: string;
  experienceYears?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  capacity?: number;
  year?: number;
  vin?: string;
  registrationCertificate?: string;
  insurancePolicy?: string;
  insuranceExpiry?: Date;
  technicalInspectionExpiry?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CargoType {
  id:string;
  name: string;
  description?: string;
  defaultWeight?: number;
  defaultVolume?: number;
  hazardous?: boolean;
  temperatureControlled?: boolean;
  fragile?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Route {
  id: string;
  name: string;
  pointA: string;
  pointB: string;
  distanceKm?: number;
  estimatedDurationHours?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  status: TripStatus;
  departureDate: Date;
  arrivalDate?: Date;
  pointA: string;
  pointB: string;
  contractorId: string;
  driverId?: string;
  vehicleId?: string;
  routeId?: string;
  cargoTypeId?: string;
  driver: {
    name: string;
    phone: string;
    license?: string;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
    capacity?: number;
  };
  cargo: {
    description: string;
    weight: number;
    volume: number;
    value?: number;
  };
  comments?: string;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
  changeLog: ChangeLogEntry[];
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
  // role и permissions убраны, так как теперь мы используем хук usePermissions
  createdAt: Date;
}

// Устаревшие enums UserRole и Permission удалены

export enum AppPermission {
  VIEW_TRIPS = 'view_trips',
  EDIT_TRIPS = 'edit_trips',
  VIEW_CONTRACTORS = 'view_contractors',
  EDIT_CONTRACTORS = 'edit_contractors',
  VIEW_DRIVERS = 'view_drivers',
  EDIT_DRIVERS = 'edit_drivers',
  VIEW_VEHICLES = 'view_vehicles',
  EDIT_VEHICLES = 'edit_vehicles',
  VIEW_ROUTES = 'view_routes',
  EDIT_ROUTES = 'edit_routes',
  VIEW_CARGO_TYPES = 'view_cargo_types',
  EDIT_CARGO_TYPES = 'edit_cargo_types',
  VIEW_REPORTS = 'view_reports',
  VIEW_ADMIN_PANEL = 'view_admin_panel',
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

// Добавляем импорт типов расходов
export * from './expenses';
