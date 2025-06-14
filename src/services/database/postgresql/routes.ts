
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
  async saveRoute(route: Partial<Route> & { name: string; pointA: string; pointB: string; }): Promise<Route> {
    this.getDB();
    console.warn('PostgreSQLService: saveRoute not fully implemented due to missing user_id context.');
    throw new Error('saveRoute not implemented for PostgreSQL. Missing user context.');
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
