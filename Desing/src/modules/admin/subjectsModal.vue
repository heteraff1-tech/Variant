Вот полный код шаблона для вашего компонента SubjectsModal.

Я разделил анимации: для overlay (затемнения) используется плавное появление через Vue Transition, а для modal-window — конкретный класс из Animate.css со скоростью 0.2с.

HTML

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    
    <div class="modal-window animate__animated animate__zoomIn">
      <h2 class="heading-h2">Предметы</h2>

      <TransitionGroup name="list" tag="div" class="list">
        <div
          class="subject-row"
          v-for="(subject, index) in localSubjects"
          :key="subject.id || index"
        >
          <UiInput
            class="subject-input"
            v-model="subject.title"
            placeholder="Название предмета"
          />
          <button class="remove-btn" @click="removeSubject(index)">✕</button>
        </div>
      </TransitionGroup>

      <a
        href="#"
        class="heading-h4 add-link"
        @click.prevent="addSubject"
      >
        Добавить предмет
      </a>

      <div class="actions">
        <UiButton variant="secondary" @click="$emit('close')">
          Отменить
        </UiButton>
        <UiButton @click="save"> 
          Сохранить 
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import api from "@/http-common.js";
import UiInput from "@/components/ui/input.vue";
import UiButton from "@/components/ui/button.vue";

const props = defineProps({
  subjects: {
    type: Array,
    required: true,
  },
  adminId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["close", "saved"]);

// Локальная копи
const localSubjects = ref([]);

watch(
  () => props.subjects,
  (val) => {
    localSubjects.value = val.map((s) => ({ ...s }));
  },
  { immediate: true }
);

function addSubject() {
  localSubjects.value.push({ title: "" });
}

function removeSubject(index) {
  localSubjects.value.splice(index, 1);
}

async function save() {
  try {
    await api.put(`/admin/${props.adminId}/subjects`, {
      subjects: localSubjects.value,
    });
    emit("saved");
  } catch (err) {
    console.error("Ошибка сохранения предметов", err);
  }
}
</script>
<style scoped>
/* 1. Настройка модального окна и фона */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  transition: opacity 0.2s ease;
}

.modal-window {
  --animate-duration: 0.2s; /* Скорость появления самого окна */
  width: 520px;
  max-height: 80vh;
  overflow-y: auto;
  background: white;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 2. Анимация списка предметов (100мс) */
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
}

/* Эффект для появления нового инпута */
.list-enter-active,
.list-leave-active {
  transition: all 0.1s ease; /* Ваша скорость 100мс */
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-10px); /* Слегка выезжает сбоку */
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.95); /* Чуть уменьшается при удалении */
}

/* Чтобы остальные элементы плавно двигались при добавлении/удалении */
.list-move {
  transition: transform 0.2s ease;
}

/* 3. Остальные стили */
.subject-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-input {
  flex: 1;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #ccc;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: var(--accent-default);
}

.add-link {
  display: inline-block;
  color: var(--accent-default);
  text-decoration: none;
  margin-top: 8px;
  font-weight: 500;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* 4. Анимация закрытия всей модалки */
.v-leave-active {
  transition: opacity 0.2s ease;
}
.v-leave-active .modal-window {
  animation: zoomOut 0.2s forwards;
}
.v-leave-to {
  opacity: 0;
}
</style>