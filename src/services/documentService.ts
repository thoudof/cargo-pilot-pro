import { supabase } from '@/integrations/supabase/client';
import { DocumentType, TripDocument, DocumentTemplate, RequiredDocument } from '@/types/documents';

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
    }));
  }

  // Получение обязательных документов для рейса
  async getRequiredDocuments(tripId: string): Promise<RequiredDocument[]> {
    const { data, error } = await supabase
      .rpc('get_required_documents_for_trip', { trip_uuid: tripId });

    if (error) throw error;

    return (data || []).map(doc => ({
      templateId: doc.template_id,
      templateName: doc.template_name,
      documentType: doc.document_type as DocumentType,
      isUploaded: doc.is_uploaded
    }));
  }

  // Создание документа
  async createDocument(data: {
    tripId: string;
    documentType: DocumentType;
    documentName: string;
    description?: string;
    filePath?: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
    isRequired?: boolean;
  }): Promise<TripDocument> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Пользователь не авторизован');

    const { data: result, error } = await supabase
      .from('trip_documents')
      .insert({
        trip_id: data.tripId,
        document_type: data.documentType,
        document_name: data.documentName,
        description: data.description,
        file_path: data.filePath,
        file_url: data.fileUrl,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        is_required: data.isRequired || false,
        uploaded_by: user.data.user.id,
        user_id: user.data.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      tripId: result.trip_id,
      documentType: result.document_type as DocumentType,
      documentName: result.document_name,
      filePath: result.file_path,
      fileUrl: result.file_url,
      fileSize: result.file_size,
      mimeType: result.mime_type,
      description: result.description,
      isRequired: result.is_required,
      uploadDate: result.upload_date,
      uploadedBy: result.uploaded_by,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      userId: result.user_id
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
      isRequired: template.is_required,
      description: template.description,
      userId: template.user_id,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }));
  }

  // Создание шаблона документа
  async createDocumentTemplate(data: {
    name: string;
    documentType: DocumentType;
    isRequired: boolean;
    description?: string;
  }): Promise<DocumentTemplate> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Пользователь не авторизован');

    const { data: result, error } = await supabase
      .from('document_templates')
      .insert({
        name: data.name,
        document_type: data.documentType,
        is_required: data.isRequired,
        description: data.description,
        user_id: user.data.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      name: result.name,
      documentType: result.document_type as DocumentType,
      isRequired: result.is_required,
      description: result.description,
      userId: result.user_id,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  // Обновление шаблона документа
  async updateDocumentTemplate(id: string, data: {
    name: string;
    documentType: DocumentType;
    isRequired: boolean;
    description?: string;
  }): Promise<DocumentTemplate> {
    const { data: result, error } = await supabase
      .from('document_templates')
      .update({
        name: data.name,
        document_type: data.documentType,
        is_required: data.isRequired,
        description: data.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      name: result.name,
      documentType: result.document_type as DocumentType,
      isRequired: result.is_required,
      description: result.description,
      userId: result.user_id,
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

  // Проверка статуса документов рейса
  async getTripDocumentStatus(tripId: string): Promise<{
    totalRequired: number;
    uploaded: number;
    missing: string[];
  }> {
    const requiredDocs = await this.getRequiredDocuments(tripId);
    const totalRequired = requiredDocs.length;
    const uploaded = requiredDocs.filter(doc => doc.isUploaded).length;
    const missing = requiredDocs
      .filter(doc => !doc.isUploaded)
      .map(doc => doc.templateName);

    return {
      totalRequired,
      uploaded,
      missing
    };
  }

  // Интеграция с Nextcloud (заглушка для будущей реализации)
  async uploadToNextcloud(file: File, path: string): Promise<string> {
    // TODO: Реализовать загрузку в Nextcloud
    // Пока возвращаем заглушку
    console.log('Загрузка в Nextcloud:', file.name, path);
    return `https://nextcloud.example.com/remote.php/dav/files/user/${path}/${file.name}`;
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