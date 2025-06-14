
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
  saveContractor = (contractor: Partial<Contractor> & { companyName: string; inn: string; address: string; }): Promise<Contractor> => this.contractorsHandler.saveContractor(contractor);
  deleteContractor = (id: string): Promise<void> => this.contractorsHandler.deleteContractor(id);

  // --- Drivers ---
  getDrivers = (): Promise<Driver[]> => this.driversHandler.getDrivers();
  saveDriver = (driver: Partial<Driver> & { name: string; phone: string; }): Promise<Driver> => this.driversHandler.saveDriver(driver);
  deleteDriver = (id: string): Promise<void> => this.driversHandler.deleteDriver(id);

  // --- Vehicles ---
  getVehicles = (): Promise<Vehicle[]> => this.vehiclesHandler.getVehicles();
  saveVehicle = (vehicle: Partial<Vehicle> & { brand: string; model: string; licensePlate: string; }): Promise<Vehicle> => this.vehiclesHandler.saveVehicle(vehicle);
  deleteVehicle = (id: string): Promise<void> => this.vehiclesHandler.deleteVehicle(id);

  // --- Routes ---
  getRoutes = (): Promise<Route[]> => this.routesHandler.getRoutes();
  saveRoute = (route: Partial<Route> & { name: string; pointA: string; pointB: string; }): Promise<Route> => this.routesHandler.saveRoute(route);
  deleteRoute = (id: string): Promise<void> => this.routesHandler.deleteRoute(id);

  // --- CargoTypes ---
  getCargoTypes = (): Promise<CargoType[]> => this.cargoTypesHandler.getCargoTypes();
  saveCargoType = (cargoType: Partial<CargoType> & { name: string; }): Promise<CargoType> => this.cargoTypesHandler.saveCargoType(cargoType);
  deleteCargoType = (id: string): Promise<void> => this.cargoTypesHandler.deleteCargoType(id);

  // --- Trips ---
  getTrips = (): Promise<Trip[]> => this.tripsHandler.getTrips();
  saveTrip = (trip: Partial<Trip>): Promise<Trip> => this.tripsHandler.saveTrip(trip);
  deleteTrip = (id: string): Promise<void> => this.tripsHandler.deleteTrip(id);

  // --- TripExpenses ---
  getTripExpenses = (tripId: string): Promise<TripExpense[]> => this.expensesHandler.getTripExpenses(tripId);
  createTripExpense = (expense: Omit<TripExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { tripId: string }): Promise<TripExpense> => this.expensesHandler.createTripExpense(expense);
  updateTripExpense = (id: string, expense: Partial<Omit<TripExpense, 'id'|'createdAt'|'updatedAt'|'userId'|'tripId'>>): Promise<TripExpense> => this.expensesHandler.updateTripExpense(id, expense);
  deleteTripExpense = (id: string): Promise<void> => this.expensesHandler.deleteTripExpense(id);

  // --- Dashboard & Stats ---
  getDashboardStats = (): Promise<any> => this.statsHandler.getDashboardStats();
  getAdvancedStats = (filters?: any): Promise<any> => this.statsHandler.getAdvancedStats(filters);
}
