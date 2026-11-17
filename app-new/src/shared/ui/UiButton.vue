<template>
  <div class="ui-btn-wrap" :class="wrapClasses">
    <button
      :class="btnClasses"
      :type="type"
      :disabled="disabled || loading"
      @click="$emit('click', $event)"
    >
      <span v-if="loading">Загрузка...</span>
      <slot v-else />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: { type: String, default: 'button' },
  disabled: Boolean,
  loading: Boolean,
  // primary | secondary | ghost
  variant: { type: String, default: 'primary' },
  // sm | md | lg
  size: { type: String, default: 'md' },
});

defineEmits(['click']);

const wrapClasses = computed(() => ({
  'ui-btn-wrap--full': true,
}));

const btnClasses = computed(() => [
  'ui-btn',
  `ui-btn--${props.variant}`,
  `ui-btn--${props.size}`,
  { 'ui-btn--disabled': props.disabled || props.loading },
]);
</script>

<style scoped>
.ui-btn-wrap {
  display: inline-flex;
}

.ui-btn-wrap--full {
  width: auto;
}

/* ===== BASE ===== */
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--border-radius-l, 12px);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: inherit;
}

/* ===== SIZES ===== */
.ui-btn--sm {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 8px;
}

.ui-btn--md {
  height: 44px;
  padding: 0 18px;
  font-size: 14px;
}

.ui-btn--lg {
  height: 56px;
  padding: 0 24px;
  font-size: 15px;
}

/* ===== VARIANTS ===== */
/* Primary */
.ui-btn--primary {
  background-color: var(--accent-default, #667eea);
  color: #fff;
}
.ui-btn--primary:hover:not(:disabled) {
  background-color: var(--accent-hover, #5a67d8);
}
.ui-btn--primary:disabled {
  background-color: var(--accent-container-default, #c7d2fe);
  color: var(--accent-muted, #a5b4fc);
  cursor: not-allowed;
}

/* Secondary */
.ui-btn--secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.ui-btn--secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}
.ui-btn--secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Ghost */
.ui-btn--ghost {
  background: none;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}
.ui-btn--ghost:hover:not(:disabled) {
  background: #f9fafb;
  color: #374151;
}
.ui-btn--ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>