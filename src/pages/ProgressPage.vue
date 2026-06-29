<template>
  <PageFrame>
    <section class="hero">
      <p class="eyebrow">STATUS</p>
      <h1 class="title">进度查询</h1>
    </section>

    <div class="stack">
      <section class="panel stack">
        <van-cell-group inset>
          <van-field v-model="phone" label="手机号" type="tel" maxlength="11" placeholder="报名手机号" />
          <van-field v-model="code" label="验证码" type="tel" maxlength="6" placeholder="6 位数字">
            <template #button>
              <van-button size="small" type="primary" :disabled="sendDisabled" :loading="sending" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '获取' }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>
        <van-button block type="primary" :loading="querying" :disabled="!canQuery" @click="query">查询</van-button>
      </section>

      <section v-if="progress" class="panel stack">
        <h2 class="section-title">{{ progress.stageText }}</h2>
        <div class="kv"><span>状态</span><strong>{{ progress.statusText }}</strong></div>
        <div class="kv"><span>身份</span><strong>{{ progress.identityText }}</strong></div>
        <div v-if="progress.tempNo" class="kv"><span>临时编号</span><strong>{{ progress.tempNo }}</strong></div>
        <div v-if="progress.meetingInfo" class="kv"><span>见面会</span><strong>{{ progress.meetingInfo }}</strong></div>
        <div v-if="progress.qqGroup" class="kv"><span>QQ群</span><strong>{{ progress.qqGroup }}</strong></div>
        <div v-if="progress.todoList.length > 0">
          <h2 class="section-title">门槛进度</h2>
          <div v-for="item in progress.todoList" :key="item.code" class="progress-row">
            <span class="dot" :class="{ done: item.done }" />
            <div>
              <strong>{{ item.name }}</strong>
              <div class="muted">{{ item.done ? '已完成' : '待完成' }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </PageFrame>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { showToast } from 'vant';

import { queryProgressByPhone, sendRecruitmentCode } from '@/api/recruitment';
import PageFrame from '@/components/PageFrame.vue';
import { useRecruitmentStore } from '@/stores/recruitment';
import { FriendlyApiError } from '@/utils/errors';
import { isPhone, isSmsCode } from '@/utils/validators';

const store = useRecruitmentStore();
const phone = ref(store.draft.phone);
const code = ref('');
const sending = ref(false);
const querying = ref(false);
const countdown = ref(0);
let timer: number | null = null;

const progress = computed(() => store.progress);
const sendDisabled = computed(() => sending.value || countdown.value > 0 || !isPhone(phone.value));
const canQuery = computed(() => isPhone(phone.value) && isSmsCode(code.value));

watch(phone, () => {
  store.clearProgress();
});

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
  if (!isPhone(phone.value)) {
    showToast('请输入正确手机号');
    return;
  }
  sending.value = true;
  try {
    const result = await sendRecruitmentCode(phone.value.trim());
    startCountdown(Math.min(result.expiresInSeconds, 60));
    showToast('验证码已发送');
  } catch (error) {
    showToast(error instanceof FriendlyApiError ? error.message : '发送失败');
  } finally {
    sending.value = false;
  }
}

async function query() {
  if (!canQuery.value) {
    showToast('请输入手机号和 6 位验证码');
    return;
  }
  querying.value = true;
  store.clearProgress();
  try {
    const result = await queryProgressByPhone(phone.value.trim(), code.value.trim());
    store.setProgress(result);
  } catch (error) {
    showToast(error instanceof FriendlyApiError ? error.message : '查询失败');
  } finally {
    querying.value = false;
  }
}

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearInterval(timer);
  }
});
</script>
