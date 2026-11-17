<template>
  <div class="grade-cell" ref="cellRef">
    <input
      class="evaluation body-b2"
      :class="{ 'insanity': isCritical, 'has-test': isTestGrade }"
      type="text"
      maxlength="1"
      :value="displayValue"
      @input="onInput"
      @click="onCellClick"
      :readonly="isTestGrade"
    />

    <!-- Всплывающее окно с информацией о тесте -->
    <Teleport to="body">
      <div 
        v-if="showPopup && isTestGrade" 
        class="grade-popup-overlay"
        @click.self="closePopup"
      >
        <div class="grade-popup" ref="popupRef">
          <div class="popup-header">
            <div class="popup-icon"></div>
            <h4 class="popup-title">{{ testTitle }}</h4>
            <button class="popup-close" @click="closePopup">&times;</button>
          </div>
          
          <div class="popup-body">
            <div class="popup-info-row">
              <span class="info-label">Оценка:</span>
              <span class="info-value grade-badge" :class="gradeBadgeClass">{{ gradeValue }}</span>
            </div>
            <div class="popup-info-row">
              <span class="info-label">Всего вопросов:</span>
              <span class="info-value">{{ totalQuestions }}</span>
            </div>
            <div v-if="isGradeChanged" class="popup-notice">
              <span class="notice-icon">⚠️</span>
              <span>Оценка была изменена вручную</span>
            </div>
          </div>

          <div class="popup-actions">
            <button 
              class="btn-retake" 
              @click="onRetake"
              :disabled="isResetting"
            >
              <span v-if="!isResetting">Пересдать тест</span>
              <span v-else>Открытие пересдачи...</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  value: [String, Number, Object],
  studentId: Number,
  date: String,
  isResetting: Boolean,
});

const emit = defineEmits(['save', 'reset-test']);

const cellRef = ref(null);
const popupRef = ref(null);
const showPopup = ref(false);

// Определяем, является ли оценка объектом (с данными теста) или простым числом
const gradeData = computed(() => {
  if (props.value && typeof props.value === 'object') {
    return props.value;
  }
  return { grade: props.value, gradeId: null, testId: null, testTitle: null, totalQuestions: null };
});

const gradeValue = computed(() => gradeData.value.grade);
const isTestGrade = computed(() => !!gradeData.value.testId);
const testTitle = computed(() => gradeData.value.testTitle || 'Тест');
const totalQuestions = computed(() => gradeData.value.totalQuestions || '—');
const isGradeChanged = computed(() => false); // Можно расширить при необходимости

const displayValue = computed(() => {
  const val = gradeValue.value;
  if (val === -1) return "Н";
  if (val === -2) return "Б";
  if (val === -3) return "У";
  return val || "";
});

const isCritical = computed(() => gradeValue.value === -1 || gradeValue.value === 2);

const gradeBadgeClass = computed(() => {
  const g = gradeValue.value;
  if (g >= 4) return 'badge-good';
  if (g === 3) return 'badge-ok';
  if (g <= 2 && g > 0) return 'badge-bad';
  return '';
});

function onCellClick() {
  if (isTestGrade.value) {
    showPopup.value = true;
  }
}

function closePopup() {
  showPopup.value = false;
}

function onRetake() {
  emit('reset-test', {
    gradeId: gradeData.value.gradeId,
    studentId: props.studentId,
    date: props.date,
  });
  showPopup.value = false;
}

function onInput(e) {
  // Запрещаем ручное редактирование оценки теста через input
  if (isTestGrade.value) {
    e.target.value = displayValue.value;
    return;
  }

  const allowed = ["1", "2", "3", "4", "5", "Н", "Б", "У"];
  let val = e.target.value.toUpperCase();
  
  if (val === "Y") val = "Н"; // фикс раскладки
  
  if (!allowed.includes(val) && val !== "") {
    e.target.value = displayValue.value;
    return;
  }

  let grade = null;
  if (val === "Н") grade = -1;
  else if (val === "Б") grade = -2;
  else if (val === "У") grade = -3;
  else if (val === "") grade = null;
  else grade = Number(val);

  emit('save', {
    studentId: props.studentId,
    date: props.date,
    grade
  });
}
</script>

<style scoped>
.grade-cell {
  position: relative;
  width: 100%;
  height: 100%;
}

.evaluation {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  text-align: center;
  border: none;
  outline: none;
  border-radius: 0;
  padding: 0;
  font-size: 13px;
  transition: 0.15s ease;
  cursor: text;
  background: transparent;
  color: var(--foreground-default);
}

.evaluation.has-test {
  cursor: pointer;
  background: var(--accent-container-default);
  font-weight: 600;
  color: var(--accent-default);
}

.evaluation.has-test:hover {
  opacity: 0.8;
}

.insanity {
  color: var(--error-default) !important;
}

/* ========= Popup Overlay ========= */
.grade-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.15s ease;
}

/* ========= Popup ========= */
.grade-popup {
  background: var(--background-surface1);
  border: 1px solid var(--border-muted);
  border-radius: var(--border-radius-m);
  width: 380px;
  max-width: calc(100vw - 48px);
  overflow: hidden;
  animation: slideUp 0.18s ease;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-muted);
  background: var(--background-surface1);
}

.popup-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.popup-title {
  flex: 1;
  margin: 0;
  font-size: var(--heading-size_h4);
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--foreground-default);
}

.popup-close {
  background: var(--background-surface2);
  border: 1px solid var(--border-muted);
  color: var(--foreground-soft);
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-s);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.15s;
  flex-shrink: 0;
  line-height: 1;
}

.popup-close:hover {
  background: var(--background-page-filled);
  color: var(--foreground-default);
}

.popup-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.popup-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: var(--foreground-soft);
  font-size: var(--body-size_s);
  font-weight: 500;
}

.info-value {
  font-weight: 600;
  font-size: var(--body-size_s);
  color: var(--foreground-default);
}

.grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-s);
  font-size: 16px;
  font-weight: 700;
}

.badge-good {
  background: var(--accent-container-default);
  color: var(--accent-default);
}

.badge-ok {
  background: #fef3c7;
  color: #d97706;
}

.badge-bad {
  background: var(--error-container-default);
  color: var(--error-default);
}

.popup-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--background-surface2);
  border: 1px solid var(--border-muted);
  border-radius: var(--border-radius-s);
  font-size: var(--body-size_s);
  color: var(--foreground-soft);
  font-weight: 500;
}

.notice-icon {
  font-size: 14px;
}

.popup-actions {
  padding: 0 20px 20px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-retake {
  padding: var(--padding-s) var(--padding-m);
  border: none;
  border-radius: var(--border-radius-s);
  background: var(--accent-default);
  color: #fff;
  font-size: var(--body-size_s);
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
}

.btn-retake:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-retake:active:not(:disabled) {
  opacity: 0.75;
}

.btn-retake:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========= Animations ========= */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>