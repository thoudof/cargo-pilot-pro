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
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, Edit, Trash2, Save, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { documentTypeLabels } from '@/types/documents';

type DocumentType = 'waybill' | 'invoice' | 'act' | 'contract' | 'power_of_attorney' | 'other';

interface DocumentTemplate {
  id: string;
  name: string;
  documentType: DocumentType;
  content: string | null;
  isActive: boolean;
  createdAt: string;
}

export const DocumentTemplatesManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    documentType: 'other' as DocumentType,
    isActive: true,
    content: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        content: template.content,
        isActive: template.is_active,
        createdAt: template.created_at
      })) as DocumentTemplate[];
    }
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: {
      id?: string;
      name: string;
      documentType: DocumentType;
      isActive: boolean;
      content?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Пользователь не авторизован');

      if (templateData.id) {
        const { error } = await supabase
          .from('document_templates')
          .update({
            name: templateData.name,
            document_type: templateData.documentType as any,
            is_active: templateData.isActive,
            content: templateData.content
          })
          .eq('id', templateData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('document_templates')
          .insert({
            name: templateData.name,
            document_type: templateData.documentType as any,
            is_active: templateData.isActive,
            content: templateData.content,
            created_by: user.data.user.id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({ title: "Шаблон сохранен" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from('document_templates').delete().eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: "Шаблон удален" });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', documentType: 'other', isActive: true, content: '' });
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      documentType: template.documentType,
      isActive: template.isActive,
      content: template.content || ''
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: "Ошибка", description: "Введите название", variant: "destructive" });
      return;
    }
    saveTemplateMutation.mutate({
      id: editingTemplate?.id,
      name: formData.name,
      documentType: formData.documentType,
      isActive: formData.isActive,
      content: formData.content
    });
  };

  if (isLoading) {
    return <Card><CardContent className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><FileText className="h-5 w-5" />Шаблоны документов ({templates.length})</span>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Добавить</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingTemplate ? 'Редактировать' : 'Создать'} шаблон</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Название</Label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div>
                <div><Label>Тип</Label>
                  <Select value={formData.documentType} onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value as DocumentType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))} />
                  <Label>Активен</Label>
                </div>
                <div><Label>Содержимое</Label><Textarea value={formData.content} onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))} rows={3} /></div>
                <Button onClick={handleSave} disabled={saveTemplateMutation.isPending} className="w-full"><Save className="h-4 w-4 mr-2" />Сохранить</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Шаблоны не созданы</div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{documentTypeLabels[template.documentType]}</Badge>
                      {template.isActive && <Badge variant="secondary">Активен</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { handleEdit(template); setIsCreateDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => deleteTemplateMutation.mutate(template.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
