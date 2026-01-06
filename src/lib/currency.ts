export function normalizeToIntegerString(num: string | number | null | undefined): string {
  const raw = String(num ?? '').trim();
  if (!raw) return '0';

  // Remove currency + spaces
  const cleaned = raw
    .replace(/rp\.?/gi, '')
    .replace(/\s+/g, '')
    .replace(/_/g, '');

  // If both separators exist, assume ID format: '.' thousands and ',' decimal.
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const noThousands = cleaned.replace(/\./g, '');
    return (noThousands.split(',')[0] || '0').replace(/\D/g, '') || '0';
  }

  // If dot looks like decimal (e.g. 2700000.00), take integer part only.
  const dotParts = cleaned.split('.');
  if (dotParts.length > 1) {
    const last = dotParts[dotParts.length - 1] || '';
    if (/^\d{1,2}$/.test(last)) {
      return (dotParts[0] || '0').replace(/\D/g, '') || '0';
    }
    // Otherwise treat dots as thousands separators.
    return cleaned.replace(/\./g, '').replace(/\D/g, '') || '0';
  }

  // If comma looks like decimal, take integer part only.
  const commaParts = cleaned.split(',');
  if (commaParts.length > 1) {
    const last = commaParts[commaParts.length - 1] || '';
    if (/^\d{1,2}$/.test(last)) {
      return (commaParts[0] || '0').replace(/\D/g, '') || '0';
    }
    // Otherwise treat commas as thousands separators.
    return cleaned.replace(/,/g, '').replace(/\D/g, '') || '0';
  }

  return cleaned.replace(/\D/g, '') || '0';
}

export function formatThousandsId(num: string | number | null | undefined): string {
  const intStr = normalizeToIntegerString(num);
  if (!intStr || intStr === '0') return '0';
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatRupiahNoDecimal(num: string | number | null | undefined): string {
  return `Rp. ${formatThousandsId(num)}`;
}
