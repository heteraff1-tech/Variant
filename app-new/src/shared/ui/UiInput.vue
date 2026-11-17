<template>
  <div class="input">
    <label v-if="label" class="input_label body-b3">
      {{ label }}
    </label>
    <input
      class="input__field body-b2"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" class="input__message error description-d1">{{ error }}</span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  label: String,
  placeholder: String,
  disabled: Boolean,
  error: String,
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.input {
  display: flex;
  flex-direction: column;
  gap: var(--gap-vertical-3);
  width: 100%;
}
.input_label {
  color: var(--foreground-soft);
}
.input__field {
  height: 56px;
  box-sizing: border-box;
  border-radius: var(--border-radius-l);
  padding: var(--padding-s) var(--padding-m);
  border: 2px solid var(--border-soft);
  background-color: var(--background-surface1);
  width: 100%;
  font-family: inherit;
  font-size: var(--body-size_m);
}
.input__field:focus {
  border-color: var(--accent-default);
  outline: none;
}
.input__message.error {
  color: var(--error-default);
}

</style>