<template>
  <div class="ui-select">
    <label v-if="label" :for="selectId" class="ui-select__label">
      {{ label }}
      <span v-if="required" class="ui-select__required">*</span>
    </label>
    <div class="ui-select__wrapper">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
        @change="handleChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
      
      <span class="ui-select__icon">▼</span>
    </div>
    <span v-if="error" class="ui-select__error">{{ error }}</span>
  </div>
</template>
<script setup>
import { computed } from 'vue';
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  options: {
    type: Array,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Выберите опцию',
  },
  error: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  valueKey: {
    type: String,
    default: 'value',
  },
  labelKey: {
    type: String,
    default: 'label',
  },
});
const emit = defineEmits(['update:modelValue', 'change']);
const selectId = computed(() => `ui-select-${Math.random().toString(36).substr(2, 9)}`);
const selectClasses = computed(() => [
  'ui-select__field',
  {
    'ui-select__field--error': props.error,
    'ui-select__field--disabled': props.disabled,
  },
]);
const getOptionValue = (option) => {
  return typeof option === 'object' ? option[props.valueKey] : option;
};
const getOptionLabel = (option) => {
  return typeof option === 'object' ? option[props.labelKey] : option;
};
const handleChange = (event) => {
  const value = event.target.value;
  emit('update:modelValue', value);
  emit('change', value);
};
</script>
<style scoped>
/* Обёртка компонента */
.ui-select {
  display: flex;
  flex-direction: column;
  gap: var(--gap-vertical-2, 6px);
}

/* Лейбл */
.ui-select__label {
  font-size: var(--body-size_m);
  font-weight: 500;
  color: var(--foreground-muted, #6b7280);
}

.ui-select__required {
  color: var(--danger, #ef4444);
  margin-left: 2px;
}

/* Позиционирование иконки */
.ui-select__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* Сам select-элемент */
.ui-select__field {
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: var(--padding-s, 8px) 36px var(--padding-s, 8px) var(--padding-m, 12px);
  border-radius: var(--border-radius-l, 10px);
  border: 1.5px solid var(--border-soft, #d1d5db);
  background: var(--background-surface1, #ffffff);
  color: var(--foreground-default, #111827);
  font-size: var(--body-size_m, 14px);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}

.ui-select__field:hover:not(:disabled) {
  border-color: var(--border-medium, #9ca3af);
}

.ui-select__field:focus {
  border-color: var(--accent-default, #667eea);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

/* Состояния */
.ui-select__field--error {
  border-color: var(--danger, #ef4444);
}

.ui-select__field--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--background-surface2, #f9fafb);
}

/* Иконка стрелки */
.ui-select__icon {
  position: absolute;
  right: 10px;
  font-size: 10px;
  color: var(--foreground-muted, #6b7280);
  pointer-events: none;
  line-height: 1;
}

/* Текст ошибки */
.ui-select__error {
  font-size: var(--body-size_s, 12px);
  color: var(--danger, #ef4444);
}
</style>
