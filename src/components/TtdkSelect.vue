<template>
  <div class="ttdk-input-wrapper" :data-size="size" :data-filled="isFilled" :data-disabled="disabled">
    <div class="ttdk-input-inner">
      <select
        class="ttdk-input-control ttdk-select-native"
        :value="modelValue ?? ''"
        :disabled="disabled"
        :data-placeholder="isFilled ? 'false' : 'true'"
        @change="onChange"
      >
        <option value="">{{ placeholder }}</option>
        <option v-for="option in options" :key="option.v" :value="option.v">{{ option.l }}</option>
      </select>
      <span class="ttdk-input-icon ttdk-input-icon-right select-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OptionItem } from '../types/smpk';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    options: OptionItem[];
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    placeholder: 'Pilih…',
    size: 'md',
    disabled: false
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const isFilled = computed(() => props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined);

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>

<style scoped>
.ttdk-select-native {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  padding-right: 4px;
}

.ttdk-select-native[data-placeholder='true'] {
  color: var(--ttdk-content-placeholder);
}

.select-arrow {
  pointer-events: none;
}
</style>
