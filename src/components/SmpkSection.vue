<template>
  <section class="ttdk-card" data-variant="bordered" data-size="md" data-rounded="md">
    <div class="ttdk-card-header ttdk-card-header-bordered">
      <div class="ttdk-card-header-main">
        <h2 class="ttdk-card-title">
          <span v-if="step" class="step-no">{{ step }}</span>
          {{ title }}
        </h2>
        <p v-if="subtitle" class="ttdk-card-subtitle">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>
    <div class="ttdk-card-body section-body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    step?: string | number;
  }>(),
  {
    subtitle: '',
    step: ''
  }
);
</script>

<style scoped>
.ttdk-card {
  margin-bottom: 16px;
}

.ttdk-card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--ttdk-surface-action-light);
  color: var(--ttdk-content-action);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
