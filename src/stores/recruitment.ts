import { defineStore } from 'pinia';

import type {
  EmergencyContact,
  OcrRecognizeResponse,
  RecruitmentProfileExtra,
  RecruitmentProgress,
  RecruitmentSubmitResult,
} from '@/types/recruitment';

interface DraftForm {
  realName: string;
  idCardNumber: string;
  phone: string;
  code: string;
  token: string;
  tokenExpiresAt: string;
  cityDistrict: string;
  detailedAddress: string;
  sourceChannel: string;
  emergencyContacts: EmergencyContact[];
  profileExtra: RecruitmentProfileExtra;
}

interface StoredImage {
  name: string;
  type: string;
  dataUrl: string;
}

interface RecruitmentState {
  draft: DraftForm;
  idCardImage: StoredImage | null;
  ocr: OcrRecognizeResponse | null;
  submitResult: RecruitmentSubmitResult | null;
  progress: RecruitmentProgress | null;
}

const STORAGE_KEY = 'srvf-h5-recruitment';

function defaultContacts(): EmergencyContact[] {
  return [
    { name: '', relation: 'parent', phone: '' },
    { name: '', relation: 'friend', phone: '' },
  ];
}

function defaultDraft(): DraftForm {
  return {
    realName: '',
    idCardNumber: '',
    phone: '',
    code: '',
    token: '',
    tokenExpiresAt: '',
    cityDistrict: '',
    detailedAddress: '',
    sourceChannel: 'offline_qr',
    emergencyContacts: defaultContacts(),
    profileExtra: {
      occupation: '',
      workUnit: '',
      educationCode: '',
      medicalNotes: '',
      exerciseExperience: '',
      rescueExperience: '',
      firstAidExperience: '',
      availability: '',
      hasVehicle: false,
      otherSkills: '',
      privacyConsentSigned: false,
      noCriminalRecordSigned: false,
      volunteerCommitmentSigned: false,
    },
  };
}

function loadState(): RecruitmentState {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { draft: defaultDraft(), idCardImage: null, ocr: null, submitResult: null, progress: null };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RecruitmentState>;
    const defaults = defaultDraft();
    const parsedDraft = (parsed.draft ?? {}) as Partial<DraftForm>;
    return {
      draft: {
        ...defaults,
        ...parsedDraft,
        emergencyContacts: parsedDraft.emergencyContacts ?? defaults.emergencyContacts,
        profileExtra: {
          ...defaults.profileExtra,
          ...parsedDraft.profileExtra,
        },
      },
      idCardImage: parsed.idCardImage ?? null,
      ocr: parsed.ocr ?? null,
      submitResult: parsed.submitResult ?? null,
      progress: parsed.progress ?? null,
    };
  } catch {
    return { draft: defaultDraft(), idCardImage: null, ocr: null, submitResult: null, progress: null };
  }
}

function persist(state: RecruitmentState): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      draft: state.draft,
      idCardImage: state.idCardImage,
      ocr: state.ocr,
      submitResult: state.submitResult,
      progress: state.progress,
    }),
  );
}

function dataUrlToFile(image: StoredImage): File {
  const [header, base64] = image.dataUrl.split(',');
  const mime = header.match(/data:(.*);base64/)?.[1] || image.type || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], image.name, { type: mime });
}

export const useRecruitmentStore = defineStore('recruitment', {
  state: (): RecruitmentState => loadState(),
  getters: {
    hasVerifiedPhone: (state) => Boolean(state.draft.token),
    idCardFile: (state): File | null => (state.idCardImage ? dataUrlToFile(state.idCardImage) : null),
  },
  actions: {
    remember() {
      persist(this.$state);
    },
    setToken(token: string, expiresAt: string) {
      this.draft.token = token;
      this.draft.tokenExpiresAt = expiresAt;
      this.remember();
    },
    setImage(file: File, dataUrl: string) {
      this.idCardImage = { name: file.name, type: file.type, dataUrl };
      this.ocr = null;
      this.submitResult = null;
      this.remember();
    },
    setOcr(ocr: OcrRecognizeResponse) {
      this.ocr = ocr;
      this.remember();
    },
    setSubmitResult(result: RecruitmentSubmitResult) {
      this.submitResult = result;
      this.remember();
    },
    setProgress(progress: RecruitmentProgress) {
      this.progress = progress;
      this.remember();
    },
    clearApplication() {
      this.draft = defaultDraft();
      this.idCardImage = null;
      this.ocr = null;
      this.submitResult = null;
      this.remember();
    },
  },
});
