# Система прав пользователей

## Обзор системы

В приложении реализована двухуровневая система прав доступа:
1. **Роли пользователей** - базовые наборы прав
2. **Индивидуальные права** - дополнительные права для конкретных пользователей

## Роли пользователей

### Администратор (admin)
**Полный доступ ко всем функциям системы:**

- `view_trips` - Просмотр рейсов
- `edit_trips` - Редактирование рейсов
- `view_contractors` - Просмотр контрагентов
- `edit_contractors` - Редактирование контрагентов
- `view_drivers` - Просмотр водителей
- `edit_drivers` - Редактирование водителей
- `view_vehicles` - Просмотр транспорта
- `edit_vehicles` - Редактирование транспорта
- `view_routes` - Просмотр маршрутов
- `edit_routes` - Редактирование маршрутов
- `view_cargo_types` - Просмотр типов грузов
- `edit_cargo_types` - Редактирование типов грузов
- `view_documents` - Просмотр документов
- `edit_documents` - Редактирование документов
- `manage_document_templates` - Управление шаблонами документов
- `delete_documents` - Удаление документов
- `view_expenses` - Просмотр расходов
- `edit_expenses` - Редактирование расходов
- `delete_expenses` - Удаление расходов
- `view_reports` - Просмотр отчетов
- `view_admin_panel` - Доступ к админ-панели
- `view_finances` - Просмотр финансов
- `view_statistics` - Просмотр статистики
- `view_analytics` - Просмотр аналитики
- `manage_users` - Управление пользователями
- `manage_system` - Управление системой
- `export_data` - Экспорт данных

### Диспетчер (dispatcher)
**Управление логистикой и операциями:**

- `view_trips` - Просмотр рейсов
- `edit_trips` - Редактирование рейсов
- `view_contractors` - Просмотр контрагентов
- `edit_contractors` - Редактирование контрагентов
- `view_drivers` - Просмотр водителей
- `edit_drivers` - Редактирование водителей
- `view_vehicles` - Просмотр транспорта
- `edit_vehicles` - Редактирование транспорта
- `view_routes` - Просмотр маршрутов
- `edit_routes` - Редактирование маршрутов
- `view_cargo_types` - Просмотр типов грузов
- `edit_cargo_types` - Редактирование типов грузов
- `view_documents` - Просмотр документов
- `edit_documents` - Редактирование документов
- `view_expenses` - Просмотр расходов
- `edit_expenses` - Редактирование расходов
- `view_reports` - Просмотр отчетов
- `view_finances` - Просмотр финансов
- `view_statistics` - Просмотр статистики
- `view_analytics` - Просмотр аналитики
- `export_data` - Экспорт данных

### Водитель (driver)
**Ограниченный доступ для выполнения рейсов:**

- `view_trips` - Просмотр рейсов (только назначенных)
- `view_documents` - Просмотр документов рейсов
- `edit_documents` - Добавление документов к рейсам
- `view_expenses` - Просмотр расходов рейсов

## Индивидуальные права

Администраторы могут назначать дополнительные права отдельным пользователям через админ-панель:

1. **Временные права** - с указанием срока действия
2. **Постоянные права** - без срока действия

### Управление правами

**Добавление права:**
- Выберите пользователя
- Выберите право из списка
- Укажите срок действия (опционально)
- Нажмите "Добавить право"

**Удаление права:**
- В списке прав пользователя нажмите кнопку удаления

## Проверка прав в коде

```typescript
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// Проверка через функцию БД
const checkPermission = async (permission: string) => {
  const { data } = await supabase.rpc('has_permission', {
    _user_id: user?.id,
    _permission: permission
  });
  return data;
};

// Проверка роли
const checkRole = async (role: string) => {
  const { data } = await supabase.rpc('has_role', {
    _user_id: user?.id,
    _role: role
  });
  return data;
};
```

## Безопасность

- Все права проверяются на уровне базы данных через RLS политики
- Функции проверки прав используют `SECURITY DEFINER` для корректной работы
- Индивидуальные права имеют приоритет над ролевыми
- Истекшие права автоматически игнорируются

## Добавление новых прав

1. Добавьте новое значение в enum `app_permission`:
```sql
ALTER TYPE public.app_permission ADD VALUE 'new_permission';
```

2. Добавьте право в соответствующие роли:
```sql
INSERT INTO public.role_permissions (role, permission) VALUES 
('admin', 'new_permission');
```

3. Обновите список прав в `UserPermissionsManager.tsx`

4. Добавьте проверки прав в соответствующие компоненты