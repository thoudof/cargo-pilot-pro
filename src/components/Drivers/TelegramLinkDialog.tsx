import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, RefreshCw, Check, ExternalLink, Unlink, MessageCircle } from 'lucide-react';
import { telegramService } from '@/services/telegramService';
import { toast } from 'sonner';

interface TelegramLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string;
  driverName: string;
  botUsername?: string; // Имя бота без @
}

export const TelegramLinkDialog: React.FC<TelegramLinkDialogProps> = ({
  open,
  onOpenChange,
  driverId,
  driverName,
  botUsername = 'YourTransportBot', // Замените на имя вашего бота
}) => {
  const [loading, setLoading] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      loadLinkStatus();
    }
  }, [open, driverId]);

  const loadLinkStatus = async () => {
    setLoading(true);
    try {
      const status = await telegramService.getLinkCode(driverId);
      setLinkCode(status.code);
      setExpiresAt(status.expiresAt);
      setIsLinked(status.isLinked);
    } catch (error) {
      console.error('Failed to load link status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const code = await telegramService.generateLinkCode(driverId);
      setLinkCode(code);
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      setExpiresAt(expires);
      toast.success('Код сгенерирован');
    } catch (error) {
      toast.error('Не удалось сгенерировать код');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    try {
      await telegramService.unlinkDriver(driverId);
      setIsLinked(false);
      setLinkCode(null);
      setExpiresAt(null);
      toast.success('Telegram отвязан');
    } catch (error) {
      toast.error('Не удалось отвязать Telegram');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Скопировано в буфер обмена');
  };

  const botLink = linkCode ? telegramService.getBotLink(botUsername, linkCode) : null;

  const isCodeExpired = expiresAt && new Date() > expiresAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            Подключение Telegram
          </DialogTitle>
          <DialogDescription>
            Водитель: {driverName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isLinked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-700 dark:text-green-400 font-medium">
                Telegram подключён
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Водитель получает уведомления о назначенных рейсах в Telegram.
            </p>

            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700"
              onClick={handleUnlink}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Отвязать Telegram
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {linkCode && !isCodeExpired ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Код подключения</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-lg text-center text-2xl font-mono tracking-wider">
                      {linkCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(linkCode)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Действителен до: {expiresAt.toLocaleString('ru-RU')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Или откройте ссылку</label>
                  {botLink && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(botLink, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть в Telegram
                    </Button>
                  )}
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  <p className="font-medium">Инструкция для водителя:</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    <li>Откройте бота @{botUsername} в Telegram</li>
                    <li>Отправьте команду: <code>/link {linkCode}</code></li>
                    <li>Или нажмите кнопку выше</li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                {isCodeExpired && (
                  <Badge variant="secondary" className="mb-2">
                    Код истёк
                  </Badge>
                )}
                <p className="text-muted-foreground">
                  Сгенерируйте код для подключения водителя к Telegram-боту
                </p>
                <Button onClick={handleGenerateCode}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сгенерировать код
                </Button>
              </div>
            )}

            {linkCode && !isCodeExpired && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleGenerateCode}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Сгенерировать новый код
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};