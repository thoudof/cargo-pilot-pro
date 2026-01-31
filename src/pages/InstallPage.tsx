import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  Share, 
  MoreVertical, 
  Plus, 
  Check,
  Apple,
  Wifi,
  Bell,
  Zap
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Определяем платформу
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Проверяем, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Ловим событие beforeinstallprompt для Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: 'Быстрый доступ', description: 'Запускайте приложение одним касанием с домашнего экрана' },
    { icon: Wifi, title: 'Работа офлайн', description: 'Доступ к основным функциям без интернета' },
    { icon: Bell, title: 'Push-уведомления', description: 'Получайте уведомления о новых рейсах и изменениях статусов' },
    { icon: Smartphone, title: 'Нативный опыт', description: 'Полноэкранный режим без адресной строки браузера' },
  ];

  if (isInstalled) {
    return (
      <div className="space-y-4 p-4">
        <PageHeader 
          title="Установка приложения" 
          icon={<Download className="h-5 w-5 text-primary" />}
        />
        
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Приложение установлено!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Вы используете приложение в режиме PWA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <PageHeader 
        title="Установка приложения" 
        description="Установите приложение для быстрого доступа"
        icon={<Download className="h-5 w-5 text-primary" />}
      />

      {/* Кнопка быстрой установки для Android */}
      {deferredPrompt && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <Button size="lg" onClick={handleInstallClick} className="gap-2">
                <Download className="h-5 w-5" />
                Установить приложение
              </Button>
              <p className="text-sm text-muted-foreground">
                Нажмите для быстрой установки
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Преимущества PWA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Преимущества установки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Инструкции для iOS */}
      <Card className={isIOS ? 'ring-2 ring-primary' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Apple className="h-5 w-5" />
              Установка на iPhone/iPad
            </CardTitle>
            {isIOS && <Badge>Ваше устройство</Badge>}
          </div>
          <CardDescription>Safari браузер</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Откройте это приложение в Safari</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Важно: установка работает только в Safari, не в Chrome или других браузерах
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Нажмите кнопку "Поделиться"</p>
                <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-lg">
                  <Share className="h-5 w-5 text-blue-500" />
                  <span className="text-xs">Квадрат со стрелкой внизу экрана</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Выберите "На экран «Домой»"</p>
                <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-lg">
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">Прокрутите меню и найдите эту опцию</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Нажмите "Добавить"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Иконка приложения появится на домашнем экране
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Для push-уведомлений:</strong> После установки откройте приложение с домашнего экрана и включите уведомления в настройках
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Инструкции для Android */}
      <Card className={isAndroid && !deferredPrompt ? 'ring-2 ring-primary' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Установка на Android
            </CardTitle>
            {isAndroid && <Badge>Ваше устройство</Badge>}
          </div>
          <CardDescription>Chrome браузер</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Откройте это приложение в Chrome</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Рекомендуется использовать Google Chrome для лучшей совместимости
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Нажмите меню (три точки)</p>
                <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-lg">
                  <MoreVertical className="h-5 w-5" />
                  <span className="text-xs">В правом верхнем углу браузера</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Выберите "Установить приложение"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Или "Добавить на главный экран" в некоторых версиях
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Подтвердите установку</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Приложение будет установлено и появится среди других приложений
                </p>
              </div>
            </div>
          </div>

          {deferredPrompt && (
            <Button onClick={handleInstallClick} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Установить сейчас
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Инструкции для Desktop */}
      {!isIOS && !isAndroid && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Установка на компьютер</CardTitle>
            <CardDescription>Chrome, Edge, Opera</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <p className="text-sm">В адресной строке нажмите на иконку установки</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <p className="text-sm">Подтвердите установку в появившемся диалоге</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InstallPage;
