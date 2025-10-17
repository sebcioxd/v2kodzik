"use client";

import { Check, Star, Zap, Crown, CreditCard, Building2, Smartphone } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const plans = [
  {
    name: "Plan Basic",
    planName: "basic",
    price: "11,99 zł / miesiąc",
    features: [
      "10 GB transferu miesięcznie",
      "Maks 1 GB co link",
      "Wsparcie priorytetowe",
    ],
    icon: Star,
    image: "https://cdn.dajkodzik.pl/kodzik-basic-no-bg.png",
  },
  {
    name: "Plan Plus",
    planName: "plus",
    price: "24,99 zł / miesiąc",
    features: [
      "50 GB transferu miesięcznie",
      "Maks 2 GB co link",
      "Wsparcie priorytetowe",
    ],
    icon: Zap,
    image: "https://cdn.dajkodzik.pl/kodizik-plus-no-bg.png",
  },
  {
    name: "Plan Pro",
    planName: "pro",
    price: "49,99 zł / miesiąc",
    features: [
      "150 GB transferu miesięcznie",
      "Maks 5 GB co link",
      "Wsparcie priorytetowe",
    ],
    icon: Crown,
    image: "https://cdn.dajkodzik.pl/kodzik-pro-no-bg.png",
  },
];

const paymentMethods = [
  {
    name: "Karty kredytowe/debetowe",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
  },
  {
    name: "Apple Pay/Google Pay",
    description: "Płatności online poprzez wygodne portfele",
    icon: Smartphone,
  },
  {
    name: "Klarna",
    description: "Płatności w ratach, zapłać później",
    icon: Smartphone,
  },
  {
    name: "PayPal i Revolut Pay",
    description: "Płatności online, znane fintech'y",
    icon: CreditCard,
  },
];

export default function PricingPage() {
  const { data: session } = authClient.useSession();
  const [loadingPlans, setLoadingPlans] = useState<Record<string, boolean>>({});
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);

  const router = useRouter();

  // Fetch user subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (session?.user) {
        try {
          const result = await authClient.subscription.list();
          setSubscriptions(result.data || []);
        } catch (error) {
          console.error('Error fetching subscriptions:', error);
        } finally {
          setIsLoadingSubscriptions(false);
        }
      } else {
        setIsLoadingSubscriptions(false);
      }
    };

    fetchSubscriptions();
  }, [session]);

  // Get active subscription
  const activeSubscription = subscriptions?.find(
    sub => sub.status === "active" || sub.status === "trialing"
  );

  const handleSelectPlan = async (planName: string) => {
    setLoadingPlans(prev => ({ ...prev, [planName]: true }));
    
    if (!session) {
      toast.error("Musisz być zalogowany, aby wybrać plan.");
      router.push("/auth");
      setLoadingPlans(prev => ({ ...prev, [planName]: false }));
      return;
    }

    try {
      await authClient.subscription.upgrade({
        plan: planName,
        annual: false,
        successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/panel/subscription`,
        cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
        returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/panel/subscription`,
        ...(activeSubscription?.id && { subscriptionId: activeSubscription.id }),
      });
    } catch (error) {
      console.error('Subscription upgrade error:', error);
    } finally {
      setLoadingPlans(prev => ({ ...prev, [planName]: false }));
    }
  }
  
  return (
    <main className="flex flex-col items-center w-full ">
      <div className="w-full max-w-4xl mx-auto space-y-8 px-2 py-12 animate-fade-in-01-text ">
        {/* Header */}
        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-8 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-5 w-5 text-zinc-400" />
            <h1 className="text-xl text-zinc-200  tracking-tight flex items-center gap-2">
              Plany zwiększające
            </h1>
          </div>
          <p className="text-zinc-400 text-md tracking-tight">
            Dajkodzik jest darmowym serwisem, lecz oferujemy również plany zwiększające domyślne limity. 
            Robimy to po to, aby użytkownicy mogli korzystać z naszego serwisu bez ograniczeń.
          </p>
        </div>


        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 animate-fade-in-01-text">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loadingPlans[plan.planName] || false;
            const isCurrentPlan = activeSubscription?.plan === plan.planName;
            
            return (
              <div
                key={plan.name}
                className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6 flex flex-col justify-between animate-fade-in-01-text"
              >
                
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-zinc-400" />
                  <span className="text-lg text-zinc-200 tracking-tight">{plan.name}</span>
                  {isCurrentPlan && (
                    <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">
                      Aktualny
                    </span>
                  )}
                </div>
                  <div className="text-2xl text-zinc-100 mb-4">{plan.price}</div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-zinc-300 text-sm tracking-tight">
                      <Check className="h-4 w-4 text-zinc-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Image src={plan.image} alt={plan.name} width={80} height={80} className="my-10 self-center"/>
                <Button
                  className={`w-full tracking-tight ${
                    isCurrentPlan 
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                      : 'bg-zinc-900 border border-dashed border-zinc-800 text-zinc-200 hover:bg-zinc-800'
                  }`}
                  size="sm"
                  onClick={() => handleSelectPlan(plan.planName)}
                  disabled={isLoading || isCurrentPlan}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    'Aktualny plan'
                  ) : (
                    activeSubscription ? 'Zmień plan' : 'Wybierz plan'
                  )}
                </Button>
               
              </div>
            );
          })}
        </div>

        {/* Payment Methods Section */}
        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6 animate-slide-in-left">
          <h3 className="text-zinc-200 font-medium mb-4 tracking-tight flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-400" />
            Metody płatności
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            Wszystkie płatności są przetwarzane przez Stripe - bezpieczny i zaufany system płatności online.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.name} className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg">
                  <Icon className="h-5 w-5 text-zinc-400" />
                  <div>
                    <div className="text-zinc-200 text-sm font-medium">{method.name}</div>
                    <div className="text-zinc-400 text-xs">{method.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6 animate-slide-in-left">
          <h3 className="text-zinc-200 font-medium mb-3 tracking-tight flex items-center gap-2">
            Minimalistyczny, przejrzysty i bez ukrytych kosztów
          </h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>• Większe limity i dłuższe przechowywanie plików</p>
            <p>• Priorytetowe wsparcie i brak reklam</p>
            <p>• Bezpieczne i szybkie przesyłanie plików</p>
            <p>• Możliwość anulowania w dowolnym momencie</p>
          </div>
        </div>
      </div>
    </main>
  );
}
