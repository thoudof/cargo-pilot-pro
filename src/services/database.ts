
import { Preferences } from '@capacitor/preferences';
import CryptoJS from 'crypto-js';
import { Contractor, Trip, User } from '@/types';

const ENCRYPTION_KEY = 'transport-app-key';

class DatabaseService {
  private encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  }

  private decrypt(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  async saveData(key: string, data: any): Promise<void> {
    const encrypted = this.encrypt(data);
    await Preferences.set({ key, value: encrypted });
  }

  async getData(key: string): Promise<any> {
    const { value } = await Preferences.get({ key });
    if (!value) return null;
    return this.decrypt(value);
  }

  async removeData(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  // Contractors
  async saveContractors(contractors: Contractor[]): Promise<void> {
    await this.saveData('contractors', contractors);
  }

  async getContractors(): Promise<Contractor[]> {
    const data = await this.getData('contractors');
    return data || [];
  }

  async saveContractor(contractor: Contractor): Promise<void> {
    const contractors = await this.getContractors();
    const index = contractors.findIndex(c => c.id === contractor.id);
    
    if (index >= 0) {
      contractors[index] = contractor;
    } else {
      contractors.push(contractor);
    }
    
    await this.saveContractors(contractors);
  }

  async deleteContractor(id: string): Promise<void> {
    const contractors = await this.getContractors();
    const filtered = contractors.filter(c => c.id !== id);
    await this.saveContractors(filtered);
  }

  // Trips
  async saveTrips(trips: Trip[]): Promise<void> {
    await this.saveData('trips', trips);
  }

  async getTrips(): Promise<Trip[]> {
    const data = await this.getData('trips');
    return data || [];
  }

  async saveTrip(trip: Trip): Promise<void> {
    const trips = await this.getTrips();
    const index = trips.findIndex(t => t.id === trip.id);
    
    if (index >= 0) {
      trips[index] = trip;
    } else {
      trips.push(trip);
    }
    
    await this.saveTrips(trips);
  }

  async deleteTrip(id: string): Promise<void> {
    const trips = await this.getTrips();
    const filtered = trips.filter(t => t.id !== id);
    await this.saveTrips(filtered);
  }

  // Users
  async saveUsers(users: User[]): Promise<void> {
    await this.saveData('users', users);
  }

  async getUsers(): Promise<User[]> {
    const data = await this.getData('users');
    return data || [];
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.getData('currentUser');
  }

  async setCurrentUser(user: User): Promise<void> {
    await this.saveData('currentUser', user);
  }
}

export const db = new DatabaseService();
