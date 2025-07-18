export enum DocumentType {
  ACT = 'act',
  INVOICE = 'invoice', 
  RECEIPT = 'receipt',
  CONTRACT = 'contract',
  TRANSPORT_WAYBILL = 'transport_waybill',
  CUSTOMS_DECLARATION = 'customs_declaration',
  INSURANCE = 'insurance',
  CERTIFICATE = 'certificate',
  PERMIT = 'permit',
  OTHER = 'other'
}

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.ACT]: 'Акт',
  [DocumentType.INVOICE]: 'Счет',
  [DocumentType.RECEIPT]: 'Квитанция',
  [DocumentType.CONTRACT]: 'Договор',
  [DocumentType.TRANSPORT_WAYBILL]: 'Товарно-транспортная накладная',
  [DocumentType.CUSTOMS_DECLARATION]: 'Таможенная декларация',
  [DocumentType.INSURANCE]: 'Страховые документы',
  [DocumentType.CERTIFICATE]: 'Сертификат',
  [DocumentType.PERMIT]: 'Разрешение',
  [DocumentType.OTHER]: 'Прочее'
};

export interface TripDocument {
  id: string;
  tripId: string;
  documentType: DocumentType;
  documentName: string;
  filePath?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  isRequired: boolean;
  uploadDate: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  documentType: DocumentType;
  isRequired: boolean;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequiredDocument {
  templateId: string;
  templateName: string;
  documentType: DocumentType;
  isUploaded: boolean;
}