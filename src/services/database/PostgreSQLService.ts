import postgres from 'postgres';
import type {
  DatabaseProvider,
  AuthUser,
} from './DatabaseProvider';
import type {
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  AuthResponse,
} from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';

import type { Contractor, Driver, Vehicle, Route, CargoType, Trip } from '@/types';
import type { TripExpense } from '@/types/expenses';

interface PostgreSQLConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean | object;
}

export class PostgreSQLService implements DatabaseProvider {
  private sql: postgres.Sql | null = null;
  private config: PostgreSQLConfig | null = null;

  constructor(config?: PostgreSQLConfig) {
    if (config) {
      this.initialize(config);
    }
  }

  public initialize(config: PostgreSQLConfig): void {
    this.config = config;
    if (config.host && config.port && config.database && config.username && config.password) {
      this.sql = postgres({
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        ssl: config.ssl,
      });
      console.log('PostgreSQLService initialized with new config');
    } else {
      console.warn('PostgreSQLService: Incomplete configuration provided. Connection not established.');
      this.sql = null;
    }
  }

  private ensureConnected(): postgres.Sql {
    if (!this.sql) {
      throw new Error('PostgreSQLService: Not connected. Please provide configuration and initialize.');
    }
    return this.sql;
  }

  // --- Auth Methods ---
  async signIn(credentials: SignInWithPasswordCredentials): Promise<AuthResponse> {
    console.warn('PostgreSQLService: Direct DB sign-in is not implemented/recommended for security reasons.');
    const error = new AuthError('Direct database sign-in is not supported by PostgreSQLService.');
    error.status = 501; // Not Implemented
    return { data: { user: null, session: null }, error };
  }

  async signUp(credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> {
    console.warn('PostgreSQLService: Direct DB sign-up is not implemented/recommended for security reasons.');
    const error = new AuthError('Direct database sign-up is not supported by PostgreSQLService.');
    error.status = 501; // Not Implemented
    return { data: { user: null, session: null }, error };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    console.warn('PostgreSQLService: getCurrentUser is not directly applicable here without a proper auth backend.');
    return null;
  }

  async signOut(): Promise<void> {
    console.warn('PostgreSQLService: signOut is not directly applicable here without a proper auth backend.');
    return Promise.resolve();
  }

  // --- Contractors ---
  async getContractors(): Promise<Contractor[]> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Fetching contractors...');
    try {
      // Предполагается, что таблица называется "contractors" и имеет соответствующие колонки.
      // Обратите внимание на кавычки для имен колонок, если они содержат заглавные буквы или спецсимволы.
      const contractors = await sql<Contractor[]>`
        SELECT id, "companyName", inn, address, "createdAt", "updatedAt" 
        FROM contractors
        ORDER BY "companyName" ASC
      `;
      console.log(`PostgreSQLService: Fetched ${contractors.length} contractors.`);
      return contractors;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching contractors:', error);
      throw new Error(`Failed to fetch contractors: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveContractor(contractor: Partial<Contractor> & { companyName: string; inn: string; address: string; }): Promise<Contractor> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Saving contractor:', contractor.id ? 'update' : 'insert', contractor);
    try {
      if (contractor.id) {
        // Обновление существующего контрагента
        const [updatedContractor] = await sql<Contractor[]>`
          UPDATE contractors
          SET "companyName" = ${contractor.companyName}, 
              inn = ${contractor.inn}, 
              address = ${contractor.address}, 
              "updatedAt" = NOW()
          WHERE id = ${contractor.id}
          RETURNING id, "companyName", inn, address, "createdAt", "updatedAt"
        `;
        if (!updatedContractor) throw new Error('Contractor not found for update or update failed.');
        console.log('PostgreSQLService: Contractor updated:', updatedContractor);
        return updatedContractor;
      } else {
        // Создание нового контрагента
        const [newContractor] = await sql<Contractor[]>`
          INSERT INTO contractors ("companyName", inn, address, "createdAt", "updatedAt")
          VALUES (${contractor.companyName}, ${contractor.inn}, ${contractor.address}, NOW(), NOW())
          RETURNING id, "companyName", inn, address, "createdAt", "updatedAt"
        `;
        console.log('PostgreSQLService: Contractor created:', newContractor);
        return newContractor;
      }
    } catch (error) {
      console.error('PostgreSQLService: Error saving contractor:', error);
      throw new Error(`Failed to save contractor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteContractor(id: string): Promise<void> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Deleting contractor with id:', id);
    try {
      const result = await sql`
        DELETE FROM contractors 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Contractor not found for deletion or delete failed.');
        // Можно выбросить ошибку, если требуется строгое поведение
        // throw new Error('Contractor not found for deletion.');
      } else {
        console.log('PostgreSQLService: Contractor deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting contractor:', error);
      throw new Error(`Failed to delete contractor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // --- Drivers ---
  async getDrivers(): Promise<Driver[]> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Fetching drivers...');
    try {
      // Предполагается, что колонки в таблице drivers соответствуют типу Driver
      const drivers = await sql<Driver[]>`
        SELECT id, name, phone, license, experience_years, passport_data, notes, "createdAt", "updatedAt"
        FROM drivers
        ORDER BY name ASC
      `;
      console.log(`PostgreSQLService: Fetched ${drivers.length} drivers.`);
      return drivers;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching drivers:', error);
      throw new Error(`Failed to fetch drivers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveDriver(driver: Partial<Driver> & { name: string; phone: string; }): Promise<Driver> {
    this.ensureConnected();
    // ВАЖНО: Текущая реализация неполная.
    // Таблица "drivers" требует обязательное поле "user_id", но при прямом подключении к PG
    // у нас нет контекста пользователя. Необходимо решить, как получать user_id.
    console.warn('PostgreSQLService: saveDriver not fully implemented due to missing user_id context.');
    // @ts-ignore // TODO: Реализовать после решения проблемы с user_id
    throw new Error('saveDriver not implemented for PostgreSQL. Missing user context.');
  }

  async deleteDriver(id: string): Promise<void> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Deleting driver with id:', id);
    try {
      const result = await sql`
        DELETE FROM drivers 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Driver not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Driver deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting driver:', error);
      throw new Error(`Failed to delete driver: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // --- Vehicles ---
  async getVehicles(): Promise<Vehicle[]> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Fetching vehicles...');
    try {
      // Примечание: Используем алиасы для приведения snake_case колонок к camelCase, как в типах приложения
      const vehicles = await sql<Vehicle[]>`
        SELECT 
          id, brand, model, license_plate AS "licensePlate", 
          year, capacity, vin, registration_certificate AS "registrationCertificate",
          insurance_policy AS "insurancePolicy", 
          technical_inspection_expiry AS "technicalInspectionExpiry",
          insurance_expiry AS "insuranceExpiry",
          notes, "createdAt", "updatedAt"
        FROM vehicles
        ORDER BY brand ASC, model ASC
      `;
      console.log(`PostgreSQLService: Fetched ${vehicles.length} vehicles.`);
      return vehicles;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching vehicles:', error);
      throw new Error(`Failed to fetch vehicles: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async saveVehicle(vehicle: Partial<Vehicle> & { brand: string; model: string; licensePlate: string; }): Promise<Vehicle> {
    this.ensureConnected();
    console.warn('PostgreSQLService: saveVehicle not fully implemented due to missing user_id context.');
    throw new Error('saveVehicle not implemented for PostgreSQL. Missing user context.');
  }
  async deleteVehicle(id: string): Promise<void> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Deleting vehicle with id:', id);
    try {
      const result = await sql`
        DELETE FROM vehicles 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Vehicle not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Vehicle deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting vehicle:', error);
      throw new Error(`Failed to delete vehicle: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // --- Routes ---
  async getRoutes(): Promise<Route[]> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Fetching routes...');
    try {
      const routes = await sql<Route[]>`
        SELECT 
          id, name, point_a AS "pointA", point_b AS "pointB", 
          distance_km AS "distanceKm", estimated_duration_hours AS "estimatedDurationHours", 
          notes, "createdAt", "updatedAt"
        FROM routes
        ORDER BY name ASC
      `;
      console.log(`PostgreSQLService: Fetched ${routes.length} routes.`);
      return routes;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching routes:', error);
      throw new Error(`Failed to fetch routes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async saveRoute(route: Partial<Route> & { name: string; pointA: string; pointB: string; }): Promise<Route> {
    this.ensureConnected();
    console.warn('PostgreSQLService: saveRoute not fully implemented due to missing user_id context.');
    throw new Error('saveRoute not implemented for PostgreSQL. Missing user context.');
  }
  async deleteRoute(id: string): Promise<void> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Deleting route with id:', id);
    try {
      const result = await sql`
        DELETE FROM routes 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Route not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Route deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting route:', error);
      throw new Error(`Failed to delete route: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // --- CargoTypes ---
  async getCargoTypes(): Promise<CargoType[]> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Fetching cargo types...');
    try {
      const cargoTypes = await sql<CargoType[]>`
        SELECT 
          id, name, description, default_weight AS "defaultWeight",
          default_volume AS "defaultVolume", hazardous, temperature_controlled AS "temperatureControlled",
          fragile, "createdAt", "updatedAt"
        FROM cargo_types
        ORDER BY name ASC
      `;
      console.log(`PostgreSQLService: Fetched ${cargoTypes.length} cargo types.`);
      return cargoTypes;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching cargo types:', error);
      throw new Error(`Failed to fetch cargo types: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async saveCargoType(cargoType: Partial<CargoType> & { name: string; }): Promise<CargoType> {
    this.ensureConnected();
    console.warn('PostgreSQLService: saveCargoType not fully implemented due to missing user_id context.');
    throw new Error('saveCargoType not implemented for PostgreSQL. Missing user context.');
  }
  async deleteCargoType(id: string): Promise<void> {
    const sql = this.ensureConnected();
    console.log('PostgreSQLService: Deleting cargo type with id:', id);
    try {
      const result = await sql`
        DELETE FROM cargo_types 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Cargo type not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Cargo type deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting cargo type:', error);
      throw new Error(`Failed to delete cargo type: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // --- Trips ---
  async getTrips(): Promise<Trip[]> {
    this.ensureConnected();
    console.warn('PostgreSQLService: getTrips not fully implemented.');
    return Promise.resolve([]);
  }
  async saveTrip(trip: Partial<Trip>): Promise<Trip> {
    this.ensureConnected();
    console.warn('PostgreSQLService: saveTrip not fully implemented.');
    throw new Error('saveTrip not implemented');
  }
  async deleteTrip(id: string): Promise<void> {
    this.ensureConnected();
    console.warn('PostgreSQLService: deleteTrip not fully implemented.');
    return Promise.resolve();
  }

  // --- TripExpenses ---
  async getTripExpenses(tripId: string): Promise<TripExpense[]> {
    this.ensureConnected();
    console.warn('PostgreSQLService: getTripExpenses not fully implemented.');
    return Promise.resolve([]);
  }
  async createTripExpense(expense: Omit<TripExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { tripId: string }): Promise<TripExpense> {
    this.ensureConnected();
    console.warn('PostgreSQLService: createTripExpense not fully implemented.');
    throw new Error('createTripExpense not implemented');
  }
  async updateTripExpense(id: string, expense: Partial<Omit<TripExpense, 'id'|'createdAt'|'updatedAt'|'userId'|'tripId'>>): Promise<TripExpense> {
    this.ensureConnected();
    console.warn('PostgreSQLService: updateTripExpense not fully implemented.');
    throw new Error('updateTripExpense not implemented');
  }
  async deleteTripExpense(id: string): Promise<void> {
    this.ensureConnected();
    console.warn('PostgreSQLService: deleteTripExpense not fully implemented.');
    return Promise.resolve();
  }

  // --- Dashboard & Stats ---
  async getDashboardStats(): Promise<any> {
    this.ensureConnected();
    console.warn('PostgreSQLService: getDashboardStats not fully implemented.');
    return Promise.resolve({});
  }
  async getAdvancedStats(filters?: any): Promise<any> {
    this.ensureConnected();
    console.warn('PostgreSQLService: getAdvancedStats not fully implemented.');
    return Promise.resolve({});
  }
}

// Экземпляр сервиса может быть создан позже, когда будет конфигурация
// export const postgreSQLService = new PostgreSQLService();
