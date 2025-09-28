"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  Trash2,
  LogOut,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { User as UserType, authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import axios from 'axios';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';

// Types
type Session = {
  id: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  isCurrent?: boolean;
};

interface SecurityProps {
  user: UserType;
}

// Helper function to detect device type from user agent
const getDeviceInfo = (userAgent: string | null) => {
  if (!userAgent) return { type: 'unknown', icon: Globe, name: 'Nieznane urządzenie' };
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return { type: 'mobile', icon: Smartphone, name: 'Telefon' };
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return { type: 'tablet', icon: Monitor, name: 'Tablet' };
  } else if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) {
    return { type: 'desktop', icon: Monitor, name: 'Komputer' };
  }
  
  return { type: 'unknown', icon: Globe, name: 'Nieznane urządzenie' };
};

// Helper function to format date
const formatDate = (date: Date) => {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Dzisiaj';
  } else if (diffDays === 1) {
    return 'Wczoraj';
  } else if (diffDays < 7) {
    return `${diffDays} dni temu`;
  } else {
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
};

// Helper function to format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Security({ user }: SecurityProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'disable-2fa' | 'revoke-session' | 'revoke-others' | 'revoke-all' | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const queryClient = useQueryClient();
  const { refetch } = useSession(); // refetch the session
  // Fetch sessions using Better Auth client
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      try {
        const result = await authClient.listSessions();
        // Handle the data structure properly
        if (result.data && Array.isArray(result.data)) {
          return result.data;
        }
        return [];
      } catch (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Toggle 2FA mutation
  const toggle2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/security/twostep`,
        {},
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Wystąpił błąd podczas zmiany ustawień 2FA');
    },
  });

  // Revoke session mutation using Better Auth client
  const revokeSessionMutation = useMutation({
    mutationFn: async (token: string) => {
      await authClient.revokeSession({ token });
      return { message: "Sesja została odwołana" };
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchSessions();
    },
    onError: (error: any) => {
      toast.error('Wystąpił błąd podczas odwoływania sesji');
    },
  });

  // Revoke other sessions mutation using Better Auth client
  const revokeOtherSessionsMutation = useMutation({
    mutationFn: async () => {
      await authClient.revokeOtherSessions();
      return { message: "Wszystkie inne sesje zostały odwołane" };
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchSessions();
    },
    onError: (error: any) => {
      toast.error('Wystąpił błąd podczas odwoływania innych sesji');
    },
  });

  // Revoke all sessions mutation using Better Auth client
  const revokeAllSessionsMutation = useMutation({
    mutationFn: async () => {
      await authClient.revokeSessions();
      return { message: "Wszystkie sesje zostały odwołane" };
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchSessions();
    },
    onError: (error: any) => {
      toast.error('Wystąpił błąd podczas odwoływania wszystkich sesji');
    },
  });

  const handleConfirmAction = () => {
    switch (actionType) {
      case 'disable-2fa':
        toggle2FAMutation.mutate();
        break;
      case 'revoke-session':
        if (selectedSession) {
          revokeSessionMutation.mutate(selectedSession.token);
        }
        break;
      case 'revoke-others':
        revokeOtherSessionsMutation.mutate();
        break;
      case 'revoke-all':
        revokeAllSessionsMutation.mutate();
        break;
    }
    setShowConfirmDialog(false);
    setActionType(null);
    setSelectedSession(null);
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'disable-2fa':
        return 'Czy na pewno chcesz wyłączyć dwuskładnikową autoryzację? Twoje konto będzie mniej bezpieczne.';
      case 'revoke-session':
        return `Czy na pewno chcesz odwołać tę sesję? Zostaniesz wylogowany z tego urządzenia.`;
      case 'revoke-others':
        return 'Czy na pewno chcesz odwołać wszystkie inne sesje? Zostaniesz wylogowany ze wszystkich innych urządzeń.';
      case 'revoke-all':
        return 'Czy na pewno chcesz odwołać wszystkie sesje? Zostaniesz wylogowany ze wszystkich urządzeń.';
      default:
        return '';
    }
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'disable-2fa':
        return 'Wyłącz dwuskładnikową autoryzację';
      case 'revoke-session':
        return 'Odwołaj sesję';
      case 'revoke-others':
        return 'Odwołaj inne sesje';
      case 'revoke-all':
        return 'Odwołaj wszystkie sesje';
      default:
        return '';
    }
  };

  return (
    <main className="">
      <div className="w-full space-y-6 animate-fade-in-01-text">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl text-zinc-200 font-medium tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-zinc-400" />
            Bezpieczeństwo konta
          </h2>
          <p className="text-zinc-400 text-sm">
            Zarządzaj bezpieczeństwem swojego konta i sesjami
          </p>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="space-y-4">
          <h3 className="text-lg text-zinc-200 font-medium tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-zinc-400" />
            Dwuskładnikowa autoryzacja
          </h3>
          
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${user.twofactorEnabled ? 'bg-gray-400/10' : 'bg-gray-400/10'}`}>
                  {user.twofactorEnabled ? (
                    <ShieldCheck className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-yellow-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-zinc-200 font-medium">
                    {user.twofactorEnabled ? 'Dwuskładnikowa autoryzacja włączona' : 'Dwuskładnikowa autoryzacja wyłączona'}
                  </h4>
                  <p className="text-zinc-400 text-sm">
                    {user.twofactorEnabled 
                      ? 'Twoje konto jest chronione dodatkowym poziomem bezpieczeństwa'
                      : 'Włącz dwuskładnikową autoryzację dla zwiększonego bezpieczeństwa'
                    }
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => {
                  setActionType('disable-2fa');
                  setShowConfirmDialog(true);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                size="sm"
                disabled={toggle2FAMutation.isPending}
              >
                {user.twofactorEnabled ? 'Wyłącz' : 'Włącz'}
              </Button>
            </div>
            
            
          </div>
        </div>

        {/* Active Sessions Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h3 className="text-lg text-zinc-200 font-medium tracking-tight flex items-center gap-2">
              <Monitor className="h-4 w-4 text-zinc-400" />
              Aktywne sesje
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setActionType('revoke-others');
                  setShowConfirmDialog(true);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                size="sm"
                disabled={revokeOtherSessionsMutation.isPending || sessionsLoading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Odwołaj inne
              </Button>
              <Button
                onClick={() => {
                  setActionType('revoke-all');
                  setShowConfirmDialog(true);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                size="sm"
                disabled={revokeAllSessionsMutation.isPending || sessionsLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Odwołaj wszystkie
              </Button>
            </div>
          </div>

          {/* Sessions List - Only render when not loading */}
          {!sessionsLoading && !sessionsError && sessionsData && Array.isArray(sessionsData) && (
            <div className="space-y-3">
              {sessionsData.map((session: Session) => {
                const deviceInfo = getDeviceInfo(session.userAgent || null);
                const DeviceIcon = deviceInfo.icon;
                
                return (
                  <div
                    key={session.id}
                    className={`bg-zinc-900/30 border rounded-lg p-4 ${
                      session.isCurrent 
                        ? 'border-gray-400/30 bg-gray-400/5' 
                        : 'border-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          session.isCurrent ? 'bg-green-400/10' : 'bg-zinc-800/50'
                        }`}>
                          <DeviceIcon className={`h-5 w-5 ${
                            session.isCurrent ? 'text-green-400' : 'text-zinc-300'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-zinc-200 font-medium">
                              {deviceInfo.name}
                            </h4>
                            {session.isCurrent && (
                              <span className="px-2 py-1 text-xs bg-green-400/20 text-green-300 rounded-full">
                                Aktualna sesja
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-sm">
                            {session.ipAddress || 'Nieznany adres IP'}
                          </p>
                          <p className="text-zinc-500 text-xs">
                            Ostatnia aktywność: {formatDate(session.updatedAt)} o {formatTime(session.updatedAt)}
                          </p>
                        </div>
                      </div>
                      
                      {!session.isCurrent && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setActionType('revoke-session');
                                setSelectedSession(session);
                                setShowConfirmDialog(true);
                              }}
                              className="text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Odwołaj sesję
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sessions Summary - Only render when not loading */}
          {!sessionsLoading && !sessionsError && sessionsData && Array.isArray(sessionsData) && (
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-200 font-medium text-sm">Podsumowanie sesji</span>
                </div>
                <div className="text-sm text-zinc-400">
                  {sessionsData.length} aktywnych sesji
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {sessionsError && (
            <Alert className="bg-red-400/10 border-red-400/20">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Błąd podczas ładowania sesji. Spróbuj ponownie.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Security Tips */}
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-200 font-medium mb-3 tracking-tight flex items-center gap-2">
            <Shield className="h-4 w-4 text-zinc-400" />
            Wskazówki bezpieczeństwa
          </h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>• Zawsze wylogowuj się z urządzeń, których nie używasz</p>
            <p>• Włącz dwuskładnikową autoryzację dla zwiększonego bezpieczeństwa</p>
            <p>• Regularnie sprawdzaj aktywne sesje i odwołuj podejrzane</p>
            <p>• Używaj silnych, unikalnych haseł</p>
            <p>• Nie udostępniaj swoich danych logowania</p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm text-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-200 tracking-tight flex items-center text-md gap-2">
              {getActionTitle()}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              {getActionDescription()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="bg-zinc-900/20 border border-zinc-800 backdrop-blur-sm hover:bg-zinc-800 hover:text-zinc-300 text-zinc-300"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                toggle2FAMutation.isPending ||
                revokeSessionMutation.isPending ||
                revokeOtherSessionsMutation.isPending ||
                revokeAllSessionsMutation.isPending
              }
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            >
              Potwierdź
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
