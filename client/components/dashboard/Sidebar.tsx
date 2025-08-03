"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  Target,
  History,
  LogOut,
  Loader2,
  Lock,
  FileText,
  Clipboard,
  Server,
  Settings,
  HardDrive,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTransition, useState } from "react";

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isRouting, startTransition] = useTransition();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-2 flex items-center gap-2 left-2 z-50 p-2 bg-darken/95 backdrop-blur-sm border border-dashed border-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200"
      >
        <Menu className="w-5 h-5" /> <span className="text-zinc-200 font-medium">Menu</span>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar - Desktop layout unchanged, mobile gets responsive classes */}
      <div className={cn(
        // Desktop: exactly as before (sticky positioning)
        "lg:w-64 lg:bg-darken lg:backdrop-blur-sm lg:border-dashed lg:border-zinc-800 lg:text-sm lg:top-20 lg:sticky lg:h-full lg:animate-fade-in-01-text",
        // Mobile: overlay sidebar (fixed positioning)
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out w-64 bg-darken backdrop-blur-sm border-dashed border-zinc-800 text-sm",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Header - Only visible on mobile */}
        <div className="flex items-center justify-between p-4 border-b border-dashed border-zinc-800 lg:hidden">
          <div className="space-y-1">
            <p className="text-zinc-200 font-medium tracking-tight">
              {session?.user.name}
            </p>
            <p className="text-zinc-400 text-sm tracking-tight">
              {session?.user.email}
            </p>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop User Info - Hidden on mobile since we have mobile header */}
        <div className="hidden lg:block py-4 pl-2 border-b border-dashed border-zinc-800">
          <div className="space-y-1">
            <p className="text-zinc-200 font-medium tracking-tight">
              {session?.user.name}
            </p>
            <p className="text-zinc-400 text-sm tracking-tight">
              {session?.user.email}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="py-4 pr-4 space-y-2">
          <Link
            href="/panel"
            className={cn(
              "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              pathname === "/panel" && "bg-zinc-800 text-zinc-200"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <Target className="w-4 h-4 " />
            <span className="tracking-tight">Przegląd</span>
          </Link>

          <Link
            href="/panel/history"
            className={cn(
              "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              pathname === "/panel/history" && "bg-zinc-800 text-zinc-200"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <FileText className="w-4 h-4 " />
            <span className="tracking-tight">Historia plików</span>
          </Link>

          <Link
            href="/panel/s-history"
            className={cn(
              "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              pathname === "/panel/s-history" && "bg-zinc-800 text-zinc-200"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <Clipboard className="w-4 h-4 " />
            <span className="tracking-tight">Historia schowka</span>
          </Link>
        </div>

        {/* Settings/Password/Integrations Section*/}
        <div className="py-4 pr-4 mt-auto border-t border-dashed border-zinc-800 space-y-2">
          <Link
            href="/panel/integrations"
            className={cn(
              "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              pathname === "/panel/integrations" && "bg-zinc-800 text-zinc-200"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <Server className="w-4 h-4 " />
            <span className="tracking-tight">Integracje</span>
          </Link>
          <Link
            href="/panel/settings"
            className={cn(
              "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              pathname === "/panel/settings" && "bg-zinc-800 text-zinc-200"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <Settings className="w-4 h-4 " />
            <span className="tracking-tight">Ustawienia</span>
          </Link>
          {session?.user.oauth && (
            <Link
              href="/oauth-password"
              className={cn(
                "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
                "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
                "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                pathname === "/oauth-password" && "bg-zinc-800 text-zinc-200"
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <Lock className="w-4 h-4 " />
              <span className="tracking-tight">Ustaw hasło</span>
            </Link>
          )}
        </div>

        <div className="py-4 pr-4 mt-auto border-t border-dashed border-zinc-800 space-y-2">
          <Link
            href="/panel/limits"
            className={cn(
              "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              pathname === "/panel/limits" && "bg-zinc-800 text-zinc-200"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <HardDrive className="w-4 h-4 " />
            <span className="tracking-tight">Twój transfer</span>
          </Link>
          <Link
            href="/panel/subscription"
            className={cn(
              "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              pathname === "/panel/subscription" && "bg-zinc-800 text-zinc-200"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <CreditCard className="w-4 h-4 " />
            <span className="tracking-tight">Subskrypcje</span>
          </Link>
        </div>

        {/* Logout Section */}
        <div className="py-4 pr-4 mt-auto border-t border-dashed border-zinc-800 space-y-2">
          <button
            onClick={async () => {
              setIsLogoutLoading(true);
              await authClient.signOut({
                fetchOptions: {
                  credentials: "include",
                  onSuccess: () => {
                    setIsLogoutLoading(false);
                    startTransition(() => {
                      router.push("/auth");
                    });
                  },
                },
              });
            }}
            className={cn(
              "w-full flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            {isLogoutLoading || isRouting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="tracking-tight">Wylogowywanie...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 " />
                <span className="tracking-tight">Wyloguj się</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}