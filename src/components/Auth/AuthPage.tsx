
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await supabaseService.signIn(signInData.email, signInData.password);
      toast({
        title: 'Успешный вход',
        description: 'Добро пожаловать в систему!'
      });
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    try {
      await supabaseService.signUp(
        signUpData.email,
        signUpData.password,
        {
          username: signUpData.username,
          fullName: signUpData.fullName
        }
      );
      toast({
        title: 'Регистрация успешна',
        description: 'Проверьте email для подтверждения аккаунта'
      });
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/1a2ab69e-d088-4847-b64c-026efae5c05f.png')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <img 
              src="/lovable-uploads/8085f690-6d29-4dc3-8dfc-890319ea82ed.png" 
              alt="Fix Logistics" 
              className="h-12 w-auto object-contain brightness-0 invert"
            />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Управление<br />логистикой<br />просто
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              Контролируйте рейсы, водителей и транспорт в одном месте. 
              Полный контроль над вашими грузоперевозками.
            </p>
          </div>

          <div className="flex gap-8">
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-white/70">Рейсов в месяц</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50+</div>
              <div className="text-sm text-white/70">Единиц транспорта</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99%</div>
              <div className="text-sm text-white/70">Доставок в срок</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img 
              src="/lovable-uploads/8085f690-6d29-4dc3-8dfc-890319ea82ed.png" 
              alt="Fix Logistics" 
              className="h-12 w-auto object-contain mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-foreground">
              Система управления логистикой
            </h2>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Добро пожаловать
            </h1>
            <p className="text-muted-foreground mt-2">
              Войдите в систему или создайте новый аккаунт
            </p>
          </div>

          <Card className="border-0 shadow-elevated">
            <CardContent className="p-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
                  <TabsTrigger value="signin" className="text-sm font-medium">
                    Вход
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm font-medium">
                    Регистрация
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="email@company.com"
                          className="pl-10 h-11"
                          value={signInData.email}
                          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium">
                        Пароль
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11"
                          value={signInData.password}
                          onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="py-3">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="spinner h-4 w-4" />
                          <span>Вход...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Войти</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-username" className="text-sm font-medium">
                          Логин
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-username"
                            placeholder="username"
                            className="pl-10 h-11"
                            value={signUpData.username}
                            onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-fullname" className="text-sm font-medium">
                          Имя
                        </Label>
                        <Input
                          id="signup-fullname"
                          placeholder="Иван Иванов"
                          className="h-11"
                          value={signUpData.fullName}
                          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="email@company.com"
                          className="pl-10 h-11"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">
                        Пароль
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-sm font-medium">
                        Подтвердите пароль
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="py-3">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="spinner h-4 w-4" />
                          <span>Регистрация...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Создать аккаунт</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            © 2024 Fix Logistics. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
};
