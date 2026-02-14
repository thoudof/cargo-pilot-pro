import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Company {
  id: string;
  name: string;
  inn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
}

const fetchCurrentCompanyId = async (userId: string | undefined): Promise<string | null> => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('current_company_id')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching current company:', error);
    return null;
  }
  return data?.current_company_id || null;
};

const fetchCompanies = async (userId: string | undefined): Promise<Company[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('companies')
    .select('*');
  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
  return (data || []) as Company[];
};

export const useCompany = () => {
  const { user } = useAuth();

  const { data: currentCompanyId, isLoading: companyLoading } = useQuery({
    queryKey: ['current-company', user?.id],
    queryFn: () => fetchCurrentCompanyId(user?.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: companies } = useQuery({
    queryKey: ['user-companies', user?.id],
    queryFn: () => fetchCompanies(user?.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const switchCompany = async (companyId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ current_company_id: companyId })
      .eq('id', user.id);
    if (error) {
      console.error('Error switching company:', error);
      throw error;
    }
  };

  return {
    currentCompanyId,
    companies: companies || [],
    companyLoading,
    switchCompany,
  };
};
