export function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      const localDate = new Date(date.getTime() - (2 * 60 * 60 * 1000));
      return localDate.toLocaleDateString('pl-PL', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data niedostępna';
    }
  }
  
  export const formatTimeRemaining = (createdAt: string, expiresAt: string) => {
    if (!expiresAt) {
        return "Czas nieznany";
    }
    
    const expires = new Date(expiresAt);
    const localExpires = new Date(expires.getTime() - (2 * 60 * 60 * 1000));
    
    const now = new Date();
    const diff = localExpires.getTime() - now.getTime();
   
    if (diff <= 0) {
        return "Wygaśnie w ciągu kilku godz.";
    }
   
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
   
    if (hours === 0) {
        return `${minutes}m`;
    }
   
    return `${hours}h ${minutes}m`;
};