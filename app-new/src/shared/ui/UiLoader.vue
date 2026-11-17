<template>
  <div :class="loaderClasses">
    <div class="ui-loader__spinner"></div>
    <span v-if="text" class="ui-loader__text">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  text: {
    type: String,
    default: '',
  },
  fullscreen: {
    type: Boolean,
    default: false,
  },
});

const loaderClasses = computed(() => [
  'ui-loader',
  `ui-loader--${props.size}`,
  {
    'ui-loader--fullscreen': props.fullscreen,
  },
]);
</script>

<style scoped>
.ui-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.ui-loader--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

.ui-loader__spinner {
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  animation: spin 0.8s linear infinite;
}

.ui-loader--sm .ui-loader__spinner {
  width: 24px;
  height: 24px;
}

.ui-loader--md .ui-loader__spinner {
  width: 40px;
  height: 40px;
}

.ui-loader--lg .ui-loader__spinner {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

.ui-loader__text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
s