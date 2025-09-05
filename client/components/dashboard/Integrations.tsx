"use client";

import { useQuery } from '@tanstack/react-query';
import { 
  Link as LinkIcon, 
  Unlink,
  Plus,
  Shield,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { User as UserType } from '@/lib/auth-client';
import { formatDate } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { toast } from 'sonner';

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

// Updated type to match the actual structure returned by listAccounts
type Account = {
  id: string;
  providerId: string; // Fixed: Changed back to providerId to match actual API response
  createdAt: Date;
  updatedAt: Date;
  accountId: string;
  scopes: string[]; // Changed from scope to scopes array
}

// Define valid provider types - removed github since you don't use it
type ProviderType = 'google' | 'discord';

const GoogleIcon = () => (
  <svg 
    className="h-5 w-5" 
    viewBox="0 0 256 262" 
    xmlns="http://www.w3.org/2000/svg" 
    preserveAspectRatio="xMidYMid"
  >
    <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/>
    <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/>
    <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/>
    <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/>
  </svg>
);

const DiscordIcon = () => (
  <svg
    className="h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"
    />
  </svg>
);

const providerIcons: Record<ProviderType, React.ComponentType<{ className?: string }>> = {
  google: GoogleIcon,
  discord: DiscordIcon,
};

const providerNames: Record<ProviderType, string> = {
  google: "Google",
  discord: "Discord",
};

const providerColors: Record<ProviderType, string> = {
  google: "text-red-400",
  discord: "text-indigo-400",
};

interface IntegrationsProps {
  user: UserType;
}

export default function Integrations({ user }: IntegrationsProps) {
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

  const {
    data: accounts,
    isLoading,
    error,
    refetch
  } = useQuery<Account[], Error>({
    queryKey: ['user-accounts'],
    queryFn: async (): Promise<Account[]> => {
      try {
        const result = await authClient.listAccounts();
        return result.data ?? [];
      } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const handleLinkAccount = async (provider: ProviderType) => {
    setIsLinking(provider);
    try {
      await authClient.linkSocial({
        provider,
        callbackURL: `${process.env.NEXT_PUBLIC_SITE_URL}/panel/integrations`
      });
    } catch (error) {
      console.error('Error linking account:', error);
      toast.error('Błąd podczas łączenia konta');
    } finally {
      setIsLinking(null);
    }
  };

  const handleUnlinkAccount = async (accountId: string, provider: string) => {
    setIsUnlinking(accountId);
    try {
      await authClient.unlinkAccount({
        providerId: provider
      });
      await refetch();
    } catch (error) {
      console.error('Error unlinking account:', error);
      // You might want to show a toast notification here
    } finally {
      setIsUnlinking(null);
    }
  };

  // Fixed: Use account.providerId instead of account.provider
  // Filter out credential provider and only show social providers
  const linkedProviders = accounts?.map(account => account.providerId as ProviderType) || [];
  const availableProviders = (Object.keys(providerNames) as ProviderType[]).filter(
    provider => !linkedProviders.includes(provider)
  );

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">Błąd podczas ładowania integracji</div>
      </main>
    );
  }

  return (
    <main className="">
      <div className="w-full space-y-6 animate-fade-in-01-text">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl text-zinc-200 font-medium tracking-tight flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-zinc-400" />
            Integracje konta
          </h2>
          <p className="text-zinc-400 text-sm">
            Zarządzaj połączonymi kontami społecznościowymi
          </p>
        </div>

        {/* Linked Accounts */}
        {!isLoading && (
          <div className="space-y-4">
            <h3 className="text-md text-zinc-200 font-medium tracking-tight flex items-center gap-2">
              <Shield className="h-4 w-4 text-zinc-400" />
              Połączone konta
            </h3>

            {!accounts || accounts.filter(account => account.providerId !== 'credential').length === 0 ? (
              <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6 text-center">
                <User className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">Brak połączonych kont</p>
                <p className="text-zinc-500 text-sm">
                  Połącz swoje konto z usługami społecznościowymi, aby uzyskać dodatkowe funkcje
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {accounts
                  .filter(account => account.providerId !== 'credential')
                  .map((account) => {
                  const provider = account.providerId as ProviderType;
                  const IconComponent = providerIcons[provider];
                  const providerName = providerNames[provider] || account.providerId;
                  const providerColor = providerColors[provider] || "text-zinc-400";
                  
                  return (
                    <div 
                      key={account.id}
                      className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4 hover:bg-zinc-900/20 transition-colors animate-slide-in-bottom"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-zinc-800/50 rounded-lg ${providerColor}`}>
                            {IconComponent ? (
                              <IconComponent className="h-5 w-5" />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-zinc-200 font-medium tracking-tight">
                              {providerName}
                            </h4>
                            <p className="text-zinc-400 text-sm">
                              ID: {account.accountId}
                            </p>
                            <p className="text-zinc-400 text-sm">
                              Wystawca: {account.providerId}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right text-sm text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Połączono: {formatDate(account.createdAt.toString())}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkAccount(account.id, account.providerId)}
                            disabled={isUnlinking === account.id}
                            className="text-red-400 hover:text-red-30 bg-darken hover:bg-red-400/10 border-red-400/20"
                          >
                            {isUnlinking === account.id ? (
                              <LoadingSpinner size="small" />
                            ) : (
                              <>
                                <Unlink className="h-4 w-4 mr-1" />
                                Odłącz
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {account.scopes && account.scopes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <p className="text-zinc-400 text-sm">
                            <span className="text-zinc-300">Uprawnienia:</span> {account.scopes.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Available Providers */}
        {!isLoading && availableProviders.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-md text-zinc-200 font-medium tracking-tight flex items-center gap-2">
              <Plus className="h-4 w-4 text-zinc-400" />
              Dostępne integracje
            </h3>
            
            <div className="grid gap-4">
              {availableProviders.map((provider) => {
                const IconComponent = providerIcons[provider];
                const providerName = providerNames[provider];
                const providerColor = providerColors[provider];
                
                return (
                  <div 
                    key={provider}
                    className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-zinc-800/50 rounded-lg ${providerColor}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-zinc-200 font-medium tracking-tight">
                            {providerName}
                          </h4>
                          <p className="text-zinc-400 text-sm">
                            Połącz swoje konto {providerName}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleLinkAccount(provider)}
                        disabled={isLinking === provider}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                      >
                        {isLinking === provider ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Połącz
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-200 font-medium mb-3 tracking-tight flex items-center gap-2">
            <Shield className="h-4 w-4 text-zinc-400" />
            Informacje o integracjach
          </h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>• Połączone konta umożliwiają szybsze logowanie i dodatkowe funkcje</p>
            <p>• Możesz w każdej chwili odłączyć swoje konto od usługi społecznościowej</p>
            <p>• Twoje dane są bezpieczne i nie są udostępniane stronom trzecim</p>
            <p>• Każda integracja może wymagać różnych uprawnień do działania</p>
          </div>
        </div>
      </div>
    </main>
  );
}