"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl = "/panel",
}: PaginationProps) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="flex items-center justify-center space-x-2 mt-8 animate-fade-in-01-text">
      {/* First page button */}
      {currentPage === 1 ? (
        <button
          disabled
          className="w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-600 cursor-not-allowed disabled:opacity-50"
          aria-label="Pierwsza strona"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      ) : (
        <Link
          href={`${baseUrl}?page=1`}
          className="w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          aria-label="Pierwsza strona"
          onClick={scrollToTop}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Link>
      )}

      {/* Previous page button */}
      {currentPage === 1 ? (
        <button
          disabled
          className="w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-600 cursor-not-allowed disabled:opacity-50"
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : (
        <Link
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          aria-label="Poprzednia strona"
          onClick={scrollToTop}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {/* Page indicator */}
      <div className="text-sm font-medium px-4 py-2 rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-400">
        Strona {currentPage} z {totalPages}
      </div>

      {/* Next page button */}
      {currentPage === totalPages ? (
        <button
          disabled
          className="w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-600 cursor-not-allowed disabled:opacity-50"
          aria-label="Następna strona"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          aria-label="Następna strona"
          onClick={scrollToTop}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}

      {/* Last page button */}
      {currentPage === totalPages ? (
        <button
          disabled
          className="w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-600 cursor-not-allowed disabled:opacity-50"
          aria-label="Ostatnia strona"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      ) : (
        <Link
          href={`${baseUrl}?page=${totalPages}`}
          className="w-10 h-10 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-950/10 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          aria-label="Ostatnia strona"
          onClick={scrollToTop}
        >
          <ChevronsRight className="h-4 w-4" />
        </Link>
      )}
      </div>
  );
}
