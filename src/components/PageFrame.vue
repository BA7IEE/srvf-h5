<template>
  <main class="page">
    <div class="page-inner">
      <div class="topbar">
        <button class="back-button" type="button" aria-label="返回" @click="goBack">
          ‹
        </button>
        <div class="brand">
          <span class="brand-mark">S</span>
          <span>SRVF 招新</span>
        </div>
        <span class="topbar-spacer" />
      </div>
      <slot />
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/');
}
</script>

<style scoped>
.back-button,
.topbar-spacer {
  width: 34px;
  height: 34px;
}

.back-button {
  color: var(--srvf-green);
  font-size: 30px;
  line-height: 1;
  background: transparent;
  border: 0;
}
</style>
