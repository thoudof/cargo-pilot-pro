
import { z } from 'zod';
import { TripStatus } from '@/types';

// Контакт схема
export const contactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Имя обязательно'),
  phone: z.string().min(1, 'Телефон обязателен'),
  email: z.string().min(1, 'Email обязателен').email('Некорректный email'),
  position: z.string().optional()
});

// Контрагент схема
export const contractorSchema = z.object({
  id: z.string(),
  companyName: z.string().min(1, 'Название компании обязательно'),
  inn: z.string().min(10, 'ИНН должен содержать минимум 10 цифр').max(12, 'ИНН не может быть длиннее 12 цифр'),
  address: z.string().min(1, 'Адрес обязателен'),
  contacts: z.array(contactSchema).min(1, 'Добавьте хотя бы один контакт'),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Водитель схема
export const driverSchema = z.object({
  name: z.string().min(1, 'Имя водителя обязательно'),
  phone: z.string().min(1, 'Телефон водителя обязателен'),
  license: z.string().optional()
});

// Транспорт схема
export const vehicleSchema = z.object({
  brand: z.string().min(1, 'Марка обязательна'),
  model: z.string().min(1, 'Модель обязательна'),
  licensePlate: z.string().min(1, 'Номер автомобиля обязателен'),
  capacity: z.number().positive('Грузоподъемность должна быть положительной').optional()
});

// Груз схема
export const cargoSchema = z.object({
  description: z.string().min(1, 'Описание груза обязательно'),
  weight: z.number().positive('Вес должен быть положительным'),
  volume: z.number().positive('Объем должен быть положительным'),
  value: z.number().positive('Стоимость должна быть положительной').optional()
});

// Рейс схема
export const tripSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(TripStatus),
  departureDate: z.date(),
  arrivalDate: z.date().optional(),
  pointA: z.string().min(1, 'Пункт отправления обязателен'),
  pointB: z.string().min(1, 'Пункт назначения обязателен'),
  contractorId: z.string().min(1, 'Выберите контрагента'),
  driver: driverSchema,
  vehicle: vehicleSchema,
  cargo: cargoSchema,
  comments: z.string().optional(),
  documents: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  changeLog: z.array(z.any())
});

export type ContractorFormData = z.infer<typeof contractorSchema>;
export type TripFormData = z.infer<typeof tripSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
