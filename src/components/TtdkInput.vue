<template>
  <div class="ttdk-input-wrapper" :data-size="size" :data-filled="isFilled" :data-disabled="disabled">
    <div class="ttdk-input-inner">
      <input
        class="ttdk-input-control"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :inputmode="inputmode"
        @input="onInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    type?: string;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    size: 'md',
    disabled: false,
    min: undefined,
    max: undefined,
    step: undefined,
    inputmode: undefined
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const isFilled = computed(() => props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined);

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>
