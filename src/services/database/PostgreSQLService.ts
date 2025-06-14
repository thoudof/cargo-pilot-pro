
import postgres from 'postgres';
import type { DatabaseProvider, AuthUser } from './DatabaseProvider';
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials, AuthResponse } from '@supabase/supabase-js';
import type { Contractor, Driver, Vehicle, Route, CargoType, Trip } from '@/types';
import type { TripExpense } from '@/types/expenses';

import { PostgresAuthHandler } from './postgresql/auth';
import { PostgresContractorsHandler } from './postgresql/contractors';
import { PostgresDriversHandler } from './postgresql/drivers';
import { PostgresVehiclesHandler } from './postgresql/vehicles';
import { PostgresRoutesHandler } from './postgresql/routes';
import { PostgresCargoTypesHandler } from './postgresql/cargoTypes';
import { PostgresTripsHandler } from './postgresql/trips';
import { PostgresExpensesHandler } from './postgresql/expenses';
import { PostgresStatsHandler } from './postgresql/stats';

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

  // Handlers
  private authHandler: PostgresAuthHandler;
  private contractorsHandler: PostgresContractorsHandler;
  private driversHandler: PostgresDriversHandler;
  private vehiclesHandler: PostgresVehiclesHandler;
  private routesHandler: PostgresRoutesHandler;
  private cargoTypesHandler: PostgresCargoTypesHandler;
  private tripsHandler: PostgresTripsHandler;
  private expensesHandler: PostgresExpensesHandler;
  private statsHandler: PostgresStatsHandler;

  constructor(config?: PostgreSQLConfig) {
    const getDB = this.getDB.bind(this);
    this.authHandler = new PostgresAuthHandler(getDB);
    this.contractorsHandler = new PostgresContractorsHandler(getDB);
    this.driversHandler = new PostgresDriversHandler(getDB);
    this.vehiclesHandler = new PostgresVehiclesHandler(getDB);
    this.routesHandler = new PostgresRoutesHandler(getDB);
    this.cargoTypesHandler = new PostgresCargoTypesHandler(getDB);
    this.tripsHandler = new PostgresTripsHandler(getDB);
    this.expensesHandler = new PostgresExpensesHandler(getDB);
    this.statsHandler = new PostgresStatsHandler(getDB);
    
    if (config) {
      this.initialize(config);
    }
  }

  public initialize(config: PostgreSQLConfig): void {
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

  private getDB(): postgres.Sql {
    if (!this.sql) {
      throw new Error('PostgreSQLService: Not connected. Please provide configuration and initialize.');
    }
    return this.sql;
  }

  // --- Auth Methods ---
  signIn = (credentials: SignInWithPasswordCredentials): Promise<AuthResponse> => this.authHandler.signIn(credentials);
  signUp = (credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> => this.authHandler.signUp(credentials);
  getCurrentUser = (): Promise<AuthUser | null> => this.authHandler.getCurrentUser();
  signOut = (): Promise<void> => this.authHandler.signOut();

  // --- Contractors ---
  getContractors = (): Promise<Contractor[]> => this.contractorsHandler.getContractors();
  saveContractor = (contractor: Partial<Contractor> & { id?: string; companyName: string; inn: string; address: string; }, userId: string): Promise<Contractor> => this.contractorsHandler.saveContractor(contractor, userId);
  deleteContractor = (id: string): Promise<void> => this.contractorsHandler.deleteContractor(id);

  // --- Drivers ---
  getDrivers = (): Promise<Driver[]> => this.driversHandler.getDrivers();
  saveDriver = (driver: Partial<Driver> & { id?: string; name: string; phone: string; }, userId: string): Promise<Driver> => this.driversHandler.saveDriver(driver, userId);
  deleteDriver = (id: string): Promise<void> => this.driversHandler.deleteDriver(id);

  // --- Vehicles ---
  getVehicles = (): Promise<Vehicle[]> => this.vehiclesHandler.getVehicles();
  saveVehicle = (vehicle: Partial<Vehicle> & { id?: string; brand: string; model: string; licensePlate: string; }, userId: string): Promise<Vehicle> => this.vehiclesHandler.saveVehicle(vehicle, userId);
  deleteVehicle = (id: string): Promise<void> => this.vehiclesHandler.deleteVehicle(id);

  // --- Routes ---
  getRoutes = (): Promise<Route[]> => this.routesHandler.getRoutes();
  saveRoute = (route: Partial<Route> & { id?: string; name: string; pointA: string; pointB: string; }, userId: string): Promise<Route> => this.routesHandler.saveRoute(route, userId);
  deleteRoute = (id: string): Promise<void> => this.routesHandler.deleteRoute(id);

  // --- CargoTypes ---
  getCargoTypes = (): Promise<CargoType[]> => this.cargoTypesHandler.getCargoTypes();
  saveCargoType = (cargoType: Partial<CargoType> & { id?: string; name: string; }, userId: string): Promise<CargoType> => this.cargoTypesHandler.saveCargoType(cargoType, userId);
  deleteCargoType = (id: string): Promise<void> => this.cargoTypesHandler.deleteCargoType(id);

  // --- Trips ---
  getTrips = (): Promise<Trip[]> => this.tripsHandler.getTrips();
  saveTrip = (trip: Partial<Trip> & { id?: string; }, userId: string): Promise<Trip> => {
    if (!trip.id) {
      // The handler for creating trips is not implemented to accept a userId.
      throw new Error('Creating new trips is not implemented in PostgreSQLService yet.');
    }
    // The handler for trip updates expects only one argument.
    return this.tripsHandler.saveTrip(trip);
  };
  deleteTrip = (id: string): Promise<void> => this.tripsHandler.deleteTrip(id);

  // --- TripExpenses ---
  getTripExpenses = (tripId: string): Promise<TripExpense[]> => this.expensesHandler.getTripExpenses(tripId);
  createTripExpense = (expense: Omit<TripExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { tripId: string }, userId: string): Promise<TripExpense> => {
    // The handler for creating expenses doesn't accept a userId.
    throw new Error('Creating trip expenses is not implemented in PostgreSQLService yet.');
  };
  updateTripExpense = (id: string, expense: Partial<Omit<TripExpense, 'id'|'createdAt'|'updatedAt'|'userId'|'tripId'>>): Promise<TripExpense> => this.expensesHandler.updateTripExpense(id, expense);
  deleteTripExpense = (id: string): Promise<void> => this.expensesHandler.deleteTripExpense(id);

  // --- Dashboard & Stats ---
  getDashboardStats = (): Promise<any> => this.statsHandler.getDashboardStats();
  getAdvancedStats = (filters?: any): Promise<any> => this.statsHandler.getAdvancedStats(filters);
}
