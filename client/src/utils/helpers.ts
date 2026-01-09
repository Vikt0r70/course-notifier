export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  const intervals = {
    سنة: 31536000,
    شهر: 2592000,
    أسبوع: 604800,
    يوم: 86400,
    ساعة: 3600,
    دقيقة: 60,
    ثانية: 1,
  };

  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval);
    if (interval >= 1) {
      return `منذ ${interval} ${name}`;
    }
  }

  return 'الآن';
};

export const getStatusColor = (isOpen: boolean): string => {
  return isOpen ? 'text-success' : 'text-danger';
};

export const getStatusBadge = (isOpen: boolean): string => {
  return isOpen ? 'badge-open' : 'badge-closed';
};
