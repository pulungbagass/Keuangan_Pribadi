export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Plain "YYYY-MM-DD" strings (no time component) are parsed by the JS `Date`
// constructor as UTC midnight, not local midnight. Converting that back to a
// locale string can then shift the date by a day depending on the user's UTC
// offset. Since these keys are already local calendar dates (see
// `getLocalDateKey`), we build the Date from its Y/M/D parts directly instead
// of letting the engine parse it as UTC.
function parseAsLocalDate(dateStr: string): Date {
  const plainDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (plainDateMatch) {
    const [, y, m, d] = plainDateMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(dateStr);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = parseAsLocalDate(dateStr);
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

// Derives a "YYYY-MM-DD" key from a full timestamp using the browser's LOCAL
// timezone (e.g. WIB/UTC+7), instead of slicing the raw UTC ISO string.
// Transactions are stored as UTC instants (`toISOString()`), so a transaction
// made at 05:00 WIB is still "yesterday" in UTC until 07:00 WIB — slicing the
// UTC string directly grouped those early-morning entries under the wrong day.
export function getLocalDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
