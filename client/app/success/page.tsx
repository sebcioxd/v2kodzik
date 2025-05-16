import { Suspense } from "react";
import Success from "@/components/success";

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center">
        <div className="animate-spin text-zinc-400">Ładowanie...</div>
      </div>
    }>
      <Success />
    </Suspense>
  );
}