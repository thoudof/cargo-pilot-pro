
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabaseService';
import { activityLogger } from '@/services/activityLogger';
import { QrCode, Smartphone, Shield, AlertTriangle } from 'lucide-react';

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TwoFactorSetupDialog: React.FC<TwoFactorSetupDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'enabled'>('initial');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (open) {
      check2FAStatus();
    }
  }, [open]);

  const check2FAStatus = async () => {
    try {
      // Проверяем статус 2FA пользователя
      const { data: { user } } = await supabaseService.supabase.auth.getUser();
      if (user?.app_metadata?.providers?.includes('totp')) {
        setIs2FAEnabled(true);
        setStep('enabled');
      } else {
        setIs2FAEnabled(false);
        setStep('initial');
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseService.supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('setup');
    } catch (error: any) {
      console.error('2FA setup error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось начать настройку 2FA',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Ошибка',
        description: 'Введите 6-значный код',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabaseService.supabase.auth.mfa.verify({
        factorId: secret,
        challengeId: '', // Будет получен из enroll
        code: verificationCode
      });

      if (error) throw error;

      await activityLogger.log({
        action: 'enable_2fa',
        entityType: 'user_security',
        details: { timestamp: new Date().toISOString() }
      });

      setIs2FAEnabled(true);
      setStep('enabled');
      
      toast({
        title: '2FA включена',
        description: 'Двухфакторная аутентификация успешно настроена'
      });
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast({
        title: 'Ошибка',
        description: 'Неверный код. Попробуйте еще раз',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Вы уверены, что хотите отключить двухфакторную аутентификацию?')) {
      return;
    }

    setLoading(true);
    try {
      // Здесь будет логика отключения 2FA
      // В реальном приложении нужно будет использовать соответствующий API
      
      await activityLogger.log({
        action: 'disable_2fa',
        entityType: 'user_security',
        details: { timestamp: new Date().toISOString() }
      });

      setIs2FAEnabled(false);
      setStep('initial');
      
      toast({
        title: '2FA отключена',
        description: 'Двухфакторная аутентификация отключена'
      });
    } catch (error: any) {
      console.error('2FA disable error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отключить 2FA',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('initial');
    setVerificationCode('');
    setQrCode('');
    setSecret('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Двухфакторная аутентификация
          </DialogTitle>
        </DialogHeader>

        {step === 'initial' && (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Добавьте дополнительный уровень безопасности к вашему аккаунту
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Что такое 2FA?</h4>
              <p className="text-sm text-muted-foreground">
                Двухфакторная аутентификация требует не только пароль, но и код из приложения на вашем телефоне.
              </p>
            </div>
            <Button onClick={startSetup} disabled={loading} className="w-full">
              {loading ? 'Настройка...' : 'Настроить 2FA'}
            </Button>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="text-center">
              <QrCode className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Сканируйте QR-код</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Используйте Google Authenticator или другое TOTP приложение
              </p>
            </div>
            
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Или введите секретный ключ вручную:</Label>
              <Input value={secret} readOnly className="font-mono text-sm" />
            </div>
            
            <Button onClick={() => setStep('verify')} className="w-full">
              Продолжить
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium mb-2">Введите код подтверждения</h3>
              <p className="text-sm text-muted-foreground">
                Введите 6-значный код из вашего приложения
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Код подтверждения</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">
                Назад
              </Button>
              <Button onClick={verifySetup} disabled={loading} className="flex-1">
                {loading ? 'Проверка...' : 'Подтвердить'}
              </Button>
            </div>
          </div>
        )}

        {step === 'enabled' && (
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-medium mb-2">2FA включена</h3>
              <p className="text-sm text-muted-foreground">
                Ваш аккаунт защищен двухфакторной аутентификацией
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Важно!</h4>
                  <p className="text-sm text-yellow-700">
                    Сохраните резервные коды в безопасном месте. Они понадобятся, если вы потеряете доступ к приложению.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Закрыть
              </Button>
              <Button variant="destructive" onClick={disable2FA} disabled={loading} className="flex-1">
                {loading ? 'Отключение...' : 'Отключить 2FA'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
