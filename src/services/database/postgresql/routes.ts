import type postgres from 'postgres';
import type { Route } from '@/types';

export class PostgresRoutesHandler {
  constructor(private getDB: () => postgres.Sql) {}
  
  async getRoutes(): Promise<Route[]> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching routes...');
    try {
      const routes = await sql<Route[]>`
        SELECT 
          id, name, notes,
          point_a AS "pointA", 
          point_b AS "pointB", 
          distance_km AS "distanceKm", 
          estimated_duration_hours AS "estimatedDurationHours", 
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
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
  async saveRoute(route: Partial<Route> & { name: string; pointA: string; pointB: string; }, userId: string): Promise<Route> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Saving route:', route.id ? 'update' : 'insert', route);
    try {
      if (route.id) {
        const [updatedRoute] = await sql<Route[]>`
          UPDATE routes
          SET name = ${route.name},
              point_a = ${route.pointA},
              point_b = ${route.pointB},
              distance_km = ${route.distanceKm || null},
              estimated_duration_hours = ${route.estimatedDurationHours || null},
              notes = ${route.notes || null},
              updated_at = NOW()
          WHERE id = ${route.id}
          RETURNING id, name, point_a AS "pointA", point_b AS "pointB", distance_km AS "distanceKm", estimated_duration_hours AS "estimatedDurationHours", notes, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
        if (!updatedRoute) throw new Error('Route not found for update or update failed.');
        console.log('PostgreSQLService: Route updated:', updatedRoute);
        return updatedRoute;
      } else {
        if (!userId) {
          throw new Error('User ID is required to create a new route.');
        }
        const [newRoute] = await sql<Route[]>`
          INSERT INTO routes (name, point_a, point_b, distance_km, estimated_duration_hours, notes, user_id)
          VALUES (${route.name}, ${route.pointA}, ${route.pointB}, ${route.distanceKm || null}, ${route.estimatedDurationHours || null}, ${route.notes || null}, ${userId})
          RETURNING id, name, point_a AS "pointA", point_b AS "pointB", distance_km AS "distanceKm", estimated_duration_hours AS "estimatedDurationHours", notes, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
        if (!newRoute) throw new Error('Route creation failed.');
        console.log('PostgreSQLService: Route created:', newRoute);
        return newRoute;
      }
    } catch (error) {
      console.error('PostgreSQLService: Error saving route:', error);
      throw new Error(`Failed to save route: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async deleteRoute(id: string): Promise<void> {
    const sql = this.getDB();
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
}
