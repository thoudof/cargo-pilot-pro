import { supabaseService } from '@/services/supabaseService';
import type { DatabaseProvider, AuthUser } from './DatabaseProvider';
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials, AuthResponse, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import type { Contractor, Driver, Vehicle, Route, CargoType, Trip } from '@/types';
import type { TripExpense } from '@/types/expenses';

class AppDatabaseService implements DatabaseProvider {
  async signIn(credentials: SignInWithPasswordCredentials): Promise<AuthResponse> {
    if (!('email' in credentials) || !credentials.email) {
      const error = new AuthError('Email is required for this sign-in method.');
      error.status = 400;
      return { data: { user: null, session: null }, error };
    }

    try {
      // supabaseService.signIn now returns { user, session } or throws an error
      const data = await supabaseService.signIn(credentials.email, credentials.password);

      if (data.user && data.session) {
        return { data: { user: data.user as SupabaseUser, session: data.session as SupabaseSession }, error: null };
      } else {
        // This case should ideally not be reached if supabaseService.signIn throws on any issue
        // or guarantees user/session on success.
        const error = new AuthError('Sign-in failed due to an unexpected issue.');
        error.status = 500;
        return { data: { user: null, session: null }, error };
      }
    } catch (e: any) {
      let error: AuthError;
      if (e instanceof AuthError) {
        error = e;
      } else {
        error = new AuthError(e.message || 'An unknown sign-in error occurred.');
        error.status = e.status || 500;
      }
      return { data: { user: null, session: null }, error };
    }
  }

  async signUp(credentials: SignUpWithPasswordCredentials & { data?: object }): Promise<AuthResponse> {
    if (!('email' in credentials) || !credentials.email) {
      const error = new AuthError('Email is required for this sign-up method.');
      error.status = 400;
      return { data: { user: null, session: null }, error };
    }

    const optionsData = credentials.options?.data || ('data' in credentials ? credentials.data : undefined);

    try {
      // supabaseService.signUp now returns { user, session } or throws an error
      const data = await supabaseService.signUp(credentials.email, credentials.password, optionsData as { [key: string]: any } | undefined);
      
      if (data.user && data.session) {
        return { data: { user: data.user as SupabaseUser, session: data.session as SupabaseSession }, error: null };
      } else {
        // This case should ideally not be reached if supabaseService.signUp throws on any issue
        // or guarantees user/session on success.
        const error = new AuthError('Sign-up failed due to an unexpected issue.');
        error.status = 500;
        return { data: { user: null, session: null }, error };
      }
    } catch (e: any) {
      let error: AuthError;
      if (e instanceof AuthError) {
        error = e;
      } else {
        error = new AuthError(e.message || 'An unknown sign-up error occurred.');
        error.status = e.status || 500;
      }
      return { data: { user: null, session: null }, error };
    }
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
    return supabaseService.saveTrip(trip as any);
  }

  async deleteTrip(id: string): Promise<void> {
    return supabaseService.deleteTrip(id);
  }

  async getTripExpenses(tripId: string): Promise<TripExpense[]> {
    return supabaseService.getTripExpenses(tripId);
  }

  async createTripExpense(expense: Omit<TripExpense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { tripId: string }): Promise<TripExpense> {
    return supabaseService.createTripExpense(expense as any);
  }

  async updateTripExpense(id: string, expense: Partial<Omit<TripExpense, 'id'|'createdAt'|'updatedAt'|'createdBy'|'tripId'>>): Promise<TripExpense> {
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
