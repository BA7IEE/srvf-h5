<template>
  <PageFrame>
    <section class="hero">
      <p class="eyebrow">STEP 3 / 3</p>
      <h1 class="title">核对信息</h1>
      <p class="subtitle">确认填写资料与身份证识别结果一致后再提交。</p>
    </section>

    <div class="stack">
      <section class="panel">
        <h2 class="section-title">身份核对</h2>
        <div class="kv"><span>填写姓名</span><strong>{{ draft.realName }}</strong></div>
        <div class="kv"><span>识别姓名</span><strong>{{ recognizedName || '未识别' }}</strong></div>
        <div class="kv"><span>填写身份证</span><strong>{{ draft.idCardNumber }}</strong></div>
        <div class="kv"><span>识别身份证</span><strong>{{ recognizedId || '未识别' }}</strong></div>
        <div class="kv"><span>手机号</span><strong>{{ draft.phone }}</strong></div>
      </section>

      <section class="panel">
        <h2 class="section-title">报名资料</h2>
        <div class="kv"><span>所在区县</span><strong>{{ draft.cityDistrict }}</strong></div>
        <div class="kv"><span>详细住址</span><strong>{{ draft.detailedAddress }}</strong></div>
        <div class="kv"><span>报名来源</span><strong>{{ sourceText }}</strong></div>
        <div class="kv"><span>职业</span><strong>{{ draft.profileExtra.occupation }}</strong></div>
        <div class="kv"><span>单位/学校</span><strong>{{ draft.profileExtra.workUnit }}</strong></div>
        <div class="kv"><span>学历</span><strong>{{ educationText }}</strong></div>
        <div class="kv"><span>车辆</span><strong>{{ draft.profileExtra.hasVehicle ? '有' : '无' }}</strong></div>
      </section>

      <section class="panel">
        <h2 class="section-title">经历与时间</h2>
        <div class="kv multiline"><span>健康说明</span><strong>{{ draft.profileExtra.medicalNotes }}</strong></div>
        <div class="kv multiline"><span>运动经历</span><strong>{{ draft.profileExtra.exerciseExperience }}</strong></div>
        <div class="kv multiline"><span>急救经历</span><strong>{{ draft.profileExtra.firstAidExperience }}</strong></div>
        <div class="kv multiline"><span>救援/志愿</span><strong>{{ draft.profileExtra.rescueExperience }}</strong></div>
        <div class="kv multiline"><span>可参与时间</span><strong>{{ draft.profileExtra.availability }}</strong></div>
        <div class="kv multiline"><span>其他技能</span><strong>{{ draft.profileExtra.otherSkills || '无' }}</strong></div>
      </section>

      <section class="panel">
        <h2 class="section-title">紧急联系人</h2>
        <div v-for="(contact, index) in draft.emergencyContacts" :key="index" class="contact-summary">
          <strong>{{ contact.name || `联系人${index + 1}` }}</strong>
          <span>{{ relationText(contact.relation) }} · {{ contact.phone }}</span>
        </div>
      </section>

      <div class="notice" :class="{ warning: !store.hasVerifiedPhone }">
        {{
          store.hasVerifiedPhone
            ? '手机号身份链已就绪，可提交报名。'
            : phoneVerificationNotice
        }}
      </div>

      <div v-if="blockReason" class="notice warning">{{ blockReason }}</div>
      <div v-if="qualityNotice" class="notice">{{ qualityNotice }}</div>
      <div v-if="backendConfirmMode" class="notice warning">
        后端核验结果与你填写的信息不一致，请选择处理方式。
      </div>
      <div v-else-if="precheckMismatchReason" class="notice">
        {{ precheckMismatchReason }}
      </div>

      <div v-if="backendConfirmMode" class="stack">
        <van-button block plain type="primary" @click="useOcrAndResubmit">使用后端识别结果并提交</van-button>
        <van-button block plain type="primary" @click="editForm">修改填写</van-button>
        <van-button block type="primary" :loading="submitting" @click="submit(true)">
          确认 OCR 识别有误，按我填写的信息提交人工复核
        </van-button>
      </div>
      <div v-else-if="precheckMismatchReason" class="stack">
        <van-button block plain type="primary" @click="useOcr">使用识别结果</van-button>
        <van-button block plain type="primary" @click="editForm">返回修改</van-button>
        <van-button block type="primary" :loading="submitting" @click="submit(false)">
          继续提交，以后端最终核验为准
        </van-button>
      </div>
      <div v-else class="actions">
        <van-button block plain type="primary" @click="editForm">修改填写</van-button>
      </div>
      <div v-if="!backendConfirmMode && !precheckMismatchReason" class="actions">
        <van-button block type="primary" size="large" :loading="submitting" @click="submit(false)">
          提交报名
        </van-button>
      </div>
    </div>
  </PageFrame>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { showToast } from 'vant';
import { useRouter } from 'vue-router';

import { submitRecruitment } from '@/api/recruitment';
import PageFrame from '@/components/PageFrame.vue';
import { useRecruitmentStore } from '@/stores/recruitment';
import type { RecruitmentPayload, RecruitmentProfileExtra } from '@/types/recruitment';
import { FriendlyApiError } from '@/utils/errors';
import { normalizeIdCard, sameText } from '@/utils/validators';

const router = useRouter();
const store = useRecruitmentStore();
const draft = store.draft;
const submitting = ref(false);
const phoneChangedAfterVerification = ref(false);
let verificationTimer: number | null = null;

store.refreshVerificationClock();
verificationTimer = window.setInterval(() => {
  store.refreshVerificationClock();
}, 30000);

watch(
  () => draft.phone,
  (phone) => {
    if (draft.verifiedPhone && draft.verifiedPhone !== phone.trim()) {
      store.clearToken();
      phoneChangedAfterVerification.value = true;
      showToast('手机号已变更，请重新验证');
    }
  },
);

const sourceLabels: Record<string, string> = {
  offline_qr: '线下二维码',
  friend_referral: '队员推荐',
  wechat_channel: '公众号/社群',
  event_site: '活动现场',
  other: '其他渠道',
};

const educationLabels: Record<string, string> = {
  high_school_or_below: '高中及以下',
  college: '大专',
  bachelor: '本科',
  master_or_above: '硕士及以上',
  other: '其他',
};

const relationLabels: Record<string, string> = {
  family: '家人',
  parent: '父母',
  spouse: '配偶',
  child: '子女',
  friend: '朋友',
  other: '其他',
};

const recognizedName = computed(() => store.ocr?.recognized?.realName || '');
const recognizedId = computed(() => normalizeIdCard(store.ocr?.recognized?.idCardNumber || ''));
const backendConfirmMode = computed(() => store.submitResult?.outcome === 'confirm');
const phoneVerificationNotice = computed(() => {
  if (phoneChangedAfterVerification.value) {
    return '手机号已变更，请返回报名页重新验证。';
  }
  if (draft.token && draft.verifiedPhone === draft.phone.trim()) {
    return '手机验证已过期，请返回报名页重新获取验证码。';
  }
  return '提交前需要有效的手机号验证，请返回报名页完成验证。';
});
const sourceText = computed(() => sourceLabels[draft.sourceChannel] || draft.sourceChannel || '未填写');
const educationText = computed(() => educationLabels[draft.profileExtra.educationCode] || draft.profileExtra.educationCode || '未填写');
const blockReason = computed(() => {
  if (!store.ocr) {
    return '请先完成身份证识别。';
  }
  if (!store.ocr.clarityOk) {
    return '照片不清晰，请返回重拍。';
  }
  if (!recognizedName.value || !recognizedId.value) {
    return '识别结果不完整，请返回重拍。';
  }
  return '';
});
const precheckMismatchReason = computed(() => {
  if (blockReason.value) return '';
  if (!sameText(recognizedName.value, draft.realName) || recognizedId.value !== normalizeIdCard(draft.idCardNumber)) {
    return '预识别结果与填写信息不一致，可先修正，也可继续提交并以后端最终核验为准。';
  }
  return '';
});
const qualityNotice = computed(() => {
  const ocr = store.ocr;
  const notices: string[] = [];
  if (!ocr) return '';
  if (ocr.antiForgeryWarnings.length > 0) {
    notices.push('证件照有质量提醒');
  }
  const cardWarnings = ocr.ocrDetail?.cardWarnings;
  if (
    cardWarnings &&
    (cardWarnings.copy || cardWarnings.reshoot || cardWarnings.ps || cardWarnings.border || cardWarnings.occlusion || cardWarnings.blur)
  ) {
    notices.push('照片边框、清晰度或拍摄方式需要注意');
  }
  const detailFields = [
    ocr.ocrDetail?.sex,
    ocr.ocrDetail?.nation,
    ocr.ocrDetail?.birth,
    ocr.ocrDetail?.address,
    ocr.ocrDetail?.authority,
    ocr.ocrDetail?.validDate,
  ];
  if (detailFields.some((field) => field?.reflect || field?.incomplete)) {
    notices.push('部分证件字段存在反光或显示不完整');
  }
  if (notices.length === 0) return '';
  return `${Array.from(new Set(notices)).join('；')}。可继续提交，后端会按招新分流规则处理。`;
});

function relationText(value: string) {
  return relationLabels[value] || value || '未选择';
}

function useOcr() {
  if (recognizedName.value) {
    draft.realName = recognizedName.value;
  }
  if (recognizedId.value) {
    draft.idCardNumber = recognizedId.value;
  }
  store.remember();
  showToast('已回填识别结果');
}

async function useOcrAndResubmit() {
  useOcr();
  await submit(false);
}

function editForm() {
  store.clearSubmitResult();
  store.remember();
  router.push('/recruit/apply');
}

function cleanProfileExtra(profile: RecruitmentProfileExtra): RecruitmentProfileExtra {
  return {
    occupation: profile.occupation.trim(),
    workUnit: profile.workUnit.trim(),
    educationCode: profile.educationCode.trim(),
    medicalNotes: profile.medicalNotes.trim(),
    exerciseExperience: profile.exerciseExperience.trim(),
    rescueExperience: profile.rescueExperience.trim(),
    firstAidExperience: profile.firstAidExperience.trim(),
    availability: profile.availability.trim(),
    hasVehicle: profile.hasVehicle,
    otherSkills: profile.otherSkills.trim(),
    privacyConsentSigned: profile.privacyConsentSigned,
    noCriminalRecordSigned: profile.noCriminalRecordSigned,
    volunteerCommitmentSigned: profile.volunteerCommitmentSigned,
  };
}

async function submit(applicantConfirmedOcrWrong: boolean) {
  store.refreshVerificationClock();
  if (blockReason.value) {
    showToast(blockReason.value);
    return;
  }
  if (applicantConfirmedOcrWrong && !backendConfirmMode.value) {
    showToast('请先按后端核验结果选择处理方式');
    return;
  }
  if (!store.hasVerifiedPhone) {
    showToast('请先完成手机号验证再提交');
    router.push('/recruit/apply');
    return;
  }
  const file = store.idCardFile;
  if (!file) {
    showToast('请上传身份证照片');
    router.push('/recruit/id-card');
    return;
  }
  submitting.value = true;
  try {
    const payload: RecruitmentPayload = {
      ...(draft.token ? { phoneVerificationToken: draft.token } : {}),
      realName: draft.realName.trim(),
      idCardNumber: normalizeIdCard(draft.idCardNumber),
      documentTypeCode: 'mainland_id',
      phone: draft.phone.trim(),
      cityDistrict: draft.cityDistrict.trim(),
      detailedAddress: draft.detailedAddress.trim(),
      sourceChannel: draft.sourceChannel.trim(),
      emergencyContacts: draft.emergencyContacts.map((contact) => ({
        name: contact.name.trim(),
        relation: contact.relation,
        phone: contact.phone.trim(),
      })),
      profileExtra: cleanProfileExtra(draft.profileExtra),
      ...(applicantConfirmedOcrWrong ? { applicantConfirmedOcrWrong: true } : {}),
    };
    const result = await submitRecruitment(payload, file);
    store.setSubmitResult(result);
    router.push('/recruit/result');
  } catch (error) {
    showToast(error instanceof FriendlyApiError ? error.message : '提交失败');
  } finally {
    submitting.value = false;
  }
}

onBeforeUnmount(() => {
  if (verificationTimer !== null) {
    window.clearInterval(verificationTimer);
  }
});
</script>

<style scoped>
.contact-summary {
  display: grid;
  gap: 4px;
  padding: 10px 0;
  border-top: 1px solid var(--srvf-line);
}

.contact-summary:first-of-type {
  border-top: 0;
}

.contact-summary span {
  color: var(--srvf-muted);
  font-size: 13px;
}
</style>
