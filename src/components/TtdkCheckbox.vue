<template>
  <label class="ttdk-checkbox-root" :data-size="size" :data-checked="modelValue ? 'true' : 'false'" :data-disabled="disabled">
    <input class="ttdk-checkbox-native" type="checkbox" :checked="modelValue" :disabled="disabled" @change="onChange" />
    <span class="ttdk-checkbox-control" aria-hidden="true">
      <svg v-if="modelValue" class="ttdk-checkbox-icon" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5 6.4 12 13 4.5" />
      </svg>
    </span>
    <span v-if="label || description" class="ttdk-checkbox-label-wrapper">
      <span v-if="label" class="ttdk-checkbox-label">{{ label }}</span>
      <span v-if="description" class="ttdk-checkbox-desc">{{ description }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
  }>(),
  {
    modelValue: false,
    label: '',
    description: '',
    size: 'md',
    disabled: false
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
}
</script>
