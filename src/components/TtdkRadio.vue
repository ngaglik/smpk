<template>
  <label class="ttdk-radio-root" :data-size="size" :data-checked="checked ? 'true' : 'false'" :data-disabled="disabled">
    <input
      class="ttdk-radio-native"
      type="radio"
      :name="name"
      :value="value"
      :checked="checked"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="ttdk-radio-control" aria-hidden="true">
      <span v-if="checked" class="ttdk-radio-dot"></span>
    </span>
    <span v-if="label" class="ttdk-radio-label-wrapper">
      <span class="ttdk-radio-label">{{ label }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    value: string;
    label?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    label: '',
    name: '',
    size: 'md',
    disabled: false
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const checked = computed(() => props.modelValue === props.value);

function onChange() {
  emit('update:modelValue', props.value);
}
</script>
