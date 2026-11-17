<template>
  <div class="blur">
    <div class="modal">
      <div class="form">
        <div class="texting">
          <h1 class="heading-h1">Еще немного!</h1>
          <span class="body-b1">
            Осталось заполнить всего несколько полей
          </span>
        </div>

        <div class="inputs">
          <UiInput label="Фамилия" v-model="form.last_name" />
          <UiInput label="Имя" v-model="form.name" />
          <UiInput label="Отчество" v-model="form.patronymic" />
          <UiInput label="Код организации" v-model="form.organization_code" />
        </div>

        <UiButton id="button" @click="submit">
          <span class="heading-h4">Присоединиться</span>
        </UiButton>
      </div>

      <img src="@/assets/images/teacher/teacher.jpg" alt="" />
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { UiInput, UiButton } from '@/shared/ui';

const emit = defineEmits(['saved']);

const form = reactive({
  last_name: '',
  name: '',
  patronymic: '',
  organization_code: '',
});

async function submit() {
  try {
    await httpClient.post(API_ROUTES.teacher.init, form);
    emit('saved');
  } catch (err) {
    console.error('Ошибка инициализации преподавателя', err);
  }
}
</script>

<style scoped>
.blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.modal {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 60px;
  padding: var(--padding-xl, 32px);
  border-radius: var(--border-radius-xxl, 32px);
  background: var(--background-surface1);
}
.texting {
  display: flex;
  flex-direction: column;
  gap: var(--gap-vertical-7);
  max-width: 380px;
}
.inputs {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--gap-vertical-4);
  margin-top: 16px;
  width: 100%;
}
#button {
  margin-top: 24px;
}
</style>