import { supabase } from '@/integrations/supabase/client';

/**
 * Gets the current user's active company_id from their profile.
 * This is used to scope all data operations to the correct company.
 */
export const getCurrentCompanyId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('current_company_id')
    .eq('id', user.id)
    .single();

  if (error) throw new Error('Failed to fetch user profile');
  if (!profile?.current_company_id) throw new Error('No company assigned to user');

  return profile.current_company_id;
};
