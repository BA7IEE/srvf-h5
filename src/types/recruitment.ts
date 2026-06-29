export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface RecruitmentPayload {
  phoneVerificationToken?: string;
  realName: string;
  idCardNumber: string;
  documentTypeCode: 'mainland_id';
  phone: string;
  detailedAddress: string;
  cityDistrict: string;
  sourceChannel: string;
  emergencyContacts: EmergencyContact[];
  profileExtra?: RecruitmentProfileExtra;
  applicantConfirmedOcrWrong?: boolean;
}

export interface RecruitmentProfileExtra {
  occupation: string;
  workUnit: string;
  educationCode: string;
  medicalNotes: string;
  exerciseExperience: string;
  rescueExperience: string;
  firstAidExperience: string;
  availability: string;
  hasVehicle: boolean;
  otherSkills: string;
  privacyConsentSigned: boolean;
  noCriminalRecordSigned: boolean;
  volunteerCommitmentSigned: boolean;
}

export interface SendCodeResponse {
  expiresInSeconds: number;
}

export interface VerifyCodeResponse {
  phoneVerificationToken: string;
  expiresAt: string;
}

export interface OcrRecognizedFields {
  realName: string | null;
  idCardNumber: string | null;
}

export interface OcrFieldDetail {
  content: string | null;
  reflect: boolean;
  incomplete: boolean;
}

export interface OcrCardWarnings {
  copy: boolean;
  reshoot: boolean;
  ps: boolean;
  border: boolean;
  occlusion: boolean;
  blur: boolean;
}

export interface OcrDetail {
  sex: OcrFieldDetail | null;
  nation: OcrFieldDetail | null;
  birth: OcrFieldDetail | null;
  address: OcrFieldDetail | null;
  authority: OcrFieldDetail | null;
  validDate: OcrFieldDetail | null;
  documentType: string | null;
  cardWarnings: OcrCardWarnings | null;
}

export interface OcrRecognizeResponse {
  ocrSupported: boolean;
  clarityOk: boolean;
  recognized: OcrRecognizedFields | null;
  antiForgeryWarnings: string[];
  documentCategory: string | null;
  hint: string | null;
  ocrDetail: OcrDetail | null;
}

export type SubmitOutcome = 'submitted' | 'retake' | 'confirm' | 'retry';

export interface RecruitmentSubmitResult {
  outcome: SubmitOutcome;
  statusCode: string | null;
  tempNo: string | null;
  stage: string | null;
  stageText: string | null;
  nextAction: string | null;
  hint: string | null;
  recognized: OcrRecognizedFields | null;
  cycleName: string;
  meetingInfo: string | null;
  qqGroup: string | null;
  notifyTemplate: Record<string, unknown> | null;
}

export interface RecruitmentTodoItem {
  code: string;
  name: string;
  done: boolean;
}

export interface RecruitmentProgress {
  stage: string;
  stageText: string;
  statusText: string;
  nextAction: string | null;
  tempNo: string | null;
  memberNo: string | null;
  identityText: string;
  todoList: RecruitmentTodoItem[];
  meetingInfo: string | null;
  qqGroup: string | null;
  notice: Record<string, unknown> | null;
}
