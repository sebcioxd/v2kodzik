"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Target, FileText, Clipboard, Settings } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/panel", icon: Target, label: "Przegląd" },
    { href: "/panel/history", icon: FileText, label: "Pliki" },
    { href: "/panel/s-history", icon: Clipboard, label: "Schowek" },
    { href: "/panel/settings", icon: Settings, label: "Ustawienia" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-darken/95 backdrop-blur-sm border-t border-dashed border-zinc-800">
      <div className="flex justify-around p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center p-12 rounded-md text-xs transition-all",
              "text-zinc-400 hover:text-zinc-200",
              pathname === item.href && "text-zinc-200 bg-zinc-800"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
} 