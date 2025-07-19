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
  