import { supabase } from '@/integrations/supabase/client';

export enum DocumentType {
  WAYBILL = 'waybill',
  INVOICE = 'invoice',
  ACT = 'act',
  CONTRACT = 'contract',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  OTHER = 'other'
}

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.WAYBILL]: 'Путевой лист',
  [DocumentType.INVOICE]: 'Счёт-фактура',
  [DocumentType.ACT]: 'Акт',
  [DocumentType.CONTRACT]: 'Договор',
  [DocumentType.POWER_OF_ATTORNEY]: 'Доверенность',
  [DocumentType.OTHER]: 'Другое'
};

export interface TripDocument {
  id: string;
  tripId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string | null;
  fileSize: number | null;
  uploadedBy: string | null;
  createdAt: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  documentType: DocumentType;
  content: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequiredDocument {
  templateId: string;
  templateName: string;
  documentType: DocumentType;
  isUploaded: boolean;
}

class DocumentService {
  // Получение документов рейса
  async getTripDocuments(tripId: string): Promise<TripDocument[]> {
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
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      fileSize: doc.file_size,
      uploadedBy: doc.uploaded_by,
      createdAt: doc.created_at
    }));
  }

  // Создание документа
  async createDocument(data: {
    tripId: string;
    documentType: DocumentType;
    fileName: string;
    fileUrl?: string;
    fileSize?: number;
  }): Promise<TripDocument> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Пользователь не авторизован');

    const { data: result, error } = await supabase
      .from('trip_documents')
      .insert({
        trip_id: data.tripId,
        document_type: data.documentType,
        file_name: data.fileName,
        file_url: data.fileUrl || null,
        file_size: data.fileSize || null,
        uploaded_by: user.data.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      tripId: result.trip_id,
      documentType: result.document_type as DocumentType,
      fileName: result.file_name,
      fileUrl: result.file_url,
      fileSize: result.file_size,
      uploadedBy: result.uploaded_by,
      createdAt: result.created_at
    };
  }

  // Удаление документа
  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('trip_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  }

  // Получение шаблонов документов
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
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
      createdBy: template.created_by,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }));
  }

  // Создание шаблона документа
  async createDocumentTemplate(data: {
    name: string;
    documentType: DocumentType;
    content?: string;
    isActive?: boolean;
  }): Promise<DocumentTemplate> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Пользователь не авторизован');

    const { data: result, error } = await supabase
      .from('document_templates')
      .insert({
        name: data.name,
        document_type: data.documentType,
        content: data.content || null,
        is_active: data.isActive ?? true,
        created_by: user.data.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      name: result.name,
      documentType: result.document_type as DocumentType,
      content: result.content,
      isActive: result.is_active,
      createdBy: result.created_by,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  // Обновление шаблона документа
  async updateDocumentTemplate(id: string, data: {
    name: string;
    documentType: DocumentType;
    content?: string;
    isActive?: boolean;
  }): Promise<DocumentTemplate> {
    const { data: result, error } = await supabase
      .from('document_templates')
      .update({
        name: data.name,
        document_type: data.documentType,
        content: data.content,
        is_active: data.isActive
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      name: result.name,
      documentType: result.document_type as DocumentType,
      content: result.content,
      isActive: result.is_active,
      createdBy: result.created_by,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  // Удаление шаблона документа
  async deleteDocumentTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('document_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Интеграция с Supabase Storage
  async uploadToSupabaseStorage(file: File, path: string): Promise<{
    path: string;
    url: string;
  }> {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  }
}

export const documentService = new DocumentService();
