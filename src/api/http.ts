import axios from 'axios';

import type { ApiEnvelope } from '@/types/recruitment';
import { toFriendlyError } from '@/utils/errors';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 20000,
});

export async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const response = await request;
    if (response.data.code !== 0) {
      throw response;
    }
    return response.data.data;
  } catch (error) {
    throw toFriendlyError(error);
  }
}
