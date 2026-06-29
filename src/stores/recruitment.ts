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
  token: string;
  tokenExpiresAt: string;
  verifiedPhone: string;
  cityDistrict: string;
  detailedAddress: string;
  sourceChannel: string;
  emergencyContacts: EmergencyContact[];
  profileExtra: RecruitmentProfileExtra;
}

interface RecruitmentState {
  draft: DraftForm;
  verificationClock: number;
  idCardFile: File | null;
  idCardPreviewUrl: string;
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
    token: '',
    tokenExpiresAt: '',
    verifiedPhone: '',
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
    return {
      draft: defaultDraft(),
      verificationClock: Date.now(),
      idCardFile: null,
      idCardPreviewUrl: '',
      ocr: null,
      submitResult: null,
      progress: null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as { draft?: Partial<DraftForm> };
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
      verificationClock: Date.now(),
      idCardFile: null,
      idCardPreviewUrl: '',
      ocr: null,
      submitResult: null,
      progress: null,
    };
  } catch {
    return {
      draft: defaultDraft(),
      verificationClock: Date.now(),
      idCardFile: null,
      idCardPreviewUrl: '',
      ocr: null,
      submitResult: null,
      progress: null,
    };
  }
}

function persist(state: RecruitmentState): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      draft: state.draft,
    }),
  );
}

export const useRecruitmentStore = defineStore('recruitment', {
  state: (): RecruitmentState => loadState(),
  getters: {
    hasVerifiedPhone: (state) => {
      if (!state.draft.token || !state.draft.verifiedPhone || state.draft.verifiedPhone !== state.draft.phone.trim()) {
        return false;
      }
      const expiresAt = Date.parse(state.draft.tokenExpiresAt);
      return Number.isFinite(expiresAt) && expiresAt > state.verificationClock;
    },
  },
  actions: {
    refreshVerificationClock() {
      this.verificationClock = Date.now();
    },
    remember() {
      persist(this.$state);
    },
    setToken(phone: string, token: string, expiresAt: string) {
      this.refreshVerificationClock();
      this.draft.verifiedPhone = phone;
      this.draft.token = token;
      this.draft.tokenExpiresAt = expiresAt;
      this.remember();
    },
    setImage(file: File, previewUrl: string) {
      if (this.idCardPreviewUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(this.idCardPreviewUrl);
      }
      this.idCardFile = file;
      this.idCardPreviewUrl = previewUrl;
      this.ocr = null;
      this.submitResult = null;
    },
    setOcr(ocr: OcrRecognizeResponse) {
      this.ocr = ocr;
    },
    setSubmitResult(result: RecruitmentSubmitResult) {
      this.submitResult = result;
    },
    setProgress(progress: RecruitmentProgress) {
      this.progress = progress;
    },
    clearProgress() {
      this.progress = null;
    },
    clearApplication() {
      if (this.idCardPreviewUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(this.idCardPreviewUrl);
      }
      this.draft = defaultDraft();
      this.idCardFile = null;
      this.idCardPreviewUrl = '';
      this.ocr = null;
      this.submitResult = null;
      this.progress = null;
      this.remember();
    },
  },
});
