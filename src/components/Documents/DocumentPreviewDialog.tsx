import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { documentTypeLabels, DocumentType } from '@/types/documents';

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    file_name: string;
    file_url: string | null;
    document_type: DocumentType;
  } | null;
}

const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

const isImage = (fileName: string): boolean => {
  const ext = getFileExtension(fileName);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
};

const isPdf = (fileName: string): boolean => {
  return getFileExtension(fileName) === 'pdf';
};

export const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  open,
  onOpenChange,
  document,
}) => {
  if (!document) return null;

  const canPreview = document.file_url && (isImage(document.file_name) || isPdf(document.file_name));
  const isImageFile = isImage(document.file_name);
  const isPdfFile = isPdf(document.file_name);

  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-3 min-w-0">
              <DialogTitle className="truncate">{document.file_name}</DialogTitle>
              <Badge variant="secondary" className="flex-shrink-0">
                {documentTypeLabels[document.document_type]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!document.file_url}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                disabled={!document.file_url}
              >
                <Download className="h-4 w-4 mr-2" />
                Скачать
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 mt-4 rounded-lg overflow-hidden bg-muted/30 border">
          {!document.file_url ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p>Файл недоступен для предпросмотра</p>
            </div>
          ) : isImageFile ? (
            <div className="flex items-center justify-center h-full min-h-[400px] p-4">
              <img
                src={document.file_url}
                alt={document.file_name}
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
            </div>
          ) : isPdfFile ? (
            <iframe
              src={`${document.file_url}#toolbar=1&navpanes=0`}
              title={document.file_name}
              className="w-full h-[60vh] border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p className="mb-2">Предпросмотр недоступен для этого типа файла</p>
              <p className="text-sm">Нажмите "Скачать" для просмотра файла</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
