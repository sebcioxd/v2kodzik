"use client";

import { 
  CreditCard, 
  Crown, 
  Star, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowRight,
  ExternalLink,
  Loader2,
  X,
  RefreshCw,
  Settings,
  Plus
} from 'lucide-react';
import { User as UserType } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import Link from 'next/link';
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

// Type for subscription data
type Subscription = {
  id: string;
  plan: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialStart?: string;
  trialEnd?: string;
  seats?: number;
  stripeCustomerId?: string;
};

// Plan definitions matching your auth.ts configuration
const plans = [
  {
    name: "basic",
    displayName: "BASIC",
    price: "11,99 zł / miesiąc",
    features: [
      "10 GB transferu miesięcznie",
      "Zwiększenie do 1 GB co link",
      "Wsparcie priorytetowe",
    ],
    icon: Star,
  },
  {
    name: "plus",
    displayName: "PLUS", 
    price: "24,99 zł / miesiąc",
    features: [
      "50 GB transferu miesięcznie",
      "Zwiększenie do 2 GB co link",
      "Wsparcie priorytetowe",
    ],
    icon: Zap,
  },
  {
    name: "pro",
    displayName: "PRO",
    price: "49,99 zł / miesiąc", 
    features: [
      "150 GB transferu miesięcznie",
      "Zwiększenie do 2 GB co link",
      "Wsparcie priorytetowe",
    ],
    icon: Crown,
  },
];

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to get plan details
const getPlanDetails = (planName: string) => {
  return plans.find(plan => plan.name === planName) || plans[0];
};

// Helper function to get status info
const getStatusInfo = (status: string, cancelAtPeriodEnd: boolean) => {
  if (cancelAtPeriodEnd) {
    return {
      text: 'Anulowane (aktywne do końca okresu)',
      icon: AlertTriangle
    };
  }
  
  switch (status) {
    case 'active':
      return {
        text: 'Aktywne',
        icon: CheckCircle
      };
    case 'trialing':
      return {
        text: 'Okres próbny',
        icon: Calendar
      };
    case 'canceled':
      return {
        text: 'Anulowane',
        icon: X
      };
    default:
      return {
        text: status,
        icon: AlertTriangle
      };
  }
};

interface SubscriptionsProps {
  user: UserType;
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
}

export default function Subscriptions({ 
  user, 
  subscriptions, 
  isLoading, 
  error 
}: SubscriptionsProps) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const activeSubscription = subscriptions?.find(
    sub => sub.status === "active" || sub.status === "trialing"
  );

  // Find subscription that was canceled but still active (cancelAtPeriodEnd = true)
  const canceledButActiveSubscription = subscriptions?.find(
    sub => sub.cancelAtPeriodEnd === true && (sub.status === "active" || sub.status === "trialing")
  );

  const handleUpgrade = async (planName: string) => {
    setIsUpgrading(planName);
    try {
      await authClient.subscription.upgrade({
        plan: planName,
        annual: false,
        successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/panel/subscription`,
        cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/panel/subscription`,
        returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/panel/subscription`,
        ...(activeSubscription?.id && { subscriptionId: activeSubscription.id }),
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Błąd podczas aktualizacji subskrypcji');
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleRestore = async () => {
    if (!canceledButActiveSubscription) return;
    
    setIsRestoring(true);
    try {
      await authClient.subscription.restore({
        subscriptionId: canceledButActiveSubscription.id,
      });
      toast.success('Subskrypcja została przywrócona');
      window.location.reload();
    } catch (error) {
      console.error('Error restoring subscription:', error);
      toast.error('Błąd podczas przywracania subskrypcji');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancel = async () => {
    if (!activeSubscription) return;
    
    setIsCanceling(true);
    try {
      await authClient.subscription.cancel({
        subscriptionId: activeSubscription.id,
        returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/panel/subscription`,
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Błąd podczas anulowania subskrypcji');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    if (!activeSubscription?.stripeCustomerId) {
      toast.error('Nie można otworzyć portalu rozliczeniowego');
      return;
    }

    setIsOpeningPortal(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/stripe/portal/${activeSubscription.stripeCustomerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const data = await response.json();
      
      // Open the billing portal in a new window/tab
      window.open(data.url, '_blank');
      toast.success('Portal rozliczeniowy otwarty w nowej karcie');
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Błąd podczas otwierania portalu rozliczeniowego');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-[400px]">
        <div className="text-zinc-400">{error}</div>
      </main>
    );
  }

  return (
    <main className="">
      <div className="w-full space-y-6 animate-fade-in-01-text">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl text-zinc-200 font-medium tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-zinc-400" />
            Subskrypcja
          </h2>
          <p className="text-zinc-400 text-sm">
            Zarządzaj swoją subskrypcją i planami
          </p>
        </div>

        {/* Current Subscription */}
        {!isLoading && (
          <div className="space-y-4">
            <h3 className="text-md text-zinc-200 font-medium tracking-tight flex items-center gap-2 animate-fade-in-01-text">
              <Crown className="h-4 w-4 text-zinc-400" />
              Aktualna subskrypcja
            </h3>

            {!activeSubscription ? (
              <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6 text-center animate-slide-in-bottom">
                <Star className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">Brak aktywnej subskrypcji</p>
                <p className="text-zinc-500 text-sm mb-4">
                  Aktualnie korzystasz z darmowego planu. Rozważ upgrade, aby uzyskać więcej funkcji.
                </p>
                <Link href="/pricing">
                  <Button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
                    Zobacz plany
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6 animate-slide-in-bottom">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const plan = getPlanDetails(activeSubscription.plan);
                      const Icon = plan.icon;
                      return (
                        <div className="p-3 bg-zinc-800/50 rounded-lg">
                          <Icon className="h-6 w-6 text-zinc-300" />
                        </div>
                      );
                    })()}
                    <div>
                      <h4 className="text-zinc-200 font-medium tracking-tight">
                        {getPlanDetails(activeSubscription.plan).displayName}
                      </h4>
                      <p className="text-zinc-400 text-sm">
                        {getPlanDetails(activeSubscription.plan).price}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {(() => {
                      const statusInfo = getStatusInfo(activeSubscription.status, activeSubscription.cancelAtPeriodEnd);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-zinc-800/50 text-zinc-300">
                          <StatusIcon className="h-4 w-4" />
                          {statusInfo.text}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="h-4 w-4" />
                      <span>Okres rozliczeniowy:</span>
                    </div>
                    <div className="text-zinc-200 text-sm">
                      {formatDate(activeSubscription.periodStart)} - {formatDate(activeSubscription.periodEnd)}
                    </div>
                  </div>
                  
                  {activeSubscription.trialEnd && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        <span>Okres próbny do:</span>
                      </div>
                      <div className="text-zinc-200 text-sm">
                        {formatDate(activeSubscription.trialEnd)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {canceledButActiveSubscription ? (
                    <Button
                      onClick={handleRestore}
                      disabled={isRestoring}
                      variant="outline"
                      size="sm"
                      className="text-zinc-300 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700"
                    >
                      {isRestoring ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Przywróć subskrypcję
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleCancel}
                        disabled={isCanceling}
                        variant="outline"
                        size="sm"
                        className="text-zinc-300 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700"
                      >
                        {isCanceling ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Anuluj subskrypcję
                          </>
                        )}
                      </Button>
                      
                      {activeSubscription.stripeCustomerId && (
                        <Button
                          onClick={handleOpenBillingPortal}
                          disabled={isOpeningPortal}
                          variant="outline"
                          size="sm"
                          className="text-zinc-300 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700"
                        >
                          {isOpeningPortal ? (
                            <LoadingSpinner size="small" />
                          ) : (
                            <>
                              <Settings className="h-4 w-4 mr-2" />
                              Zarządzaj rozliczeniami
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Available Plans */}
        {!isLoading && (
          <div className="space-y-4">
            <h3 className="text-md text-zinc-200 font-medium tracking-tight flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-zinc-400" />
              Dostępne plany
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = activeSubscription?.plan === plan.name;
                const isLoading = isUpgrading === plan.name;
                
                return (
                  <div 
                    key={plan.name}
                    className={`bg-zinc-900/20 border rounded-lg p-4 ${
                      isCurrentPlan 
                        ? 'border-zinc-700 bg-zinc-800/20' 
                        : 'border-dashed border-zinc-800 hover:bg-zinc-800/20'
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl font-mono text-zinc-100 font-bold tracking-tight">
                        {plan.displayName}
                      </span>
                      {isCurrentPlan && (
                        <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">
                          Aktualny
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xl font-semibold text-zinc-100 mb-3">
                      {plan.price}
                    </div>
                    
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-zinc-300 text-sm">
                          <Plus className="h-4 w-4 text-zinc-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={isCurrentPlan || isLoading}
                      className={`w-full ${
                        isCurrentPlan 
                          ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                      size="sm"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="small" />
                      ) : isCurrentPlan ? (
                        'Aktualny plan'
                      ) : (
                        <>
                          {activeSubscription ? 'Zmień plan' : 'Wybierz plan'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Section */}
        {!isLoading && ( 
        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-200 font-medium mb-3 tracking-tight flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-400" />
            Informacje o subskrypcji
          </h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>• Możesz anulować subskrypcję w każdej chwili</p>
            <p>• Po anulowaniu subskrypcja pozostanie aktywna do końca okresu rozliczeniowego</p>
            <p>• Zmiana planu następuje natychmiastowo</p>
            <p>• Wszystkie płatności są przetwarzane przez Stripe</p>
            <p>• Możesz zarządzać rozliczeniami w portalu Stripe</p>
          </div>
        </div>
        )}

      </div>
    </main>
  );
}
