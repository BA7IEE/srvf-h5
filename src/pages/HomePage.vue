<template>
  <main class="page home-page">
    <div class="page-inner">
      <div class="topbar">
        <div class="brand">
          <span class="brand-mark">S</span>
          <span>SRVF 招新</span>
        </div>
      </div>

      <section class="hero">
        <p class="eyebrow">2026 RECRUIT</p>
        <h1 class="title">加入山野救援志愿服务</h1>
        <p class="subtitle">完成手机号验证、报名资料、身份证识别后提交。报名后可用手机号验证码查询进度。</p>
      </section>

      <section class="panel stack">
        <van-button block type="primary" size="large" icon="edit" @click="goApply">新人报名</van-button>
        <van-button block plain type="primary" size="large" icon="search" @click="goProgress">进度查询</van-button>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goApply() {
  router.push('/recruit/apply');
}

function goProgress() {
  router.push('/recruit/progress');
}
</script>

<style scoped>
.home-page {
  display: flex;
  align-items: center;
}
</style>
