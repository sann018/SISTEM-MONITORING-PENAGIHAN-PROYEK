export type ApiErrorDetails = Record<string, string | string[]>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const getApiErrorPayload = (
  error: unknown
): { message?: string; errors?: ApiErrorDetails } | null => {
  if (!isRecord(error)) return null;

  const response = error['response'];
  if (!isRecord(response)) return null;

  const data = response['data'];
  if (!isRecord(data)) return null;

  const message = typeof data['message'] === 'string' ? data['message'] : undefined;

  const errorsRaw = data['errors'];
  if (!isRecord(errorsRaw)) {
    return { message };
  }

  const parsed: ApiErrorDetails = {};
  for (const [field, detail] of Object.entries(errorsRaw)) {
    if (typeof detail === 'string') {
      parsed[field] = detail;
      continue;
    }

    if (Array.isArray(detail) && detail.every((item) => typeof item === 'string')) {
      parsed[field] = detail;
    }
  }

  return Object.keys(parsed).length > 0 ? { message, errors: parsed } : { message };
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'string') return error;

  // Prefer structured API errors (Laravel 422, etc.) over Axios generic message.
  const apiPayload = getApiErrorPayload(error);
  if (apiPayload?.message) return apiPayload.message;

  if (apiPayload?.errors) {
    const first = Object.values(apiPayload.errors)[0];
    if (typeof first === 'string') return first;
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
  }

  if (isRecord(error) && typeof error['message'] === 'string') {
    return error['message'];
  }

  return fallback;
};
