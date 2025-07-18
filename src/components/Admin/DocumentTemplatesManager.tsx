import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DocumentType, documentTypeLabels, DocumentTemplate } from '@/types/documents';
import { DocumentsOverview } from './DocumentsOverview';

export const DocumentTemplatesManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    documentType: DocumentType.OTHER,
    isRequired: false,
    description: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загрузка шаблонов документов
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(template => ({
        id: template.id,
        name: template.name,
        documentType: template.document_type as DocumentType,
        isRequired: template.is_required,
        description: template.description,
        userId: template.user_id,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      })) as DocumentTemplate[];
    }
  });

  // Мутация для создания/обновления шаблона
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: {
      id?: string;
      name: string;
      documentType: DocumentType;
      isRequired: boolean;
      description?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Пользователь не авторизован');

      if (templateData.id) {
        // Обновление
        const { data, error } = await supabase
          .from('document_templates')
          .update({
            name: templateData.name,
            document_type: templateData.documentType,
            is_required: templateData.isRequired,
            description: templateData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateData.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Создание
        const { data, error } = await supabase
          .from('document_templates')
          .insert({
            name: templateData.name,
            document_type: templateData.documentType,
            is_required: templateData.isRequired,
            description: templateData.description,
            user_id: user.data.user.id
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({
        title: "Шаблон сохранен",
        description: "Шаблон документа успешно сохранен"
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка сохранения",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Мутация для удаления шаблона
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({
        title: "Шаблон удален",
        description: "Шаблон документа успешно удален"
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      documentType: DocumentType.OTHER,
      isRequired: false,
      description: ''
    });
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      documentType: template.documentType,
      isRequired: template.isRequired,
      description: template.description || ''
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название шаблона",
        variant: "destructive"
      });
      return;
    }

    saveTemplateMutation.mutate({
      id: editingTemplate?.id,
      name: formData.name,
      documentType: formData.documentType,
      isRequired: formData.isRequired,
      description: formData.description
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Статистика документов */}
        <DocumentsOverview />
        
        {/* Управление шаблонами */}
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика документов */}
      <DocumentsOverview />
      
      {/* Управление шаблонами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Шаблоны документов ({templates.length})
            </span>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить шаблон
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Название шаблона</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Введите название шаблона"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-type">Тип документа</Label>
                    <Select 
                      value={formData.documentType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value as DocumentType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(documentTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-required"
                      checked={formData.isRequired}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked }))}
                    />
                    <Label htmlFor="is-required">Обязательный документ</Label>
                  </div>

                  <div>
                    <Label htmlFor="template-description">Описание (опционально)</Label>
                    <Textarea
                      id="template-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Введите описание шаблона"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={saveTemplateMutation.isPending}
                      className="flex-1"
                    >
                      {saveTemplateMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Сохранить
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}>
                      Отмена
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Шаблоны документов не созданы</p>
              <p className="text-sm text-muted-foreground">
                Создайте шаблоны для обязательных документов рейсов
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {documentTypeLabels[template.documentType]}
                          </Badge>
                          {template.isRequired && (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Обязательный
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleEdit(template);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          disabled={deleteTemplateMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {template.description && (
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};