"use client";

import { useState } from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  Download,
  Database,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { authClient } from '@/lib/auth-client';
import { User as UserType } from '@/lib/auth-client';
import { toast } from "sonner";
import axios from 'axios';

// Custom Loading Spinner Component
const LoadingSpinner = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6", 
    large: "h-8 w-8"
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300`} />
  );
};

// Type for the API response
type UserDataResponse = {
  userData: any[];
  accountData: any[];
  subscriptionData: any[];
  monthlyLimitsData: any[];
  sharesHistoryData: any[];
};

// Type for email request response
type EmailRequestResponse = {
  message: string;
  success: boolean;
};

// Form schemas
const usernameSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Nazwa użytkownika musi mieć co najmniej 3 znaki" })
    .max(50, { message: "Nazwa użytkownika nie może przekraczać 50 znaków" })
});

const passwordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: "Aktualne hasło jest wymagane" }),
  newPassword: z
    .string()
    .min(8, { message: "Nowe hasło musi mieć co najmniej 8 znaków" }),
  confirmPassword: z
    .string()
    .min(1, { message: "Proszę potwierdzić nowe hasło" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Nowe hasła nie są identyczne",
  path: ["confirmPassword"],
});

type UsernameFormData = z.infer<typeof usernameSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface SettingsProps {
  user: UserType;
}

export default function Settings({ user }: SettingsProps) {
  // Username form
  const usernameForm = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // State
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // User data query
  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: userDataError,
    refetch: refetchUserData
  } = useQuery<UserDataResponse, Error>({
    queryKey: ['user-data'],
    queryFn: async (): Promise<UserDataResponse> => {
      try {
        const response = await axios.get<UserDataResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/user-data`,
          {
            withCredentials: true,
          }
        );
        return response.data;
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
    },
    enabled: false, // Only fetch when user explicitly requests it
    staleTime: 0,
  });

  const onUsernameSubmit = async (data: UsernameFormData) => {
    if (data.username.trim() === user?.name) {
      usernameForm.setError("username", { 
        message: "Nowa nazwa użytkownika musi być inna od obecnej" 
      });
      return;
    }

    setIsUpdatingUsername(true);

    try {
      await authClient.updateUser({
        name: data.username.trim()
      });
      
      toast.success("Nazwa użytkownika została zaktualizowana pomyślnie!");
      usernameForm.reset();
    } catch (error: any) {
      console.error('Error updating username:', error);
      toast.error(error?.message || 'Wystąpił błąd podczas aktualizacji nazwy użytkownika');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword === data.currentPassword) {
      passwordForm.setError("newPassword", { 
        message: "Nowe hasło musi być inne od obecnego" 
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      await authClient.changePassword({
        currentPassword: data.currentPassword.trim(),
        newPassword: data.newPassword.trim(),
        revokeOtherSessions: true
      });
      
      toast.success("Hasło zostało zmienione pomyślnie! Wszystkie inne sesje zostały wylogowane.");
      passwordForm.reset();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error?.message || 'Wystąpił błąd podczas zmiany hasła');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadUserData = async () => {
    if (!userData) {
      toast.error("Brak danych do pobrania");
      return;
    }

    setIsDownloading(true);

    try {
      // Create a comprehensive data object
      const downloadData = {
        requestDate: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        data: userData,
        metadata: {
          totalRecords: {
            userData: userData.userData.length,
            accountData: userData.accountData.length,
            subscriptionData: userData.subscriptionData.length,
            monthlyLimitsData: userData.monthlyLimitsData.length,
            sharesHistoryData: userData.sharesHistoryData.length,
          }
        }
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(downloadData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${user.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Dane zostały pobrane pomyślnie!");
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error("Wystąpił błąd podczas pobierania danych");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendDataByEmail = async () => {
    setIsSendingEmail(true);

    try {
      const response = await axios.get<EmailRequestResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/user-data/request-email`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success("Dane zostały wysłane na Twój adres email!");
      } else {
        toast.error(response.data.message || "Wystąpił błąd podczas wysyłania danych");
      }
    } catch (error: any) {
      console.error('Error sending data by email:', error);
      toast.error(error?.response?.data?.message || "Wystąpił błąd podczas wysyłania danych");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleFetchUserData = () => {
    refetchUserData();
  };

  return (
    <main className="">
      <div className="w-full space-y-6 animate-fade-in-01-text">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl text-zinc-200 font-medium tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-zinc-400" />
            Ustawienia konta
          </h2>
          <p className="text-zinc-400 text-sm">
            Zarządzaj swoimi danymi i ustawieniami konta
          </p>
        </div>

        {/* Current User Info */}
        <Card className="bg-zinc-900/20 border-zinc-800 border-dashed">
          <CardHeader>
            <CardTitle className="text-zinc-200 flex items-center tracking-tight gap-2">
              <User className="h-5 w-5 text-zinc-400" />
              Informacje o koncie
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Twoje obecne dane konta
            </CardDescription>
          </CardHeader>
          <CardContent className="tracking-tight">
            <div className="flex items-center py-1">
              <span className="text-zinc-400">Nazwa użytkownika:</span>
              <span className="text-zinc-200 font-medium ml-1">{user.name}</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-zinc-400">Email:</span>
              <span className="text-zinc-200 font-medium ml-1">{user.email}</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-zinc-400">Data utworzenia:</span>
              <span className="text-zinc-200 font-medium ml-1">
                {new Date(user.createdAt).toLocaleDateString('pl-PL')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Change Username */}
        <Card className="bg-zinc-900/20 border-zinc-800 border-dashed tracking-tight">
          <CardHeader>
            <CardTitle className="text-zinc-200 flex items-center gap-2">
              <User className="h-5 w-5 text-zinc-400" />
              Zmień nazwę użytkownika
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Zaktualizuj swoją nazwę użytkownika
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...usernameForm}>
              <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="space-y-4">
                <FormField
                  control={usernameForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Nowa nazwa użytkownika
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                          <Input
                            {...field}
                            className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                            placeholder="Wprowadź nową nazwę użytkownika"
                            disabled={isUpdatingUsername}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isUpdatingUsername}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  {isUpdatingUsername ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    'Zaktualizuj nazwę'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Separator className="bg-zinc-800" />

        {/* Change Password */}
        <Card className="bg-zinc-900/20 border-zinc-800 border-dashed tracking-tight">
          <CardHeader>
            <CardTitle className="text-zinc-200 flex items-center gap-2">
              <Lock className="h-5 w-5 text-zinc-400" />
              Zmień hasło
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Zaktualizuj swoje hasło do konta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Aktualne hasło
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                          <Input
                            {...field}
                            type={showCurrentPassword ? "text" : "password"}
                            className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                            placeholder="Wprowadź aktualne hasło"
                            disabled={isChangingPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="px-3 text-zinc-500 hover:text-zinc-400 transition-colors"
                            disabled={isChangingPassword}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Nowe hasło
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                          <Input
                            {...field}
                            type={showNewPassword ? "text" : "password"}
                            className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                            placeholder="Wprowadź nowe hasło (min. 8 znaków)"
                            disabled={isChangingPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="px-3 text-zinc-500 hover:text-zinc-400 transition-colors"
                            disabled={isChangingPassword}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Potwierdź nowe hasło
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                            placeholder="Potwierdź nowe hasło"
                            disabled={isChangingPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="px-3 text-zinc-500 hover:text-zinc-400 transition-colors"
                            disabled={isChangingPassword}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  {isChangingPassword ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    'Zmień hasło'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Separator className="bg-zinc-800" />

        {/* Request User Data - Enhanced with Email Option */}
        <Card className="bg-zinc-900/20 border-zinc-800 border-dashed tracking-tight">
          <CardHeader>
            <CardTitle className="text-zinc-200 flex items-center gap-2">
              <Database className="h-5 w-5 text-zinc-400" />
              Pobierz dane użytkownika
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Pobierz swoje dane w formacie JSON zgodnie z RODO
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUserData ? (
              <div className="flex items-center py-6">
                <LoadingSpinner size="default" />
                <span className="ml-3 text-zinc-400">Ładowanie...</span>
              </div>
            ) : userDataError ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-zinc-400" />
                  <p className="text-zinc-400 text-sm">Błąd podczas ładowania danych</p>
                </div>
                <Button 
                  onClick={handleFetchUserData}
                  className="bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 border border-dashed border-zinc-800"
                >
                  Spróbuj ponownie
                </Button>
              </div>
            ) : userData ? (
              <div className="space-y-4 animate-fade-in-01-text">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <CheckCircle className="h-4 w-4 text-zinc-500" />
                  <span>Dane gotowe do pobrania</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleDownloadUserData}
                    disabled={isDownloading}
                    className="bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 border border-dashed border-zinc-800 text-sm py-2 px-4"
                  >
                    {isDownloading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {isDownloading ? 'Pobieranie...' : 'Pobierz dane JSON'}
                  </Button>

                  <Button
                    onClick={handleSendDataByEmail}
                    disabled={isSendingEmail}
                    className="bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 border border-dashed border-zinc-800 text-sm py-2 px-4"
                  >
                    {isSendingEmail ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {isSendingEmail ? 'Wysyłanie...' : 'Wyślij na email'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Wybierz sposób pobierania swoich danych:
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleFetchUserData}
                    disabled={isLoadingUserData}
                    className="bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 border border-dashed border-zinc-800 text-sm py-2 px-4"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Załaduj i pobierz
                  </Button>

                  <Button
                    onClick={handleSendDataByEmail}
                    disabled={isSendingEmail}
                    className="bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 border border-dashed border-zinc-800 text-sm py-2 px-4"
                  >
                    {isSendingEmail ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isSendingEmail ? 'Wysyłanie...' : 'Wyślij na email'}
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-md">
                  <p className="text-xs text-zinc-500">
                    <strong>Email:</strong> Dane zostaną wysłane na adres {user.email} jako załącznik JSON z pięknym szablonem email.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-zinc-900/20 border-dashed border-zinc-800 tracking-tight">
          <CardHeader>
            <CardTitle className="text-zinc-200 flex items-center gap-2">
              <Lock className="h-5 w-5 text-zinc-400" />
              Informacje o bezpieczeństwie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-zinc-400">
              <p>• Zmiana hasła automatycznie wyloguje wszystkie inne sesje</p>
              <p>• Używaj silnego hasła z co najmniej 8 znakami</p>
              <p>• Nie udostępniaj swoich danych logowania</p>
              <p>• Regularnie aktualizuj swoje hasło</p>
              <p>• Pobierane dane zawierają wszystkie informacje związane z Twoim kontem</p>
              <p>• Plik JSON zawiera dane użytkownika, konta, subskrypcje, limity i historię</p>
              <p>• Dane są pobierane zgodnie z RODO i przepisami o ochronie danych</p>
              <p>• Plik jest generowany w czasie rzeczywistym i zawiera najnowsze dane</p>
              <p>• Email z danymi zawiera piękny szablon i jest wysyłany na Twój adres email</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
