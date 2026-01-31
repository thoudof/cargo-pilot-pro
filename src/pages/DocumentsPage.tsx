import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Search, Filter, Eye } from 'lucide-react';
import { documentTypeLabels, DocumentType } from '@/types/documents';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { PageHeader } from '@/components/Layout/PageHeader';
import { DocumentPreviewDialog } from '@/components/Documents/DocumentPreviewDialog';

interface TripDocumentWithTrip {
  id: string;
  file_name: string;
  document_type: DocumentType;
  file_url: string | null;
  file_size: number | null;
  created_at: string;
  trip_id: string;
  trips: {
    point_a: string;
    point_b: string;
    departure_date: string;
  };
}

export const DocumentsPage: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDocument, setPreviewDocument] = useState<TripDocumentWithTrip | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['trip-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_documents')
        .select(`
          id,
          file_name,
          document_type,
          file_url,
          file_size,
          created_at,
          trip_id,
          trips!inner (
            point_a,
            point_b,
            departure_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TripDocumentWithTrip[];
    },
  });

  const handleDownload = (document: TripDocumentWithTrip) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    } else {
      toast.error('Файл недоступен для скачивания');
    }
  };

  const canPreview = (fileName: string): boolean => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'pdf'].includes(ext);
  };

  const filteredDocuments = documents?.filter(doc => {
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    const matchesSearch = !searchTerm || 
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.trips.point_a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.trips.point_b.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} МБ`;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Документы" 
        description="Все загруженные документы рейсов"
      />

      {/* Фильтры */}
      <div className="card-elevated p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Фильтры</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Тип документа</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Поиск</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или маршруту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Список документов */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">Загрузка документов...</p>
          </div>
        </div>
      ) : filteredDocuments?.length === 0 ? (
        <div className="card-elevated p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Документы не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">
              Попробуйте изменить фильтры поиска
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredDocuments?.map((document) => (
            <div key={document.id} className="card-elevated card-interactive p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium truncate">{document.file_name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {documentTypeLabels[document.document_type]}
                      </Badge>
                    </div>
                    <div className="space-y-0.5 text-sm text-muted-foreground">
                      <p>{document.trips.point_a} → {document.trips.point_b}</p>
                      <p className="text-xs">
                        {format(new Date(document.trips.departure_date), 'dd MMM yyyy', { locale: ru })}
                        {document.file_size && ` • ${formatFileSize(document.file_size)}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canPreview(document.file_name) && document.file_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDocument(document)}
                    >
                      <Eye className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Просмотр</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(document)}
                    disabled={!document.file_url}
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Скачать</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentPreviewDialog
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
        document={previewDocument}
      />
    </div>
  );
};
