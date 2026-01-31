import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  Eye,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripDocumentsProps {
  tripId: string;
}

type DocumentType = 'waybill' | 'invoice' | 'act' | 'contract' | 'power_of_attorney' | 'other';

const documentTypeLabels: Record<DocumentType, string> = {
  waybill: 'Путевой лист',
  invoice: 'Счёт-фактура',
  act: 'Акт',
  contract: 'Договор',
  power_of_attorney: 'Доверенность',
  other: 'Другое'
};

interface TripDocument {
  id: string;
  trip_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export const TripDocuments: React.FC<TripDocumentsProps> = ({ tripId }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [documentName, setDocumentName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загрузка документов рейса
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['trip-documents', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TripDocument[];
    }
  });

  // Функция загрузки файла в Storage
  const uploadFileToStorage = async (file: File): Promise<{ path: string; url: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${tripId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  };

  // Мутация для загрузки документа
  const uploadDocumentMutation = useMutation({
    mutationFn: async (params: {
      file: File;
      documentType: DocumentType;
      fileName: string;
    }) => {
      setIsUploading(true);
      setUploadProgress(10);

      // Загружаем файл в Storage
      const { url } = await uploadFileToStorage(params.file);
      setUploadProgress(70);

      // Сохраняем метаданные в БД
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('trip_documents')
        .insert({
          trip_id: tripId,
          document_type: params.documentType,
          file_name: params.fileName,
          file_url: url,
          file_size: params.file.size,
          uploaded_by: userData.user?.id || null,
        })
        .select()
        .single();

      setUploadProgress(100);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-documents', tripId] });
      setIsUploadDialogOpen(false);
      resetForm();
      toast({
        title: "Документ загружен",
        description: "Документ успешно добавлен к рейсу"
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  // Мутация для удаления документа
  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: TripDocument) => {
      // Удаляем файл из Storage, если есть URL
      if (document.file_url) {
        // Извлекаем путь из URL
        const urlParts = document.file_url.split('/documents/');
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1]);
          await supabase.storage
            .from('documents')
            .remove([filePath]);
        }
      }

      // Удаляем запись из БД
      const { error } = await supabase
        .from('trip_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-documents', tripId] });
      toast({
        title: "Документ удален",
        description: "Документ успешно удален"
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверка размера файла (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: "Максимальный размер файла: 50 МБ",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Ошибка",
        description: "Выберите файл для загрузки",
        variant: "destructive"
      });
      return;
    }

    if (!documentName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название документа",
        variant: "destructive"
      });
      return;
    }

    uploadDocumentMutation.mutate({
      file: selectedFile,
      documentType,
      fileName: documentName,
    });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDocumentType('other');
    setUploadProgress(0);
  };

  const handleDownload = (document: TripDocument) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    } else {
      toast({
        title: "Файл недоступен",
        description: "Файл еще не загружен в систему хранения",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (document: TripDocument) => {
    if (document.file_url) {
      const fileExtension = document.file_url.split('.').pop()?.toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const pdfExtension = 'pdf';

      if (imageExtensions.includes(fileExtension || '') || fileExtension === pdfExtension) {
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(`
            <html>
              <head>
                <title>Предварительный просмотр: ${document.file_name}</title>
                <style>
                  body { margin: 0; padding: 20px; font-family: system-ui; background: #f5f5f5; }
                  .container { max-width: 100%; text-align: center; }
                  img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                  iframe { width: 100%; height: calc(100vh - 100px); border: none; border-radius: 8px; }
                  .header { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                  .download-btn { background: #2563eb; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>${document.file_name}</h2>
                    <a href="${document.file_url}" class="download-btn" target="_blank">Скачать файл</a>
                  </div>
                  ${fileExtension === pdfExtension 
                    ? `<iframe src="${document.file_url}"></iframe>`
                    : `<img src="${document.file_url}" alt="${document.file_name}" />`
                  }
                </div>
              </body>
            </html>
          `);
          previewWindow.document.close();
        }
      } else {
        window.open(document.file_url, '_blank');
      }
    } else {
      toast({
        title: "Файл недоступен",
        description: "Файл еще не загружен в систему хранения",
        variant: "destructive"
      });
    }
  };

  if (documentsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Все документы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Документы рейса ({documents.length})
            </span>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить документ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Добавить документ</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="document-name">Название документа</Label>
                    <Input
                      id="document-name"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Введите название документа"
                    />
                  </div>

                  <div>
                    <Label htmlFor="document-type">Тип документа</Label>
                    <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
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

                  <div>
                    <Label htmlFor="file-upload">Файл</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Загрузка файла...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUpload} 
                      disabled={isUploading || !selectedFile}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Загрузить
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsUploadDialogOpen(false)}
                      disabled={isUploading}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Документы пока не добавлены</p>
              <p className="text-sm text-muted-foreground">
                Нажмите "Добавить документ" чтобы загрузить файлы
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {documents.map((document) => (
                  <div key={document.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{document.file_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {documentTypeLabels[document.document_type]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {document.file_url && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(document)}
                              title="Предварительный просмотр"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(document)}
                              title="Скачать"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocumentMutation.mutate(document)}
                          disabled={deleteDocumentMutation.isPending}
                          className="text-destructive hover:text-destructive"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {document.file_size && (
                        <span className="mr-4">
                          Размер: {(document.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                      <span>
                        Загружен: {format(new Date(document.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                    </div>
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
