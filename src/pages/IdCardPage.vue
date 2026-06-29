<template>
  <PageFrame>
    <section class="hero">
      <p class="eyebrow">STEP 2 / 3</p>
      <h1 class="title">身份证上传</h1>
    </section>

    <div class="stack">
      <section class="panel stack">
        <div class="upload-frame">
          <img v-if="previewUrl" class="upload-preview" :src="previewUrl" alt="身份证照片预览" />
          <div v-else class="muted">上传身份证正面照片</div>
        </div>
        <van-uploader :after-read="afterRead" :max-count="1" accept="image/jpeg,image/png" :preview-image="false">
          <van-button block plain type="primary" icon="photograph">选择照片</van-button>
        </van-uploader>
        <div v-if="ocrWarning" class="notice warning">{{ ocrWarning }}</div>
        <div v-if="ocrAdvice.length > 0" class="notice warning">
          <div v-for="item in ocrAdvice" :key="item">{{ item }}</div>
        </div>
      </section>

      <div class="actions">
        <van-button block type="primary" size="large" :loading="recognizing" :disabled="!store.idCardImage" @click="runOcr">
          识别并核对
        </van-button>
      </div>
    </div>
  </PageFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { showToast } from 'vant';
import { useRouter } from 'vue-router';

import { recognizeIdCard } from '@/api/recruitment';
import PageFrame from '@/components/PageFrame.vue';
import { useRecruitmentStore } from '@/stores/recruitment';
import type { OcrRecognizeResponse } from '@/types/recruitment';
import { FriendlyApiError } from '@/utils/errors';

interface UploadFileLike {
  file?: File;
  content?: string;
}

const router = useRouter();
const store = useRecruitmentStore();
const recognizing = ref(false);
const ocrWarning = ref('');
const ocrAdvice = ref<string[]>([]);
const previewUrl = computed(() => store.idCardImage?.dataUrl || '');

function afterRead(item: UploadFileLike | UploadFileLike[]) {
  const upload = Array.isArray(item) ? item[0] : item;
  const file = upload.file;
  if (!file || !upload.content) {
    showToast('请选择图片文件');
    return;
  }
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    showToast('仅支持 JPG 或 PNG');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片不能超过 5MB');
    return;
  }
  ocrWarning.value = '';
  ocrAdvice.value = [];
  store.setImage(file, upload.content);
}

function buildOcrAdvice(result: OcrRecognizeResponse): string[] {
  const advice: string[] = [];
  const fieldLabels: Array<[keyof NonNullable<OcrRecognizeResponse['ocrDetail']>, string]> = [
    ['birth', '出生日期栏'],
    ['address', '住址栏'],
    ['authority', '签发机关栏'],
    ['validDate', '有效期栏'],
    ['sex', '性别栏'],
    ['nation', '民族栏'],
  ];
  for (const [key, label] of fieldLabels) {
    const field = result.ocrDetail?.[key];
    if (field && typeof field === 'object' && 'reflect' in field && field.reflect) {
      advice.push(`${label}有反光，请调整角度重拍。`);
    }
    if (field && typeof field === 'object' && 'incomplete' in field && field.incomplete) {
      advice.push(`${label}不完整，请把证件边缘拍全。`);
    }
  }

  const cardWarnings = result.ocrDetail?.cardWarnings;
  if (cardWarnings?.blur) advice.push('照片整体偏模糊，请重新对焦。');
  if (cardWarnings?.border) advice.push('身份证边框不完整，请完整拍入画面。');
  if (cardWarnings?.occlusion) advice.push('证件有遮挡，请移开手指或遮挡物。');
  if (cardWarnings?.copy || cardWarnings?.reshoot || cardWarnings?.ps) {
    advice.push('请拍摄身份证原件，避免复印件、屏幕翻拍或修图痕迹。');
  }
  return Array.from(new Set(advice));
}

async function runOcr() {
  const file = store.idCardFile;
  if (!file) {
    showToast('请先选择照片');
    return;
  }
  recognizing.value = true;
  ocrWarning.value = '';
  try {
    const result = await recognizeIdCard(file);
    store.setOcr(result);
    ocrAdvice.value = buildOcrAdvice(result);
    if (!result.clarityOk) {
      ocrWarning.value = result.hint || '照片不清晰，请重拍后再继续。';
      return;
    }
    if (result.antiForgeryWarnings.length > 0) {
      ocrWarning.value = '照片质量未通过，请使用原件重新拍摄。';
      return;
    }
    router.push('/recruit/confirm');
  } catch (error) {
    showToast(error instanceof FriendlyApiError ? error.message : '识别失败');
  } finally {
    recognizing.value = false;
  }
}
</script>
