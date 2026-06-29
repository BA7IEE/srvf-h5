<template>
  <PageFrame>
    <section class="hero">
      <p class="eyebrow">STEP 1 / 3</p>
      <h1 class="title">报名资料</h1>
      <p class="subtitle">当前仅支持大陆居民身份证报名。请先完成必要资料，选填项可后续补充。</p>
    </section>

    <div class="stack">
      <section class="panel stack">
        <h2 class="section-title">手机验证</h2>
        <van-cell-group inset>
          <van-field v-model="draft.phone" label="手机号" type="tel" maxlength="11" placeholder="大陆手机号" />
          <van-field v-model="draft.code" label="验证码" type="tel" maxlength="6" placeholder="6 位数字">
            <template #button>
              <van-button size="small" type="primary" :disabled="sendDisabled" :loading="sending" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '获取' }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>
        <van-button block plain type="primary" :loading="verifying" @click="verifyCode">
          {{ store.hasVerifiedPhone ? '已验证，重新验证' : '验证手机号' }}
        </van-button>
        <div class="notice">
          {{
            store.hasVerifiedPhone
              ? '手机号已验证，本次报名会使用该手机号身份链。'
              : '当前本地后端没有开放报名轮次时可能无法发送验证码；资料可先填写，最终提交仍需要 phoneVerificationToken。'
          }}
        </div>
      </section>

      <section class="panel stack">
        <h2 class="section-title">本人信息</h2>
        <van-cell-group inset>
          <van-field v-model="draft.realName" label="姓名" placeholder="与身份证一致" />
          <van-field v-model="draft.idCardNumber" label="身份证号" maxlength="18" placeholder="18 位身份证号" />
          <van-field model-value="大陆居民身份证（当前仅支持）" label="证件类型" readonly />
          <van-field v-model="draft.cityDistrict" label="所在区县" placeholder="如 广州市天河区" />
          <van-field v-model="draft.detailedAddress" label="详细住址" type="textarea" rows="2" autosize placeholder="当前居住地址" />
        </van-cell-group>
      </section>

      <section class="panel stack">
        <h2 class="section-title">报名来源</h2>
        <div class="choice-grid">
          <button
            v-for="item in sourceOptions"
            :key="item.value"
            class="choice-button"
            :class="{ active: draft.sourceChannel === item.value }"
            type="button"
            @click="selectSource(item.value)"
          >
            {{ item.name }}
          </button>
        </div>
      </section>

      <section class="panel stack">
        <h2 class="section-title">基础情况</h2>
        <van-cell-group inset>
          <van-field v-model="draft.profileExtra.occupation" label="职业" placeholder="选填，如 学生 / 教师 / 医护 / 工程师" />
          <van-field v-model="draft.profileExtra.workUnit" label="单位/学校" placeholder="选填，工作单位或就读学校" />
          <van-field
            :model-value="formatEducation(draft.profileExtra.educationCode)"
            label="学历"
            is-link
            readonly
            placeholder="选填"
            @click="openEducationPicker"
          />
          <van-field
            v-model="draft.profileExtra.medicalNotes"
            label="健康说明"
            type="textarea"
            rows="2"
            autosize
            placeholder="既往病史、过敏、慢性病；无则填无"
          />
        </van-cell-group>
      </section>

      <section class="panel stack">
        <h2 class="section-title">能力与时间</h2>
        <van-cell-group inset>
          <van-field
            v-model="draft.profileExtra.exerciseExperience"
            label="运动经历"
            type="textarea"
            rows="2"
            autosize
            placeholder="选填，跑步、登山、游泳、体能训练等"
          />
          <van-field
            v-model="draft.profileExtra.firstAidExperience"
            label="急救经历"
            type="textarea"
            rows="2"
            autosize
            placeholder="选填，急救证书、培训、实操经历等"
          />
          <van-field
            v-model="draft.profileExtra.rescueExperience"
            label="救援/志愿经历"
            type="textarea"
            rows="2"
            autosize
            placeholder="选填，救援、志愿服务、户外保障等"
          />
          <van-field
            v-model="draft.profileExtra.availability"
            label="可参与时间"
            type="textarea"
            rows="2"
            autosize
            placeholder="如 工作日晚间、周末、可参加集中训练"
          />
          <van-field
            v-model="draft.profileExtra.otherSkills"
            label="其他技能"
            type="textarea"
            rows="2"
            autosize
            placeholder="选填，驾驶、摄影、无线电、后勤、文案等"
          />
        </van-cell-group>
        <van-checkbox v-model="draft.profileExtra.hasVehicle" shape="square">
          有可用于活动通勤或保障的车辆
        </van-checkbox>
      </section>

      <section class="panel stack">
        <h2 class="section-title">紧急联系人</h2>
        <div v-for="(contact, index) in draft.emergencyContacts" :key="index" class="contact-block">
          <van-cell-group inset>
            <van-field v-model="contact.name" :label="`联系人${index + 1}`" placeholder="姓名" />
            <van-field v-model="contact.phone" label="电话" type="tel" maxlength="11" placeholder="大陆手机号" />
            <van-field
              :model-value="formatRelation(contact.relation)"
              label="关系"
              is-link
              readonly
              placeholder="请选择"
              @click="openRelationPicker(index)"
            />
          </van-cell-group>
        </div>
      </section>

      <section class="panel stack">
        <h2 class="section-title">确认承诺</h2>
        <div class="check-stack">
          <van-checkbox v-model="draft.profileExtra.privacyConsentSigned" shape="square">
            同意按招新流程处理报名资料和身份证识别信息
          </van-checkbox>
          <van-checkbox v-model="draft.profileExtra.noCriminalRecordSigned" shape="square">
            确认本人无不适合参与志愿救援训练的违法违规记录
          </van-checkbox>
          <van-checkbox v-model="draft.profileExtra.volunteerCommitmentSigned" shape="square">
            确认能够遵守队伍纪律、训练安排和安全要求
          </van-checkbox>
        </div>
      </section>

      <div class="actions">
        <van-button block type="primary" size="large" @click="continueNext">下一步</van-button>
      </div>
    </div>

    <van-action-sheet v-model:show="relationPicker.show" :actions="relationActions" @select="selectRelation" />
    <van-action-sheet v-model:show="educationPicker" :actions="educationActions" @select="selectEducation" />
  </PageFrame>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { showToast } from 'vant';
import { useRouter } from 'vue-router';

import { sendRecruitmentCode, verifyRecruitmentCode } from '@/api/recruitment';
import PageFrame from '@/components/PageFrame.vue';
import { useRecruitmentStore } from '@/stores/recruitment';
import { FriendlyApiError } from '@/utils/errors';
import { isMainlandId, isPhone, isSmsCode, normalizeIdCard } from '@/utils/validators';

interface OptionItem {
  name: string;
  value: string;
}

const router = useRouter();
const store = useRecruitmentStore();
const draft = store.draft;
const sending = ref(false);
const verifying = ref(false);
const countdown = ref(0);
const relationPicker = ref({ show: false, index: 0 });
const educationPicker = ref(false);
let timer: number | null = null;

const relationActions: OptionItem[] = [
  { name: '家人', value: 'family' },
  { name: '父母', value: 'parent' },
  { name: '配偶', value: 'spouse' },
  { name: '子女', value: 'child' },
  { name: '朋友', value: 'friend' },
  { name: '其他', value: 'other' },
];

const sourceOptions: OptionItem[] = [
  { name: '线下二维码', value: 'offline_qr' },
  { name: '队员推荐', value: 'friend_referral' },
  { name: '公众号/社群', value: 'wechat_channel' },
  { name: '活动现场', value: 'event_site' },
  { name: '其他渠道', value: 'other' },
];

const educationActions: OptionItem[] = [
  { name: '高中及以下', value: 'high_school_or_below' },
  { name: '大专', value: 'college' },
  { name: '本科', value: 'bachelor' },
  { name: '硕士及以上', value: 'master_or_above' },
  { name: '其他', value: 'other' },
];

const sendDisabled = computed(() => sending.value || countdown.value > 0 || !isPhone(draft.phone));

function getMissingMessage(): string {
  if (!isPhone(draft.phone)) return '请填写正确手机号';
  if (!draft.realName.trim()) return '请填写姓名';
  if (!isMainlandId(draft.idCardNumber)) return '请填写正确身份证号';
  if (!draft.cityDistrict.trim()) return '请填写所在区县';
  if (!draft.detailedAddress.trim()) return '请填写详细住址';
  if (!draft.sourceChannel.trim()) return '请选择报名来源';
  if (!draft.profileExtra.medicalNotes.trim()) return '请填写健康说明，无则填无';
  if (!draft.profileExtra.availability.trim()) return '请填写可参与时间';

  const invalidContactIndex = draft.emergencyContacts.findIndex(
    (contact) => !contact.name.trim() || !isPhone(contact.phone) || !contact.relation,
  );
  if (invalidContactIndex >= 0) return `请补全联系人${invalidContactIndex + 1}`;
  if (!draft.profileExtra.privacyConsentSigned) return '请确认报名资料处理授权';
  if (!draft.profileExtra.noCriminalRecordSigned) return '请确认违法违规记录承诺';
  if (!draft.profileExtra.volunteerCommitmentSigned) return '请确认队伍纪律和安全要求';

  return '';
}

function startCountdown(seconds: number) {
  countdown.value = seconds;
  if (timer !== null) {
    window.clearInterval(timer);
  }
  timer = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

async function sendCode() {
  if (!isPhone(draft.phone)) {
    showToast('请输入正确手机号');
    return;
  }
  sending.value = true;
  try {
    const result = await sendRecruitmentCode(draft.phone.trim());
    startCountdown(Math.min(result.expiresInSeconds, 60));
    showToast('验证码已发送');
  } catch (error) {
    showToast(error instanceof FriendlyApiError ? error.message : '发送失败');
  } finally {
    sending.value = false;
  }
}

async function verifyCode() {
  if (!isPhone(draft.phone) || !isSmsCode(draft.code)) {
    showToast('请输入手机号和 6 位验证码');
    return;
  }
  verifying.value = true;
  try {
    const result = await verifyRecruitmentCode(draft.phone.trim(), draft.code.trim());
    store.setToken(result.phoneVerificationToken, result.expiresAt);
    showToast('验证通过');
  } catch (error) {
    showToast(error instanceof FriendlyApiError ? error.message : '验证失败');
  } finally {
    verifying.value = false;
  }
}

function selectSource(value: string) {
  draft.sourceChannel = value;
  store.remember();
}

function formatRelation(value: string) {
  return relationActions.find((item) => item.value === value)?.name || '';
}

function openRelationPicker(index: number) {
  relationPicker.value = { show: true, index };
}

function selectRelation(action: OptionItem) {
  draft.emergencyContacts[relationPicker.value.index].relation = action.value;
  relationPicker.value.show = false;
  store.remember();
}

function formatEducation(value: string) {
  return educationActions.find((item) => item.value === value)?.name || '';
}

function openEducationPicker() {
  educationPicker.value = true;
}

function selectEducation(action: OptionItem) {
  draft.profileExtra.educationCode = action.value;
  educationPicker.value = false;
  store.remember();
}

function continueNext() {
  const missingMessage = getMissingMessage();
  if (missingMessage) {
    showToast(missingMessage);
    return;
  }
  draft.idCardNumber = normalizeIdCard(draft.idCardNumber);
  store.ocr = null;
  store.submitResult = null;
  store.remember();
  router.push('/recruit/id-card');
}

onBeforeUnmount(() => {
  store.remember();
  if (timer !== null) {
    window.clearInterval(timer);
  }
});
</script>

<style scoped>
.contact-block + .contact-block {
  margin-top: 10px;
}
</style>
