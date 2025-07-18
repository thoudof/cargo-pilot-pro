import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DocumentType, documentTypeLabels, TripDocument, RequiredDocument } from '@/types/documents';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripDocumentsProps {
  tripId: string;
}

export const TripDocuments: React.FC<TripDocumentsProps> = ({ tripId }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
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
      return (data || []).map(doc => ({
        id: doc.id,
        tripId: doc.trip_id,
        documentType: doc.document_type as DocumentType,
        documentName: doc.document_name,
        filePath: doc.file_path,
        fileUrl: doc.file_url,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        description: doc.description,
        isRequired: doc.is_required,
        uploadDate: doc.upload_date,
        uploadedBy: doc.uploaded_by,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        userId: doc.user_id
      })) as TripDocument[];
    }
  });

  // Загрузка обязательных документов
  const { data: requiredDocuments = [], isLoading: requiredLoading } = useQuery({
    queryKey: ['required-documents', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_required_documents_for_trip', { trip_uuid: tripId });

      if (error) throw error;
      return (data || []).map(doc => ({
        templateId: doc.template_id,
        templateName: doc.template_name,
        documentType: doc.document_type as DocumentType,
        isUploaded: doc.is_uploaded
      })) as RequiredDocument[];
    }
  });

  // Мутация для загрузки документа
  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: {
      documentType: DocumentType;
      documentName: string;
      description?: string;
      fileData?: { path: string; url: string; size: number; mimeType: string };
    }) => {
      const { data, error } = await supabase
        .from('trip_documents')
        .insert({
          trip_id: tripId,
          document_type: documentData.documentType,
          document_name: documentData.documentName,
          description: documentData.description,
          file_path: documentData.fileData?.path,
          file_url: documentData.fileData?.url,
          file_size: documentData.fileData?.size,
          mime_type: documentData.fileData?.mimeType,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-documents', tripId] });
      queryClient.invalidateQueries({ queryKey: ['required-documents', tripId] });
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
    }
  });

  // Мутация для удаления документа
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('trip_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-documents', tripId] });
      queryClient.invalidateQueries({ queryKey: ['required-documents', tripId] });
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
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!documentName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название документа",
        variant: "destructive"
      });
      return;
    }

    let fileData;
    if (selectedFile) {
      // Здесь можно добавить загрузку в Supabase Storage или Nextcloud
      // Пока добавляем документ без файла
      fileData = {
        path: `documents/${tripId}/${selectedFile.name}`,
        url: '#', // URL будет добавлен после интеграции с хранилищем
        size: selectedFile.size,
        mimeType: selectedFile.type
      };
    }

    uploadDocumentMutation.mutate({
      documentType,
      documentName,
      description,
      fileData
    });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDescription('');
    setDocumentType(DocumentType.OTHER);
  };

  const handleDownload = (document: TripDocument) => {
    if (document.fileUrl && document.fileUrl !== '#') {
      window.open(document.fileUrl, '_blank');
    } else {
      toast({
        title: "Файл недоступен",
        description: "Файл еще не загружен в систему хранения",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (document: TripDocument) => {
    if (document.fileUrl && document.fileUrl !== '#') {
      // Проверяем тип файла
      const fileExtension = document.fileUrl.split('.').pop()?.toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const pdfExtension = 'pdf';

      if (imageExtensions.includes(fileExtension || '') || fileExtension === pdfExtension) {
        // Открываем в новом окне для предварительного просмотра
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(`
            <html>
              <head>
                <title>Предварительный просмотр: ${document.documentName}</title>
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
                    <h2>${document.documentName}</h2>
                    <a href="${document.fileUrl}" class="download-btn" target="_blank">Скачать файл</a>
                  </div>
                  ${fileExtension === pdfExtension 
                    ? `<iframe src="${document.fileUrl}"></iframe>`
                    : `<img src="${document.fileUrl}" alt="${document.documentName}" />`
                  }
                </div>
              </body>
            </html>
          `);
          previewWindow.document.close();
        }
      } else {
        // Для других типов файлов просто скачиваем
        window.open(document.fileUrl, '_blank');
      }
    } else {
      toast({
        title: "Файл недоступен",
        description: "Файл еще не загружен в систему хранения",
        variant: "destructive"
      });
    }
  };

  const getDocumentStatusBadge = (doc: RequiredDocument) => {
    if (doc.isUploaded) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Загружен
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Требуется
      </Badge>
    );
  };

  if (documentsLoading || requiredLoading) {
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
      {/* Обязательные документы */}
      {requiredDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Обязательные документы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requiredDocuments.map((doc) => (
                <div key={doc.templateId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{doc.templateName}</span>
                    <p className="text-sm text-muted-foreground">
                      {documentTypeLabels[doc.documentType]}
                    </p>
                  </div>
                  {getDocumentStatusBadge(doc)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

                  <div>
                    <Label htmlFor="description">Описание (опционально)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Введите описание документа"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUpload} 
                      disabled={uploadDocumentMutation.isPending}
                      className="flex-1"
                    >
                      {uploadDocumentMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Загрузить
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
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
                        <h4 className="font-medium">{document.documentName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {documentTypeLabels[document.documentType]}
                          </Badge>
                          {document.isRequired && (
                            <Badge variant="secondary">Обязательный</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {document.fileUrl && document.fileUrl !== '#' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(document)}
                              title="Предварительный просмотр"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(document)}
                              title="Скачать файл"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDocumentMutation.mutate(document.id)}
                          disabled={deleteDocumentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {document.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {document.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Загружен: {format(new Date(document.uploadDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                      {document.fileSize && (
                        <span>
                          {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
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