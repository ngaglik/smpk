<template>
  <div class="ttdk-form-item" data-block="true" :data-error="error ? 'true' : 'false'" :data-field="field">
    <label v-if="label" class="ttdk-form-label">
      {{ label }}
      <span v-if="required" class="ttdk-form-required" aria-hidden="true">*</span>
      <span v-if="optional" class="ttdk-form-optional">(opsional)</span>
    </label>
    <slot />
    <span v-if="error" class="ttdk-form-error-msg">{{ error }}</span>
    <span v-else-if="helper" class="ttdk-form-helper-text">{{ helper }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    helper?: string;
    error?: string;
    required?: boolean;
    optional?: boolean;
    field?: string;
  }>(),
  {
    label: '',
    helper: '',
    error: '',
    required: false,
    optional: false,
    field: ''
  }
);
</script>
