-- Добавляем недостающие права для администратора, если их нет
INSERT INTO public.role_permissions (role, permission) VALUES 
('admin', 'view_admin_panel'),
('admin', 'manage_users'),
('admin', 'view_statistics'),
('admin', 'view_finances')
ON CONFLICT (role, permission) DO NOTHING;

-- Также добавим права для диспетчера на основные функции
INSERT INTO public.role_permissions (role, permission) VALUES 
('dispatcher', 'view_trips'),
('dispatcher', 'edit_trips'),
('dispatcher', 'view_contractors'),
('dispatcher', 'edit_contractors'),
('dispatcher', 'view_drivers'),
('dispatcher', 'edit_drivers'),
('dispatcher', 'view_vehicles'),
('dispatcher', 'edit_vehicles'),
('dispatcher', 'view_routes'),
('dispatcher', 'edit_routes'),
('dispatcher', 'view_cargo_types'),
('dispatcher', 'edit_cargo_types'),
('dispatcher', 'view_reports'),
('dispatcher', 'view_finances'),
('dispatcher', 'view_statistics')
ON CONFLICT (role, permission) DO NOTHING;