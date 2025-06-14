
import type postgres from 'postgres';
import type { Contractor, Driver, Vehicle } from '@/types';

export class PostgresStatsHandler {
  constructor(private getDB: () => postgres.Sql) {}

  async getDashboardStats(): Promise<any> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching dashboard stats...');
    console.warn('PostgreSQLService: getDashboardStats is fetching data for ALL users as there is no user context.');

    try {
      const [trips, contractors, drivers, vehicles, tripExpenses] = await Promise.all([
        sql<any[]>`SELECT 
          id, status, 
          departure_date AS "departureDate", 
          arrival_date AS "arrivalDate", 
          point_a AS "pointA", 
          point_b AS "pointB", 
          contractor_id AS "contractorId", 
          driver_id AS "driverId", 
          vehicle_id AS "vehicleId", 
          route_id AS "routeId", 
          cargo_type_id AS "cargoTypeId", 
          driver_name AS "driverName", 
          driver_phone AS "driverPhone", 
          driver_license AS "driverLicense", 
          vehicle_brand AS "vehicleBrand", 
          vehicle_model AS "vehicleModel", 
          vehicle_license_plate AS "vehicleLicensePlate",
          vehicle_capacity AS "vehicleCapacity",
          cargo_description AS "cargoDescription",
          cargo_weight AS "cargoWeight",
          cargo_volume AS "cargoVolume",
          cargo_value AS "cargoValue",
          comments, documents,
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
        FROM trips`,
        sql<Contractor[]>`SELECT id, company_name as "companyName", inn, address, contacts, notes, created_at as "createdAt", updated_at as "updatedAt" FROM contractors`,
        sql<Driver[]>`SELECT id, name, phone, license, passport_data AS "passportData", experience_years AS "experienceYears", notes, created_at AS "createdAt", updated_at AS "updatedAt" FROM drivers`,
        sql<Vehicle[]>`SELECT id, brand, model, license_plate AS "licensePlate", capacity, year, vin, registration_certificate AS "registrationCertificate", insurance_policy AS "insurancePolicy", insurance_expiry AS "insuranceExpiry", technical_inspection_expiry AS "technicalInspectionExpiry", notes, created_at AS "createdAt", updated_at AS "updatedAt" FROM vehicles`,
        sql<any[]>`SELECT 
          id,
          trip_id AS "tripId",
          user_id AS "userId",
          expense_type AS "expenseType",
          amount,
          description,
          expense_date AS "expenseDate",
          receipt_url AS "receiptUrl",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM trip_expenses`,
      ]);

      const activeTrips = trips.filter(trip => trip.status === 'in_progress').length;
      const totalTrips = trips.length;
      const completedTrips = trips.filter(trip => trip.status === 'completed').length;
      const plannedTrips = trips.filter(trip => trip.status === 'planned').length;
      const cancelledTrips = trips.filter(trip => trip.status === 'cancelled').length;

      const totalCargoValue = trips.reduce((sum, trip) => sum + (Number(trip.cargoValue) || 0), 0);
      const completedCargoValue = trips.filter(trip => trip.status === 'completed')
        .reduce((sum, trip) => sum + (Number(trip.cargoValue) || 0), 0);

      const totalWeight = trips.reduce((sum, trip) => sum + (Number(trip.cargoWeight) || 0), 0);
      const totalVolume = trips.reduce((sum, trip) => sum + (Number(trip.cargoVolume) || 0), 0);

      const totalExpenses = tripExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
      
      const monthlyStats = this.generateMonthlyStats(trips, tripExpenses);

      const averageCargoValue = completedTrips > 0 ? completedCargoValue / completedTrips : 0;
      const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;
      const profit = completedCargoValue - totalExpenses;
      const profitMargin = completedCargoValue > 0 ? (profit / completedCargoValue) * 100 : 0;

      return {
        activeTrips,
        totalTrips,
        completedTrips,
        plannedTrips,
        cancelledTrips,
        contractors: contractors.length,
        drivers: drivers.length,
        vehicles: vehicles.length,
        totalCargoValue,
        completedCargoValue,
        totalWeight,
        totalVolume,
        monthlyStats,
        averageCargoValue,
        completionRate,
        totalExpenses,
        profit,
        profitMargin,
      };

    } catch (error) {
      console.error('PostgreSQLService: Error fetching dashboard stats:', error);
      throw new Error(`Failed to fetch dashboard stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generateMonthlyStats(trips: any[], expenses: any[]) {
    const monthNames = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Ноя', 'Дек'];
    const currentDate = new Date();
    const stats = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      
      const monthTrips = trips.filter(trip => {
        const tripDate = new Date(trip.createdAt);
        return tripDate.getMonth() === date.getMonth() && tripDate.getFullYear() === date.getFullYear();
      });

      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expenseDate);
        return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
      });

      const tripsCount = monthTrips.length;
      const revenue = monthTrips.reduce((sum, trip) => sum + (Number(trip.cargoValue) || 0), 0);
      const weight = monthTrips.reduce((sum, trip) => sum + (Number(trip.cargoWeight) || 0), 0);
      const expensesTotal = monthExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

      stats.push({
        month: monthName,
        trips: tripsCount,
        revenue,
        weight: Math.round(weight / 1000), // Конвертируем в тонны
        expenses: expensesTotal
      });
    }

    return stats;
  }
    
  async getAdvancedStats(filters?: any): Promise<any> {
    this.getDB();
    console.warn('PostgreSQLService: getAdvancedStats not fully implemented.');
    return Promise.resolve({});
  }
}
