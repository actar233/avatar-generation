<template>
  <div class="w-[100vw] h-[100vh] flex flex-col justify-center items-center bg-white">

    <div v-if="step === 0" class="w-full h-full flex flex-col justify-evenly items-center">
      <span>永远怀念-图片生成器</span>
      <input ref="imageRef" type="file" @change="onFileChange" accept="image/*" class="hidden"/>
      <div class="mt-2 flex flex-row items-center">
        <button
            @click="selectImage"
            class="bg-blue-500 text-white px-4 py-2 rounded border border-blue-500 hover:bg-blue-600">
          选择图片
        </button>
      </div>
    </div>

    <div v-if="step === 1" class="w-full h-full flex flex-col justify-evenly items-center">
      <div class="w-[600px] h-[600px] max-w-[100%] max-h-[80%] overflow-hidden">
        <img ref="cropperRef" alt="" class="w-[600px] h-[600px]"/>
      </div>
      <div class="flex flex-row items-center">
        <button
            @click="crop"
            class="bg-blue-500 text-white px-4 py-2 rounded border border-blue-500 hover:bg-blue-600">
          裁剪
        </button>
        <button
            @click="cancel"
            class="bg-white text-black px-4 py-2 rounded border border-gray-500 ml-2 hover:bg-gray-100">
          取消
        </button>
      </div>
    </div>

    <div v-if="step === 2" class="w-full h-full flex flex-col justify-evenly items-center">

      <div v-if="isGeneration">
        生成中，请稍后...
      </div>

      <template v-else>

        <img
            v-if="resultUrl"
            ref="resultImage"
            :src="resultUrl"
            class="w-[359px] h-auto max-w-[80%]"
        />

        <div class="mt-2 flex flex-row items-center">
          <button
              @click="download"
              class="bg-blue-500 text-white px-4 py-2 rounded border border-blue-500 hover:bg-blue-600">
            下载
          </button>
          <button
              @click="cancel"
              class="bg-white text-black px-4 py-2 rounded border border-gray-500 ml-2 hover:bg-gray-100">
            取消
          </button>
        </div>

        <div class="w-fit max-w-[80%]">
          如无法下载，请使用外部浏览器打开，或者尝试长按图片保存
        </div>
      </template>

    </div>

  </div>
</template>

<script setup lang="ts">

import 'cropperjs/dist/cropper.css';
import Cropper from "cropperjs";
import {nextTick, ref} from "vue";
import frame from './frame.png'

const step = ref(0);

const imageRef = ref<HTMLInputElement | null>(null);

const file = ref<File | null>(null);

const cropper = ref<Cropper | null>(null);

const cropperRef = ref<HTMLImageElement | null>(null);

const avatarUrl = ref<string | null>(null);

const resultUrl = ref<string | null>(null);

const isGeneration = ref(false)

const selectImage = () => {
  imageRef.value?.click();
}

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input?.files) {
    return
  }
  file.value = input.files[0];
  step.value = 1;
  await nextTick();
  await initCropper(URL.createObjectURL(file.value));
}

const initCropper = async (url: string) => {
  cropper.value = new Cropper(cropperRef.value!!, {
    aspectRatio: 244 / 315,
    autoCrop: true,       // 自动生成裁剪框
    autoCropArea: 1,      // 裁剪框占图像的比例 (1 = 100%)
    viewMode: 1,          // 裁剪框限制在图像范围内
    responsive: true,     // 根据窗口大小自适应
    dragMode: 'crop',     // 裁剪模式
    restore: false        // 禁止恢复上次的裁剪框
  });
  cropper.value.replace(url);
}

const crop = async () => {
  cropper.value?.getCroppedCanvas().toBlob(async (blob) => {
    if (!blob) {
      return
    }
    avatarUrl.value = URL.createObjectURL(blob);
    step.value = 2;
    await nextTick();
    await initCanvas()
  }, 'image/png', 0.9);
}

const loadImage = (url: string): Promise<any> => {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.src = url;
  });
}

const withCanvas = <T>(fn: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => T): T => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const result = fn(canvas, ctx!!);
  canvas.remove();
  return result;
}

const initCanvas = async () => {
  try {
    isGeneration.value = true;

    const avatarImage = await loadImage(avatarUrl.value!!);
    const frameImage = await loadImage(frame);

    const dpr = window.devicePixelRatio || 1;

    withCanvas((canvas, ctx) => {
      canvas.width = 359 * dpr;
      canvas.height = 421 * dpr;

      ctx!!.scale(dpr, dpr);

      ctx!!.fillStyle = '#ffffff';
      ctx!!.fillRect(0, 0, 359, 421);
      ctx!!.fillStyle = '';

      withCanvas((avatarCanvas, avatarCtx) => {
        avatarCanvas.width = 244 * dpr;
        avatarCanvas.height = 315 * dpr;
        avatarCtx!!.scale(dpr, dpr);
        avatarCtx!!.filter = 'grayscale(100%)';
        avatarCtx!!.drawImage(avatarImage, 0, 0, 244, 315);
        ctx!!.drawImage(avatarCanvas, 57, 65, 244, 315);
      })

      ctx!!.drawImage(frameImage, 0, 0, 359, 421);

      resultUrl.value = canvas.toDataURL("image/png");
    })


  } finally {
    isGeneration.value = false;
  }
}

const download = () => {
  const link = document.createElement('a');
  link.href = resultUrl.value!!;
  link.download = `永远怀念-${new Date().getTime()}.png`;
  link.click();
  link.remove();
}

const cancel = () => {
  step.value = 0;
}

</script>