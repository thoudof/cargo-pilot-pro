import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabaseService';
import { activityLogger } from '@/services/activityLogger';
import { QrCode, Smartphone, Shield, AlertTriangle, Copy, Check } from 'lucide-react';

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
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      check2FAStatus();
    }
  }, [open]);

  const check2FAStatus = async () => {
    try {
      const { data, error } = await supabaseService.supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error listing factors:', error);
        return;
      }

      const totpFactors = data?.totp || [];
      const verifiedFactor = totpFactors.find(f => f.status === 'verified');
      
      if (verifiedFactor) {
        setIs2FAEnabled(true);
        setFactorId(verifiedFactor.id);
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
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('setup');
    } catch (error: any) {
      console.error('2FA setup error:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось начать настройку 2FA',
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
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabaseService.supabase.auth.mfa.challenge({
        factorId: factorId
      });

      if (challengeError) throw challengeError;

      // Verify the challenge
      const { data, error } = await supabaseService.supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
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
        description: error.message || 'Неверный код. Попробуйте еще раз',
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
      const { error } = await supabaseService.supabase.auth.mfa.unenroll({
        factorId: factorId
      });

      if (error) throw error;
      
      await activityLogger.log({
        action: 'disable_2fa',
        entityType: 'user_security',
        details: { timestamp: new Date().toISOString() }
      });

      setIs2FAEnabled(false);
      setStep('initial');
      setFactorId('');
      
      toast({
        title: '2FA отключена',
        description: 'Двухфакторная аутентификация отключена'
      });
    } catch (error: any) {
      console.error('2FA disable error:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отключить 2FA',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Скопировано',
      description: 'Секретный ключ скопирован в буфер обмена'
    });
  };

  const handleClose = () => {
    setStep('initial');
    setVerificationCode('');
    setQrCode('');
    setSecret('');
    setCopied(false);
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
            <div className="space-y-2">
              <h4 className="font-medium">Поддерживаемые приложения:</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>Authy</li>
                <li>1Password</li>
              </ul>
            </div>
            <Button onClick={startSetup} disabled={loading} className="w-full">
              {loading ? 'Настройка...' : 'Настроить 2FA'}
            </Button>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="text-center">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-medium mb-2">Сканируйте QR-код</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Используйте приложение-аутентификатор для сканирования
              </p>
            </div>
            
            {qrCode && (
              <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Или введите секретный ключ вручную:</Label>
              <div className="flex gap-2">
                <Input 
                  value={secret} 
                  readOnly 
                  className="font-mono text-sm flex-1" 
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
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
                Введите 6-значный код из вашего приложения-аутентификатора
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Код подтверждения</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">
                Назад
              </Button>
              <Button 
                onClick={verifySetup} 
                disabled={loading || verificationCode.length !== 6} 
                className="flex-1"
              >
                {loading ? 'Проверка...' : 'Подтвердить'}
              </Button>
            </div>
          </div>
        )}

        {step === 'enabled' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium mb-2">2FA включена</h3>
              <p className="text-sm text-muted-foreground">
                Ваш аккаунт защищен двухфакторной аутентификацией
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">Важно!</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    При входе вам понадобится код из приложения-аутентификатора. Убедитесь, что у вас есть доступ к нему.
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
