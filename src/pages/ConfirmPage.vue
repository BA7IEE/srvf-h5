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
            : '当前只完成了资料核对；后端提交仍要求 phoneVerificationToken，请返回报名页完成手机号验证后提交。'
        }}
      </div>

      <div v-if="blockReason" class="notice warning">{{ blockReason }}</div>

      <div class="split-actions">
        <van-button block plain type="primary" @click="useOcr">使用识别结果</van-button>
        <van-button block plain type="primary" @click="editForm">修改填写</van-button>
      </div>
      <div class="actions">
        <van-button block type="primary" size="large" :loading="submitting" @click="submit">
          提交报名
        </van-button>
      </div>
    </div>
  </PageFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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
const sourceText = computed(() => sourceLabels[draft.sourceChannel] || draft.sourceChannel || '未填写');
const educationText = computed(() => educationLabels[draft.profileExtra.educationCode] || draft.profileExtra.educationCode || '未填写');
const blockReason = computed(() => {
  if (!store.ocr) {
    return '请先完成身份证识别。';
  }
  if (!store.ocr.clarityOk) {
    return '照片不清晰，请返回重拍。';
  }
  if (store.ocr.antiForgeryWarnings.length > 0) {
    return '照片质量未通过，请返回重拍。';
  }
  if (!recognizedName.value || !recognizedId.value) {
    return '识别结果不完整，请返回重拍。';
  }
  if (!sameText(recognizedName.value, draft.realName) || recognizedId.value !== normalizeIdCard(draft.idCardNumber)) {
    return '识别结果与填写信息不一致，请先使用识别结果或返回修改。';
  }
  return '';
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

function editForm() {
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

async function submit() {
  if (blockReason.value) {
    showToast(blockReason.value);
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
