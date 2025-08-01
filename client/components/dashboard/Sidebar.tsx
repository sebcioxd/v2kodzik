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
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTransition, useState } from "react";

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isRouting, startTransition] = useTransition();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="w-64 bg-darken backdrop-blur-sm border-dashed border-zinc-800 text-sm top-20 sticky h-full animate-fade-in-01-text">
      {/* User Info Section */}
      <div className="p-6 border-b border-dashed border-zinc-800">
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
      <div className="p-4 space-y-2">
        <Link
          href="/panel"
          className={cn(
            "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-all duration-100 group",
            "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
            "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
            pathname === "/panel" && "bg-zinc-800 text-zinc-200"
          )}
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
        >
          <Clipboard className="w-4 h-4 " />
          <span className="tracking-tight">Historia schowka</span>
        </Link>
      </div>

    

      {/* Logout Section */}
      <div className="p-4 mt-auto border-t border-dashed border-zinc-800">
      {session?.user.oauth && (
          <Link
            href="/oauth-password"
            className={cn(
                "flex items-center gap-3 px-2 py-1 mb-2 rounded-md text-sm transition-all duration-100 group",
              "bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm",
              "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              pathname === "/oauth-password" && "bg-zinc-800 text-zinc-200"
            )}
          >
            <Lock className="w-4 h-4 " />
            <span className="tracking-tight">Ustaw hasło</span>
          </Link>
        )}
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
              <span className="tracking-tight">Wyloguj</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}