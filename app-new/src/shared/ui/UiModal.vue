<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="ui-modal" @click="handleBackdropClick">
        <div :class="modalClasses" @click.stop>
          <!-- Header -->
          <div v-if="$slots.header || title" class="ui-modal__header">
            <slot name="header">
              <h3 class="ui-modal__title">{{ title }}</h3>
            </slot>
            <button
              v-if="closable"
              class="ui-modal__close"
              type="button"
              @click="close"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="ui-modal__body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="ui-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value),
  },
  closable: {
    type: Boolean,
    default: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'close']);

const modalClasses = computed(() => [
  'ui-modal__content',
  `ui-modal__content--${props.size}`,
]);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close();
  }
};

// Блокируем скролл body при открытии модалки
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.ui-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.ui-modal__content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 100%;
  animation: modalSlideIn 0.3s ease-out;
}

.ui-modal__content--sm { max-width: 400px; }
.ui-modal__content--md { max-width: 600px; }
.ui-modal__content--lg { max-width: 800px; }
.ui-modal__content--xl { max-width: 1200px; }

.ui-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.ui-modal__title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.ui-modal__close {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.ui-modal__close:hover {
  background: #f3f4f6;
  color: #374151;
}

.ui-modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.ui-modal__footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
