"use client";

import { useQuery } from '@tanstack/react-query';
import { 
  HardDrive, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  Link as LinkIcon,
  Activity,
  HardDriveUpload,
} from 'lucide-react';
import { User as UserType } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';
import Link from 'next/link';

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
type LimitsData = {
  success: boolean;
  megabytesUsed: number;
  megabytesLimit: number;
  message: string;
  resetAt?: string;
  linksGenerated: number;
  filesUploaded: number;
  lifetimeMegabytesUsed: number;
};

// Helper function to format bytes to human readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '0 B'; // Handle negative values
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper function to get usage percentage
const getUsagePercentage = (used: number, limit: number) => {
  return Math.min((used / limit) * 100, 100);
};

// Helper function to get usage status and color
const getUsageStatus = (percentage: number) => {
  if (percentage >= 90) {
    return { status: 'critical', color: 'text-red-400', bgColor: 'bg-red-400/10', progressColor: 'bg-red-400' };
  } else if (percentage >= 75) {
    return { status: 'warning', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', progressColor: 'bg-yellow-400' };
  } else {
    return { status: 'normal', color: 'text-green-400', bgColor: 'bg-green-400/10', progressColor: 'bg-green-400' };
  }
};

// Helper function to format reset date
const formatResetDate = (resetAt: string) => {
  const resetDate = new Date(resetAt);
  const now = new Date();
  const diffTime = resetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return 'Dzisiaj';
  } else if (diffDays === 1) {
    return 'Jutro';
  } else if (diffDays < 7) {
    return `Za ${diffDays} dni`;
  } else {
    return resetDate.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
};

interface LimitsProps {
  user: UserType;
}

export default function Limits({ user }: LimitsProps) {
  const {
    data: limitsData,
    isLoading,
    error,
    refetch
  } = useQuery<LimitsData, Error>({
    queryKey: ['user-limits'],
    queryFn: async (): Promise<LimitsData> => {
      try {
        const response = await axios.get<LimitsData>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/limits/check`,
          {
            withCredentials: true,
          }
        );
        return response.data;
      } catch (error) {
        console.error('Error fetching limits:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">Błąd podczas ładowania limitów</div>
      </main>
    );
  }

  const usagePercentage = limitsData ? getUsagePercentage(limitsData.megabytesUsed, limitsData.megabytesLimit) : 0;
  const usageStatus = getUsageStatus(usagePercentage);
  const usedFormatted = limitsData ? formatBytes(limitsData.megabytesUsed * 1024 * 1024) : '0 B';
  const limitFormatted = limitsData ? formatBytes(limitsData.megabytesLimit * 1024 * 1024) : '0 B';

  return (
    <main className="">
      <div className="w-full space-y-6 animate-fade-in-01-text">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl text-zinc-200 font-medium tracking-tight flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-zinc-400" />
            Limity użytkowania
          </h2>
          <p className="text-zinc-400 text-sm">
            Monitoruj swoje miesięczne zużycie przestrzeni
          </p>
        </div>

        {/* Main Usage Card */}
        {!isLoading && limitsData && (
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6 animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-zinc-800/50 rounded-lg ${usageStatus.color}`}>
                  <BarChart3 className="h-6 w-6 text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-zinc-200 font-medium tracking-tight">
                    Miesięczne zużycie
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    {usedFormatted} z {limitFormatted}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold text-zinc-300 bg-zinc-800/50 rounded-md px-2 py-0`}>
                  {usagePercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Użyte</span>
                <span className="text-zinc-400">Limit</span>
              </div>
              <div className="relative">
                <Progress 
                  value={usagePercentage} 
                  className="h-2 bg-zinc-800"
                />
                <div 
                  className="absolute top-0 left-0 h-2 rounded-full transition-all duration-300 bg-zinc-500"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="large" />
              <span className="ml-3 text-zinc-400">Ładowanie limitów...</span>
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        {!isLoading && limitsData && (
          <div>
          <div className="grid md:grid-cols-2 gap-4 animate-slide-in-bottom">
            {/* Used Space Card */}
            <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-zinc-800/50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-zinc-300" />
                </div>
                <h4 className="text-zinc-200 font-medium text-sm">Użyta przestrzeń</h4>
              </div>
              <div className="text-2xl font-bold text-zinc-200 mb-1">
                {usedFormatted}
              </div>
              <p className="text-zinc-400 text-xs">
                W tym miesiącu
              </p>
            </div>

            {/* Remaining Space Card */}
            <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-zinc-800/50 rounded-lg">
                  <Clock className="h-4 w-4 text-zinc-300" />
                </div>
                <h4 className="text-zinc-200 font-medium text-sm">Pozostała przestrzeń</h4>
              </div>
              <div className="text-2xl font-bold text-zinc-200 mb-1">
                {formatBytes(Math.max(0, (limitsData.megabytesLimit - limitsData.megabytesUsed)) * 1024 * 1024)}
              </div>
              <p className="text-zinc-400 text-xs">
                Dostępne do końca miesiąca
              </p>
            </div>

            {/* Reset Date Card */}

          </div>

          <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-md p-4 mt-4 animate-slide-in-bottom">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-zinc-800/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-zinc-300" />
                </div>
                <h4 className="text-zinc-200 font-medium text-sm">Odświeżenie limitów</h4>
              </div>
              <div className="text-xl font-bold text-zinc-200 mb-1">
                {limitsData.resetAt ? formatResetDate(limitsData.resetAt) : 'Nie ustawiono'}
              </div>
              <p className="text-zinc-400 text-xs">
                Następny reset miesięczny
              </p>
            </div>

          </div>
          
        )}

        {/* Lifetime Statistics Section */}
        {!isLoading && limitsData && (
          <div className="space-y-6 animate-slide-in-bottom">
            {/* Lifetime Stats Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h2 className="text-lgxl text-zinc-200 font-medium tracking-tight flex items-center gap-2">
                <Activity className="h-5 w-5 text-zinc-400" />
                Statystyki lifetime
              </h2>
              <p className="text-zinc-400 text-sm">
                Twoje całkowite statystyki od początku korzystania z platformy
              </p>
            </div>

            {/* Lifetime Statistics Grid */}
            <div className="grid md:grid-cols-1 gap-4">
              {/* Files Uploaded Card */}
              <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <FileText className="h-5 w-5 text-zinc-300" />
                  </div>
                  <div>
                    <h4 className="text-zinc-200 font-medium">Przesłane pliki</h4>
                    <p className="text-zinc-400 text-sm">
                      Całkowita liczba przesłanych plików
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-200">
                  {limitsData.filesUploaded.toLocaleString()}
                </div>
              </div>

              {/* Links Generated Card */}
              <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-zinc-300" />
                  </div>
                  <div>
                    <h4 className="text-zinc-200 font-medium">Wygenerowane linki</h4>
                    <p className="text-zinc-400 text-sm">
                      Całkowita liczba wygenerowanych linków
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-200">
                  {limitsData.linksGenerated.toLocaleString()}
                </div>
              </div>

              <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <HardDriveUpload className="h-5 w-5 text-zinc-300" />
                  </div>
                  <div>
                    <h4 className="text-zinc-200 font-medium">Całkowite zużycie</h4>
                    <p className="text-zinc-400 text-sm">
                      Całkowite zużycie przestrzeni
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-200">
                  {formatBytes(limitsData.lifetimeMegabytesUsed * 1024 * 1024)}
                </div>
              </div>
            </div>

            {/* Additional Stats Summary */}
            <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-lg p-6">
              <h3 className="text-zinc-200 font-medium mb-4 tracking-tight flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-zinc-400" />
                Podsumowanie aktywności
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-200 mb-1">
                    {limitsData.filesUploaded + limitsData.linksGenerated}
                  </div>
                  <p className="text-zinc-400 text-sm">Całkowita aktywność</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-200 mb-1">
                    {limitsData.filesUploaded > 0 ? Math.round((limitsData.linksGenerated / limitsData.filesUploaded) * 100) : 0}%
                  </div>
                  <p className="text-zinc-400 text-sm">Stosunek linków do plików</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-200 mb-1">
                    {limitsData.filesUploaded > limitsData.linksGenerated ? 'Pliki' : limitsData.linksGenerated > limitsData.filesUploaded ? 'Linki' : 'Równe'}
                  </div>
                  <p className="text-zinc-400 text-sm">Dominująca aktywność</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-200 font-medium mb-3 tracking-tight flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-zinc-400" />
            Zwiększ swój limit 
          </h3>
          <div className="space-y-2 text-sm text-zinc-400">
               Poznaj nasze oferty i zwiększ swój limit o nawet 150x!
               Przejdź do sekcji Cennika aby dowiedzieć się więcej. Oferujemy ponad 3 plany.
          </div>
          <Link href="/pricing" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
            <Button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer mt-4" size="sm">
              Przejdź do cennika
            </Button>
          </Link> 
        </div>

        {/* Info Section */}
        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-200 font-medium mb-3 tracking-tight flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-zinc-400" />
            Informacje o limitach
          </h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>• Limity są indywidualne dla każdego użytkownika, każdy ma inny czas resetu i inne zużycie.</p>
            <p>• Limity są resetowane co miesiąc automatycznie</p>
            <p>• Po przekroczeniu limitu nie będziesz mógł przesyłać nowych plików</p>
            <p>• Możesz sprawdzić swoje zużycie w każdej chwili</p>
            <p>• Wszystkie pliki są liczone w limicie miesięcznym</p>
          </div>
        </div>
      </div>
    </main>
  );
}
