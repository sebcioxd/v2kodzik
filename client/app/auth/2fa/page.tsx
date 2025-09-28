import TwoFactorComponent from "@/components/auth/two-factor"
import { Suspense } from "react";

const TwoFactorPage = async () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <TwoFactorComponent /> 
    </Suspense>
  )
}

export default TwoFactorPage