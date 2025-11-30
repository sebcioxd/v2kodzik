"use client";

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  Monitor, 
  Globe, 
  Trash2, 
  XCircle, 
  Calendar,
  Clock,
  MapPinHouse,
  Laptop,
  Tablet
} from 'lucide-react';
import { User as UserType } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { parseAsString, useQueryState } from 'nuqs'

// Types
type TrustedDevice = {
  id: string;
  expiresAt: string;
  createdAt: string;
  ipAddress: string;
  userAgent: string;
  userId: string;
  isCurrentDevice: boolean;
};

interface SecurityProps {
  user: UserType;
}

// --- Enhanced Helper Functions ---

const getDeviceInfo = (userAgent: string | null) => {
  if (!userAgent) return { 
    type: 'unknown', 
    icon: Globe, 
    os: 'Nieznany system', 
    browser: 'Nieznana przeglądarka', 
    name: 'Nieznane urządzenie' 
  };
  
  const ua = userAgent.toLowerCase();
  
  // 1. Detect Operating System
  let os = 'Nieznany system';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac') && !ua.includes('iphone') && !ua.includes('ipad')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('cros')) os = 'Chrome OS';

  // 2. Detect Browser
  let browser = 'Nieznana przeglądarka';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opr') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';

  // 3. Detect Device Type & Icon
  let type = 'desktop';
  let icon = Monitor; 

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    type = 'mobile';
    icon = Smartphone;
  } 
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    type = 'tablet';
    icon = Tablet;
  }

  // Refine Desktop Icon
  if (type === 'desktop') {
    if (os === 'macOS' || ua.includes('laptop')) {
        icon = Laptop;
    }
  }

  return { 
    type, 
    icon, 
    os, 
    browser,
    name: `${os} • ${browser}` 
  };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// --- Main Component ---

export default function Security({ user }: SecurityProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'disable-2fa' | 'delete-device' | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<TrustedDevice | null>(null);
  
  const [token, setToken] = useQueryState("token", parseAsString);
  const { refetch } = useSession(); 

  // 1. Fetch Trusted Devices
  const {
    data: devicesData,
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices
  } = useQuery({
    queryKey: ['trusted-devices'],
    queryFn: async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/2fa/trusted-devices`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' 
        });

        if (!response.ok) throw new Error('Failed to fetch devices');

        const data = await response.json();
        return data.devices as TrustedDevice[]; 
      } catch (error) {
        console.error('Error fetching trusted devices:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // 2. Token Confirmation
  const {
    data: tokenData,
    isLoading: tokenLoading,
  } = useQuery({
    queryKey: ['token', token],
    queryFn: async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/security/confirm?token=${token}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error');

        toast.info(data.message);
        setToken(null);
        refetch();
        return data;
      } catch (error) {
        console.error('Error confirming token:', error);
        setToken(null);
        toast.error('Wystąpił błąd podczas potwierdzania tokenu');
        throw error;
      }
    },
    enabled: !!user && !!token,
    staleTime: 0,
    retry: false,
  });

  // 3. Toggle 2FA Mutation
  const toggle2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/security/twostep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Wystąpił błąd podczas zmiany ustawień 2FA');
    },
  });

  // 4. Delete Device Mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/2fa/trusted-devices/delete/${deviceId}`, {
        method: 'POST', 
        credentials: 'include'
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error deleting device');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Urządzenie zostało usunięte');
      refetchDevices();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Wystąpił błąd podczas usuwania urządzenia');
    },
  });

  const handleConfirmAction = () => {
    switch (actionType) {
      case 'disable-2fa':
        toggle2FAMutation.mutate();
        break;
      case 'delete-device':
        if (selectedDevice) {
            deleteDeviceMutation.mutate(selectedDevice.id);
        }
        break;
    }
    setShowConfirmDialog(false);
    setActionType(null);
    setSelectedDevice(null);
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'disable-2fa':
        if (user.twofactorEnabled) {
          return 'Czy na pewno chcesz wyłączyć dwuskładnikową autoryzację? Twoje konto będzie mniej bezpieczne. Po wyłączeniu, wyślemy na twój e-mail link z potwierdzeniem który musisz kliknąć aby zapisać zmiany.';
        } else {
          return 'Czy na pewno chcesz włączyć dwuskładnikową autoryzację? Twoje konto będzie bardziej bezpieczne. Po włączeniu, wyślemy na twój e-mail link z potwierdzeniem który musisz kliknąć aby zapisać zmiany.';
        }
      case 'delete-device':
        return `Czy na pewno chcesz usunąć to zaufane urządzenie? Przy kolejnym logowaniu z tego urządzenia konieczna będzie ponowna weryfikacja.`;
      default:
        return '';
    }
  };
  
  const getActionTitle = () => {
    switch (actionType) {
      case 'disable-2fa':
        return user.twofactorEnabled 
          ? 'Wyłącz dwuskładnikową autoryzację' 
          : 'Włącz dwuskładnikową autoryzację';
      case 'delete-device':
        return 'Usuń zaufane urządzenie';
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
            Zarządzaj bezpieczeństwem swojego konta i urządzeniami
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

        {/* Trusted Devices Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h3 className="text-lg text-zinc-200 font-medium tracking-tight flex items-center gap-2">
              <Monitor className="h-4 w-4 text-zinc-400" />
              Zaufane urządzenia
            </h3>
          </div>

          {/* Devices List */}
          {!devicesLoading && !devicesError && devicesData && Array.isArray(devicesData) && devicesData.length > 0 ? (
            <div className="space-y-3">
              {devicesData.map((device: TrustedDevice) => {
                const deviceInfo = getDeviceInfo(device.userAgent);
                const DeviceIcon = deviceInfo.icon;
                const isCurrent = device.isCurrentDevice; // Flag from API
                
                return (
                  <div
                    key={device.id}
                    className={`
                      relative p-4 rounded-lg animate-fade-in-01-text transition-all
                      ${isCurrent 
                        ? 'bg-zinc-900/30 border border-emerald-500/30 hover:border-emerald-500/50' 
                        : 'bg-zinc-900/30 border border-dotted border-zinc-900 hover:border-zinc-800'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${isCurrent ? 'bg-emerald-500/10' : 'bg-zinc-800/50'}`}>
                          <DeviceIcon className={`h-5 w-5 ${isCurrent ? 'text-emerald-400' : 'text-zinc-300'}`} />
                        </div>
                        
                        <div className="space-y-1">
                          
                          {/* Device Name (OS + Browser) */}
                          <div className="flex items-center gap-2">
                             <h4 className={`font-medium ${isCurrent ? 'text-emerald-100' : 'text-zinc-200'}`}>
                                {deviceInfo.os}
                             </h4>
                             <span className="text-zinc-600">•</span>
                             <p className="text-zinc-400 text-sm">
                                {deviceInfo.browser}
                             </p>
                             {isCurrent && (
                               <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                 To urządzenie
                               </span>
                             )}
                          </div>
                          
                          {/* Details Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-zinc-500 pt-1">
                            <span className="flex items-center gap-1">
                                <MapPinHouse className="h-3 w-3" />
                                IP: {device.ipAddress}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(device.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Wygasa: {formatDate(device.expiresAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Icon Button */}
                      {isCurrent ? (
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                {/* Span is required for tooltips on disabled buttons to work in some browsers */}
                                <span tabIndex={0}> 
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled
                                    className="text-zinc-600 opacity-50 cursor-not-allowed hover:bg-transparent"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-zinc-950 border-zinc-800 text-zinc-300 text-xs">
                              <p>Nie możesz usunąć bieżącego urządzenia</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => {
                                setActionType('delete-device');
                                setSelectedDevice(device);
                                setShowConfirmDialog(true);
                            }}
                            disabled={deleteDeviceMutation.isPending}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             // Empty State or Loading
            !devicesLoading && (
                <div className="text-zinc-500 text-center py-8 text-sm bg-zinc-900/20 rounded-lg border border-zinc-900 border-dashed">
                    Brak zaufanych urządzeń.
                </div>
            )
          )}

          {/* Error State */}
          {devicesError && (
            <Alert className="bg-red-400/10 border-red-400/20">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Błąd podczas ładowania urządzeń. Spróbuj ponownie.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Security Tips */}
        <div className="bg-zinc-900/30 border border-dotted border-zinc-900 rounded-lg p-4 animate-fade-in-01-text hover:border-zinc-800 transition-colors">
          <h3 className="text-zinc-200 font-medium mb-3 tracking-tight flex items-center gap-2">
            <Shield className="h-4 w-4 text-zinc-400" />
            Wskazówki bezpieczeństwa
          </h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>• Zawsze usuwaj urządzenia, których już nie używasz</p>
            <p>• Włącz dwuskładnikową autoryzację dla zwiększonego bezpieczeństwa</p>
            <p>• Regularnie sprawdzaj listę zaufanych urządzeń</p>
            <p>• Nie udostępniaj nikomu kodów 2FA</p>
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
              disabled={toggle2FAMutation.isPending || deleteDeviceMutation.isPending}
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