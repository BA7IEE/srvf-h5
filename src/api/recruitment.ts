import { http, unwrap } from '@/api/http';
import type {
  OcrRecognizeResponse,
  RecruitmentPayload,
  RecruitmentProgress,
  RecruitmentSubmitResult,
  SendCodeResponse,
  VerifyCodeResponse,
} from '@/types/recruitment';

const OPEN_RECRUITMENT = '/api/open/v1/recruitment';

export function sendRecruitmentCode(phone: string): Promise<SendCodeResponse> {
  return unwrap(http.post(`${OPEN_RECRUITMENT}/identity/send-code`, { phone }));
}

export function verifyRecruitmentCode(phone: string, code: string): Promise<VerifyCodeResponse> {
  return unwrap(http.post(`${OPEN_RECRUITMENT}/identity/verify-code`, { phone, code }));
}

export function recognizeIdCard(file: File): Promise<OcrRecognizeResponse> {
  const form = new FormData();
  form.append('documentTypeCode', 'mainland_id');
  form.append('idCardImage', file);
  return unwrap(http.post(`${OPEN_RECRUITMENT}/applications/recognize`, form));
}

export function submitRecruitment(payload: RecruitmentPayload, file: File): Promise<RecruitmentSubmitResult> {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  form.append('idCardImage', file);
  return unwrap(http.post(`${OPEN_RECRUITMENT}/applications`, form));
}

export function queryProgressByPhone(phone: string, code: string): Promise<RecruitmentProgress> {
  return unwrap(http.post(`${OPEN_RECRUITMENT}/applications/query-by-phone`, { phone, code }));
}
