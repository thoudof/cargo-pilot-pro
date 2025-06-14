
import { supabaseService } from '@/services/supabaseService';
import type { DatabaseProvider, AuthUser } from './DatabaseProvider';
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials, AuthResponse } from '@supabase/supabase-js';
import type { Contractor, Driver, Vehicle, Route, CargoType, Trip } from '@/types';
import type { TripExpense } from '@/types/expenses';

class AppDatabaseService implements DatabaseProvider {
  async signIn(credentials: SignInWithPasswordCredentials): Promise<AuthResponse> {
    return supabaseService.signIn(credentials.email, credentials.password);
  }

  async signUp(credentials: SignUpWithPasswordCredentials & { data?: object }): Promise<AuthResponse> {
    return supabaseService.signUp(credentials.email, credentials.password, credentials.data);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return supabaseService.getCurrentUser();
  }

  async signOut(): Promise<void> {
    return supabaseService.signOut();
  }

  async getContractors(): Promise<Contractor[]> {
    return supabaseService.getContractors();
  }

  async saveContractor(contractor: Partial<Contractor> & { id?: string; companyName: string; inn: string; address: string; }): Promise<Contractor> {
    return supabaseService.saveContractor(contractor);
  }

  async deleteContractor(id: string): Promise<void> {
    return supabaseService.deleteContractor(id);
  }

  async getDrivers(): Promise<Driver[]> {
    return supabaseService.getDrivers();
  }

  async saveDriver(driver: Partial<Driver> & { id?: string; name: string; phone: string; }): Promise<Driver> {
    return supabaseService.saveDriver(driver);
  }

  async deleteDriver(id: string): Promise<void> {
    return supabaseService.deleteDriver(id);
  }

  async getVehicles(): Promise<Vehicle[]> {
    return supabaseService.getVehicles();
  }

  async saveVehicle(vehicle: Partial<Vehicle> & { id?: string; brand: string; model: string; licensePlate: string; }): Promise<Vehicle> {
    return supabaseService.saveVehicle(vehicle);
  }

  async deleteVehicle(id: string): Promise<void> {
    return supabaseService.deleteVehicle(id);
  }

  async getRoutes(): Promise<Route[]> {
    return supabaseService.getRoutes();
  }

  async saveRoute(route: Partial<Route> & { id?: string; name: string; pointA: string; pointB: string; }): Promise<Route> {
    return supabaseService.saveRoute(route);
  }

  async deleteRoute(id: string): Promise<void> {
    return supabaseService.deleteRoute(id);
  }

  async getCargoTypes(): Promise<CargoType[]> {
    return supabaseService.getCargoTypes();
  }

  async saveCargoType(cargoType: Partial<CargoType> & { id?: string; name: string; }): Promise<CargoType> {
    return supabaseService.saveCargoType(cargoType);
  }

  async deleteCargoType(id: string): Promise<void> {
    return supabaseService.deleteCargoType(id);
  }

  async getTrips(): Promise<Trip[]> {
    return supabaseService.getTrips();
  }

  async saveTrip(trip: Partial<Trip> & { id?: string }): Promise<Trip> {
    // supabaseService.saveTrip expects 'any', this might need adjustment
    // based on the actual structure it expects for saving.
    return supabaseService.saveTrip(trip as any); 
  }

  async deleteTrip(id: string): Promise<void> {
    return supabaseService.deleteTrip(id);
  }

  async getTripExpenses(tripId: string): Promise<TripExpense[]> {
    return supabaseService.getTripExpenses(tripId);
  }

  async createTripExpense(expense: Omit<TripExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { tripId: string }): Promise<TripExpense> {
    // supabaseService.createTripExpense expects 'any'
    return supabaseService.createTripExpense(expense as any);
  }

  async updateTripExpense(id: string, expense: Partial<Omit<TripExpense, 'id'|'createdAt'|'updatedAt'|'userId'|'tripId'>>): Promise<TripExpense> {
    // supabaseService.updateTripExpense expects 'any' for the expense data
    return supabaseService.updateTripExpense(id, expense as any);
  }

  async deleteTripExpense(id: string): Promise<void> {
    return supabaseService.deleteTripExpense(id);
  }
  
  async getDashboardStats(): Promise<any> {
    return supabaseService.getDashboardStats();
  }

  async getAdvancedStats(filters?: any): Promise<any> {
    return supabaseService.getAdvancedStats(filters);
  }
}

export const appDbService = new AppDatabaseService();
