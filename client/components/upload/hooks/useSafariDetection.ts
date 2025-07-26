import { useState, useEffect } from "react";
import { isSafariBrowser } from "../upload.utils";

export function useSafariDetection(userAgent?: string) {
  const [showSafariDialog, setShowSafariDialog] = useState(false);

  useEffect(() => {
    if (userAgent && !localStorage.getItem("safari_accepted") && isSafariBrowser(userAgent)) {
      setShowSafariDialog(true);
    }
  }, [userAgent]);

  const handleSafariProceed = () => {
    setShowSafariDialog(false);
    localStorage.setItem("safari_accepted", "true");
  };

  return {
    showSafariDialog,
    handleSafariProceed,
  };
}