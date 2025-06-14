
import type postgres from 'postgres';
import type { AuthUser } from '../DatabaseProvider';
import type {
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  AuthResponse,
} from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';

export class PostgresAuthHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private getDB: () => postgres.Sql) {}

  async signIn(credentials: SignInWithPasswordCredentials): Promise<AuthResponse> {
    console.warn('PostgreSQLService: Direct DB sign-in is not implemented/recommended for security reasons.');
    const error = new AuthError('Direct database sign-in is not supported by PostgreSQLService.');
    error.status = 501; // Not Implemented
    return { data: { user: null, session: null }, error };
  }

  async signUp(credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> {
    console.warn('PostgreSQLService: Direct DB sign-up is not implemented/recommended for security reasons.');
    const error = new AuthError('Direct database sign-up is not supported by PostgreSQLService.');
    error.status = 501; // Not Implemented
    return { data: { user: null, session: null }, error };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    console.warn('PostgreSQLService: getCurrentUser is not directly applicable here without a proper auth backend.');
    return null;
  }

  async signOut(): Promise<void> {
    console.warn('PostgreSQLService: signOut is not directly applicable here without a proper auth backend.');
    return Promise.resolve();
  }
}
