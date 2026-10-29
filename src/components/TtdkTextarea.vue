<template>
  <div class="ttdk-textarea-wrapper" :data-filled="isFilled" :data-disabled="disabled">
    <textarea
      class="ttdk-textarea-control"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    placeholder: '',
    rows: 3,
    disabled: false
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const isFilled = computed(() => props.modelValue !== '' && props.modelValue !== undefined);

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
}
</script>
