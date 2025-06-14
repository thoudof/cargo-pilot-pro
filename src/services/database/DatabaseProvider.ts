import type { User as SupabaseUser, AuthResponse, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import type { Contractor, Driver, Vehicle, Route, CargoType, Trip, User } from '@/types';
import type { TripExpense } from '@/types/expenses';
import type { TripWithExpenses } from '@/types/reports'; // Assuming this is the enriched trip type used in reports

// Определяем более общие типы для аргументов, если это необходимо
// Например, для saveContractor, saveDriver и т.д. можно использовать Partial<T> & { id?: string }
// или более специфичные типы для создания и обновления.
// Для простоты пока оставим 'any', но в идеале их нужно типизировать точнее.

export interface AuthUser extends SupabaseUser {}

export interface DatabaseProvider {
  // Auth
  signIn(credentials: SignInWithPasswordCredentials): Promise<AuthResponse>;
  signUp(credentials: SignUpWithPasswordCredentials & { data?: object }): Promise<AuthResponse>;
  getCurrentUser(): Promise<AuthUser | null>;
  signOut(): Promise<void>;

  // Contractors
  getContractors(): Promise<Contractor[]>;
  saveContractor(contractor: Partial<Contractor> & { id?: string; companyName: string; inn: string; address: string; }, userId: string): Promise<Contractor>;
  deleteContractor(id: string): Promise<void>;

  // Drivers
  getDrivers(): Promise<Driver[]>;
  saveDriver(driver: Partial<Driver> & { id?: string; name: string; phone: string; }, userId: string): Promise<Driver>;
  deleteDriver(id: string): Promise<void>;

  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  saveVehicle(vehicle: Partial<Vehicle> & { id?: string; brand: string; model: string; licensePlate: string; }, userId: string): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;

  // Routes
  getRoutes(): Promise<Route[]>;
  saveRoute(route: Partial<Route> & { id?: string; name: string; pointA: string; pointB: string; }, userId: string): Promise<Route>;
  deleteRoute(id: string): Promise<void>;

  // CargoTypes
  getCargoTypes(): Promise<CargoType[]>;
  saveCargoType(cargoType: Partial<CargoType> & { id?: string; name: string; }, userId: string): Promise<CargoType>;
  deleteCargoType(id: string): Promise<void>;

  // Trips
  getTrips(): Promise<Trip[]>; // This might need to be TripWithExpenses in some contexts, or have variants
  saveTrip(trip: Partial<Trip> & { id?: string /* other required fields for save */ }, userId: string): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;

  // TripExpenses
  getTripExpenses(tripId: string): Promise<TripExpense[]>;
  createTripExpense(expense: Omit<TripExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { tripId: string }, userId: string): Promise<TripExpense>;
  updateTripExpense(id: string, expense: Partial<Omit<TripExpense, 'id'|'createdAt'|'updatedAt'|'userId'|'tripId'>>): Promise<TripExpense>;
  deleteTripExpense(id: string): Promise<void>;
  
  // Dashboard & Stats
  getDashboardStats(): Promise<any>; // Replace 'any' with a proper type for dashboard stats
  getAdvancedStats(filters?: any): Promise<any>; // Replace 'any' with proper types for filters and stats

  // TODO: Consider adding a way to access the underlying client if needed for provider-specific features
  // getClient<T>(): T; 
}
