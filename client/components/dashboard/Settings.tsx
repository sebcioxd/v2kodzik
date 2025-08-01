"use client";

import { useState } from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Eye, 
  EyeOff
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
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
