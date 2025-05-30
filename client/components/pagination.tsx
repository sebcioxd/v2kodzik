"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

type ButtonType = 'first' | 'prev' | 'next' | 'last' | null;

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl = "/panel",
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeButton, setActiveButton] = useState<ButtonType>(null);
  
  // Reset activeButton when the route changes
  useEffect(() => {
    setActiveButton(null);
  }, [pathname, searchParams]);

  const handleClick = (buttonType: ButtonType) => {
    setActiveButton(buttonType);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const buttonClasses = {
    enabled: "w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors",
    disabled: "w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-600 cursor-not-allowed opacity-50"
  };

  const ButtonContent = ({ icon, type }: { icon: React.ReactNode, type: ButtonType }) => (
    activeButton === type ? <Loader2 className="h-4 w-4 animate-spin" /> : icon
  );

  return (
    <div className="flex items-center justify-center space-x-2 mt-8 animate-fade-in-01-text">
      {/* First page button */}
      {currentPage === 1 || activeButton !== null ? (
        <button
          disabled
          className={buttonClasses.disabled}
          aria-label="Pierwsza strona"
        >
          <ButtonContent icon={<ChevronsLeft className="h-4 w-4" />} type="first" />
        </button>
      ) : (
        <Link
          href={createPageUrl(1)}
          className={buttonClasses.enabled}
          aria-label="Pierwsza strona"
          onClick={() => handleClick("first")}
        >
          <ButtonContent icon={<ChevronsLeft className="h-4 w-4" />} type="first" />
        </Link>
      )}

      {/* Previous page button */}
      {currentPage === 1 || activeButton !== null ? (
        <button
          disabled
          className={buttonClasses.disabled}
          aria-label="Poprzednia strona"
        >
          <ButtonContent icon={<ChevronLeft className="h-4 w-4" />} type="prev" />
        </button>
      ) : (
        <Link
          href={createPageUrl(currentPage - 1)}
          className={buttonClasses.enabled}
          aria-label="Poprzednia strona"
          onClick={() => handleClick("prev")}
        >
          <ButtonContent icon={<ChevronLeft className="h-4 w-4" />} type="prev" />
        </Link>
      )}

      {/* Page indicator */}
      <div className="text-sm font-medium px-4 py-2 rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-400">
        Strona {currentPage} z {totalPages}
      </div>

      {/* Next page button */}
      {currentPage === totalPages || activeButton !== null ? (
        <button
          disabled
          className={buttonClasses.disabled}
          aria-label="Następna strona"
        >
          <ButtonContent icon={<ChevronRight className="h-4 w-4" />} type="next" />
        </button>
      ) : (
        <Link
          href={createPageUrl(currentPage + 1)}
          className={buttonClasses.enabled}
          aria-label="Następna strona"
          onClick={() => handleClick("next")}
        >
          <ButtonContent icon={<ChevronRight className="h-4 w-4" />} type="next" />
        </Link>
      )}

      {/* Last page button */}
      {currentPage === totalPages || activeButton !== null ? (
        <button
          disabled
          className={buttonClasses.disabled}
          aria-label="Ostatnia strona"
        >
          <ButtonContent icon={<ChevronsRight className="h-4 w-4" />} type="last" />
        </button>
      ) : (
        <Link
          href={createPageUrl(totalPages)}
          className={buttonClasses.enabled}
          aria-label="Ostatnia strona"
          onClick={() => handleClick("last")}
        >
          <ButtonContent icon={<ChevronsRight className="h-4 w-4" />} type="last" />
        </Link>
      )}
    </div>
  );
}
