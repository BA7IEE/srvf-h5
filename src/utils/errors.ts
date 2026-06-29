import type { AxiosError } from 'axios';

const ERROR_TEXT: Record<number, string> = {
  40000: '请检查填写内容，必填项或格式不正确。',
  19010: '紧急联系人关系暂不可用，请重新选择关系。',
  24010: '验证码不正确或已过期，请重新获取。',
  24002: '验证码不存在或已失效，请重新获取。',
  24030: '短信服务暂未启用，请稍后再试。',
  24031: '短信发送失败，请稍后重试。',
  24120: '发送过于频繁，请稍后再试。',
  24121: '这个手机号今天获取验证码次数已达上限。',
  27030: '证件识别服务暂未启用，请稍后再试。',
  27031: '证件识别服务暂时不可用，请稍后重试。',
  28001: '招新轮次不存在，请返回首页稍后再试。',
  28002: '没有查到你的报名记录。',
  28003: '本轮你已提交报名，请勿重复提交。',
  28010: '报名年龄需在 18 至 60 周岁之间。',
  28011: '请上传清晰的身份证照片。',
  28030: '当前没有开放报名的招新轮次。',
  28031: '本轮招新名额已满。',
  28040: '当前报名状态不支持这个操作。',
  28050: '手机验证已失效，请重新获取验证码。',
  28051: '该身份已绑定其他报名记录，请核对后再试。',
  42900: '请求过于频繁，请稍后再试。',
};

interface ApiErrorBody {
  code?: number;
  message?: string;
}

export class FriendlyApiError extends Error {
  readonly code: number | null;

  constructor(message: string, code: number | null = null) {
    super(message);
    this.name = 'FriendlyApiError';
    this.code = code;
  }
}

export function toFriendlyError(error: unknown): FriendlyApiError {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const body = axiosError.response?.data;
  const code = typeof body?.code === 'number' ? body.code : null;

  if (code !== null && ERROR_TEXT[code]) {
    return new FriendlyApiError(ERROR_TEXT[code], code);
  }

  if (!axiosError.response) {
    return new FriendlyApiError('网络连接失败，请确认后端服务可用。');
  }

  return new FriendlyApiError(body?.message || '操作失败，请稍后重试。', code);
}
