
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Edit2, Trash2 } from 'lucide-react';
import { Contractor } from '@/types';
import { db } from '@/services/database';
import { ContractorForm } from './ContractorForm';
import { useToast } from '@/hooks/use-toast';

export const ContractorList: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    try {
      const data = await db.getContractors();
      setContractors(data);
    } catch (error) {
      console.error('Failed to load contractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContractor = () => {
    setEditingContractor(undefined);
    setFormOpen(true);
  };

  const handleEditContractor = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setFormOpen(true);
  };

  const handleDeleteContractor = async (contractor: Contractor) => {
    try {
      await db.deleteContractor(contractor.id);
      await loadContractors();
      toast({
        title: 'Контрагент удален',
        description: `${contractor.companyName} успешно удален`
      });
    } catch (error) {
      console.error('Failed to delete contractor:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить контрагента',
        variant: 'destructive'
      });
    }
  };

  const handleFormSuccess = () => {
    loadContractors();
  };

  const filteredContractors = contractors.filter(contractor =>
    contractor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.inn.includes(searchTerm) ||
    contractor.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск контрагентов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12"
          />
        </div>
        <Button onClick={handleAddContractor} className="h-12 px-6">
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {filteredContractors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет контрагентов</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Не найдено контрагентов по заданным критериям' : 'Добавьте первого контрагента для начала работы'}
            </p>
            {!searchTerm && (
              <Button onClick={handleAddContractor}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить контрагента
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredContractors.map((contractor) => (
            <Card key={contractor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{contractor.companyName}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>ИНН: {contractor.inn}</p>
                      <p>{contractor.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {contractor.contacts.length} контакт{contractor.contacts.length === 1 ? '' : contractor.contacts.length < 5 ? 'а' : 'ов'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditContractor(contractor)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContractor(contractor)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {contractor.contacts.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {contractor.contacts.slice(0, 2).map((contact, index) => (
                      <div key={contact.id} className="text-sm">
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-muted-foreground"> • {contact.phone}</span>
                      </div>
                    ))}
                    {contractor.contacts.length > 2 && (
                      <p className="text-sm text-muted-foreground">
                        +{contractor.contacts.length - 2} контакт{contractor.contacts.length - 2 === 1 ? '' : contractor.contacts.length - 2 < 5 ? 'а' : 'ов'}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <ContractorForm
        contractor={editingContractor}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};
