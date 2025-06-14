
import type postgres from 'postgres';
import type { Trip } from '@/types';

export class PostgresTripsHandler {
  constructor(private getDB: () => postgres.Sql) {}

  async getTrips(): Promise<Trip[]> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching trips...');
    try {
      const trips = await sql<Trip[]>`
        SELECT
          id, status, documents, comments,
          departure_date AS "departureDate",
          arrival_date AS "arrivalDate",
          point_a AS "pointA",
          point_b AS "pointB",
          contractor_id AS "contractorId",
          driver_id AS "driverId",
          vehicle_id AS "vehicleId",
          route_id AS "routeId",
          cargo_type_id AS "cargoTypeId",
          cargo_description AS "cargoDescription",
          cargo_weight AS "cargoWeight",
          cargo_volume AS "cargoVolume",
          cargo_value AS "cargoValue",
          driver_name AS "driverName",
          driver_phone AS "driverPhone",
          driver_license AS "driverLicense",
          vehicle_brand AS "vehicleBrand",
          vehicle_model AS "vehicleModel",
          vehicle_license_plate AS "vehicleLicensePlate",
          vehicle_capacity AS "vehicleCapacity",
          created_at AS "createdAt",
          updated_at AS "updatedAt",
          user_id AS "userId"
        FROM trips
        ORDER BY "departureDate" DESC
      `;
      console.log(`PostgreSQLService: Fetched ${trips.length} trips.`);
      return trips;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching trips:', error);
      throw new Error(`Failed to fetch trips: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async saveTrip(trip: Partial<Trip>): Promise<Trip> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Saving trip:', trip.id ? 'update' : 'insert', trip);
    try {
      if (trip.id) {
        const dataToUpdate = {
          status: trip.status,
          departure_date: trip.departureDate ? new Date(trip.departureDate) : undefined,
          arrival_date: trip.arrivalDate ? new Date(trip.arrivalDate) : undefined,
          point_a: trip.pointA,
          point_b: trip.pointB,
          contractor_id: trip.contractorId,
          driver_id: trip.driverId,
          vehicle_id: trip.vehicleId,
          route_id: trip.routeId,
          cargo_type_id: trip.cargoTypeId,
          driver_name: trip.driver?.name,
          driver_phone: trip.driver?.phone,
          driver_license: trip.driver?.license,
          vehicle_brand: trip.vehicle?.brand,
          vehicle_model: trip.vehicle?.model,
          vehicle_license_plate: trip.vehicle?.licensePlate,
          vehicle_capacity: trip.vehicle?.capacity,
          cargo_description: trip.cargo?.description,
          cargo_weight: trip.cargo?.weight,
          cargo_volume: trip.cargo?.volume,
          cargo_value: trip.cargo?.value,
          comments: trip.comments,
          documents: trip.documents ? JSON.stringify(trip.documents) : undefined,
        };

        const filteredData = Object.fromEntries(
          Object.entries(dataToUpdate).filter(([, v]) => v !== undefined)
        );
        
        const [updatedTrip] = await sql<Trip[]>`
          UPDATE trips
          SET ${sql(filteredData)},
              updated_at = NOW()
          WHERE id = ${trip.id}
          RETURNING
            id, status, documents, comments,
            departure_date AS "departureDate",
            arrival_date AS "arrivalDate",
            point_a AS "pointA",
            point_b AS "pointB",
            contractor_id AS "contractorId",
            driver_id AS "driverId",
            vehicle_id AS "vehicleId",
            route_id AS "routeId",
            cargo_type_id AS "cargoTypeId",
            cargo_description AS "cargoDescription",
            cargo_weight AS "cargoWeight",
            cargo_volume AS "cargoVolume",
            cargo_value AS "cargoValue",
            driver_name AS "driverName",
            driver_phone AS "driverPhone",
            driver_license AS "driverLicense",
            vehicle_brand AS "vehicleBrand",
            vehicle_model AS "vehicleModel",
            vehicle_license_plate AS "vehicleLicensePlate",
            vehicle_capacity AS "vehicleCapacity",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            user_id AS "userId"
        `;
        if (!updatedTrip) throw new Error('Trip not found for update or update failed.');
        console.log('PostgreSQLService: Trip updated:', updatedTrip);
        return updatedTrip;

      } else {
        console.warn('PostgreSQLService: saveTrip (insert) not fully implemented due to missing user_id context.');
        throw new Error('saveTrip (insert) not implemented for PostgreSQL. Missing user context.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error saving trip:', error);
      throw new Error(`Failed to save trip: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async deleteTrip(id: string): Promise<void> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Deleting trip with id:', id);
    try {
      const result = await sql`
        DELETE FROM trips
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Trip not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Trip deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting trip:', error);
      throw new Error(`Failed to delete trip: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
