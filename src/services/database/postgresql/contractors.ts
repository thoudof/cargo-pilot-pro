import type postgres from 'postgres';
import type { Contractor } from '@/types';

export class PostgresContractorsHandler {
  constructor(private getDB: () => postgres.Sql) {}

  async getContractors(): Promise<Contractor[]> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching contractors...');
    try {
      const contractors = await sql<Contractor[]>`
        SELECT 
          id, 
          company_name AS "companyName", 
          inn, 
          address, 
          notes,
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
        FROM contractors
        ORDER BY "companyName" ASC
      `;
      console.log(`PostgreSQLService: Fetched ${contractors.length} contractors.`);
      return contractors;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching contractors:', error);
      throw new Error(`Failed to fetch contractors: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveContractor(contractor: Partial<Contractor> & { companyName: string; inn: string; address: string; }, userId: string): Promise<Contractor> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Saving contractor:', contractor.id ? 'update' : 'insert', contractor);
    try {
      if (contractor.id) {
        const [updatedContractor] = await sql<Contractor[]>`
          UPDATE contractors
          SET company_name = ${contractor.companyName}, 
              inn = ${contractor.inn}, 
              address = ${contractor.address}, 
              notes = ${contractor.notes || null},
              updated_at = NOW()
          WHERE id = ${contractor.id}
          RETURNING id, company_name AS "companyName", inn, address, notes, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
        if (!updatedContractor) throw new Error('Contractor not found for update or update failed.');
        console.log('PostgreSQLService: Contractor updated:', updatedContractor);
        return updatedContractor;
      } else {
        if (!userId) {
          throw new Error('User ID is required to create a new contractor.');
        }
        const [newContractor] = await sql<Contractor[]>`
          INSERT INTO contractors (company_name, inn, address, notes, user_id)
          VALUES (${contractor.companyName}, ${contractor.inn}, ${contractor.address}, ${contractor.notes || null}, ${userId})
          RETURNING id, company_name AS "companyName", inn, address, notes, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
        if (!newContractor) throw new Error('Contractor creation failed.');
        console.log('PostgreSQLService: Contractor created:', newContractor);
        return newContractor;
      }
    } catch (error) {
      console.error('PostgreSQLService: Error saving contractor:', error);
      throw new Error(`Failed to save contractor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteContractor(id: string): Promise<void> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Deleting contractor with id:', id);
    try {
      const result = await sql`
        DELETE FROM contractors 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Contractor not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Contractor deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting contractor:', error);
      throw new Error(`Failed to delete contractor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
