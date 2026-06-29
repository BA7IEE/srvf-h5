<template>
  <PageFrame>
    <section class="hero">
      <p class="eyebrow">RESULT</p>
      <h1 class="title">{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </section>

    <section v-if="result" class="panel stack">
      <div v-if="result.tempNo" class="kv"><span>临时编号</span><strong>{{ result.tempNo }}</strong></div>
      <div class="kv"><span>轮次</span><strong>{{ result.cycleName }}</strong></div>
      <div v-if="result.stageText" class="kv"><span>状态</span><strong>{{ result.stageText }}</strong></div>
      <div v-if="result.hint" class="notice" :class="{ warning: result.outcome !== 'submitted' }">{{ result.hint }}</div>
      <div v-if="result.meetingInfo" class="kv"><span>见面会</span><strong>{{ result.meetingInfo }}</strong></div>
      <div v-if="result.qqGroup" class="kv"><span>QQ群</span><strong>{{ result.qqGroup }}</strong></div>
    </section>

    <div class="actions">
      <van-button v-if="result?.outcome === 'retake'" block type="primary" size="large" @click="goRetake">重新拍摄</van-button>
      <van-button v-else-if="result?.outcome === 'confirm'" block type="primary" size="large" @click="goConfirm">处理不一致</van-button>
      <van-button v-else-if="result?.outcome === 'retry'" block type="primary" size="large" @click="goRetry">重新提交</van-button>
      <van-button v-else block type="primary" size="large" @click="goProgress">查询进度</van-button>
      <van-button block plain type="primary" @click="goHome">返回首页</van-button>
    </div>
  </PageFrame>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import PageFrame from '@/components/PageFrame.vue';
import { useRecruitmentStore } from '@/stores/recruitment';

const router = useRouter();
const store = useRecruitmentStore();
const result = computed(() => store.submitResult);

const title = computed(() => {
  if (!result.value) return '暂无提交结果';
  if (result.value.outcome === 'retake') return '请重新拍摄';
  if (result.value.outcome === 'confirm') return '信息需要核对';
  if (result.value.outcome === 'retry') return '请稍后重试';
  return result.value.tempNo ? '报名已通过初核' : '报名已提交';
});

const subtitle = computed(() => {
  if (!result.value) return '当前没有可展示的提交结果。';
  if (result.value.outcome === 'submitted' && result.value.tempNo) return '请保存临时编号，并继续关注进度。';
  if (result.value.outcome === 'submitted') return '资料已进入核验流程，请稍后查询进度。';
  if (result.value.outcome === 'confirm') return '后端核验结果与你填写的信息不一致，请返回核对并选择处理方式。';
  return result.value.hint || '请按页面提示处理后再次提交。';
});

function goRetake() {
  router.push('/recruit/id-card');
}

function goConfirm() {
  if (result.value?.recognized) {
    store.setOcr({
      ocrSupported: true,
      clarityOk: true,
      recognized: result.value.recognized,
      antiForgeryWarnings: [],
      documentCategory: null,
      hint: null,
      ocrDetail: null,
    });
  }
  router.push(store.idCardFile ? '/recruit/confirm' : '/recruit/id-card');
}

function goRetry() {
  router.push(store.idCardFile ? '/recruit/confirm' : '/recruit/id-card');
}

function goProgress() {
  router.push('/recruit/progress');
}

function goHome() {
  router.push('/');
}
</script>
