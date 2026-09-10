export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

export function formatDateTimeIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${formatDateIndo(dateStr)}, ${formatTimeIndo(dateStr)} WIB`;
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function getRelativeDays(dateStr: string): { label: string; isUrgent: boolean; isPassed: boolean } {
  try {
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Lewat ${Math.abs(diffDays)} hari`,
        isUrgent: true,
        isPassed: true,
      };
    } else if (diffDays === 0) {
      return {
        label: 'Hari ini!',
        isUrgent: true,
        isPassed: false,
      };
    } else if (diffDays === 1) {
      return {
        label: 'Besok',
        isUrgent: true,
        isPassed: false,
      };
    } else {
      return {
        label: `${diffDays} hari lagi`,
        isUrgent: diffDays <= 3,
        isPassed: false,
      };
    }
  } catch {
    return { label: dateStr, isUrgent: false, isPassed: false };
  }
}
