<template>
  <form class="form" @submit.prevent="submitForm">
    <h1 class="heading-h1">Регистрация</h1>

    <div class="contant">
      <UiSelect
        v-model="formData.role"
        label="Кто вы?"
        placeholder="Выберите роль"
        :options="roleOptions"
        :error="errors.role"
      />

      <!-- Обычные поля (без профиля — для роли без личных данных) -->
      <template v-if="!needsProfile">
        <UiInput
          label="Логин"
          placeholder="Придумайте логин"
          required
          v-model="formData.login"
          :error="errors.login"
        />

        <UiInput
          label="Пароль"
          placeholder="Придумайте пароль"
          required
          type="password"
          v-model="formData.password"
          :error="errors.password"
        />

        <UiInput
          label="Повторите пароль"
          placeholder="Тот же пароль ещё раз"
          required
          type="password"
          v-model="formData.confirmPassword"
          :error="errors.confirmPassword"
        />
      </template>

      <!-- Сетка для студента и преподавателя -->
      <template v-if="needsProfile">
        <div class="profile-grid">
          <UiInput
            label="Логин"
            placeholder="Придумайте логин"
            required
            v-model="formData.login"
            :error="errors.login"
          />

          <UiInput
            label="Фамилия"
            placeholder="Иванов"
            required
            v-model="formData.last_name"
            :error="errors.last_name"
          />

          <UiInput
            label="Имя"
            placeholder="Иван"
            required
            v-model="formData.name"
            :error="errors.name"
          />

          <UiInput
            label="Отчество"
            placeholder="Иванович (необязательно)"
            v-model="formData.patronymic"
            :error="errors.patronymic"
          />

          <UiInput
            label="Пароль"
            placeholder="Придумайте пароль"
            required
            type="password"
            v-model="formData.password"
            :error="errors.password"
          />

          <UiInput
            label="Повторите пароль"
            placeholder="Тот же пароль ещё раз"
            required
            type="password"
            v-model="formData.confirmPassword"
            :error="errors.confirmPassword"
          />

          <div class="profile-grid__full">
            <UiInput
              label="Код организации"
              placeholder="Введите код от преподавателя / администратора"
              required
              v-model="formData.orgCode"
              :error="errors.orgCode"
            />
          </div>
        </div>
      </template>
    </div>

    <div class="content-button">
      <UiButton type="submit" :loading="isLoading"> Зарегистрироваться </UiButton>
      <span class="body-b3">
        Уже есть аккаунт? <router-link to="/login">Войти</router-link>
      </span>
    </div>
  </form>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { UiInput, UiButton, UiSelect } from '@/shared/ui';
import { useRegisterForm } from '../model/useRegisterForm';

const router = useRouter();
const {
  formData,
  errors,
  isLoading,
  roleOptions,
  needsProfile,
  handleSubmit,
} = useRegisterForm();

const submitForm = async () => {
  const result = await handleSubmit();
  if (result.success) {
    router.push('/login');
  }
};
</script>

<style scoped src="@/assets/styles/auth/register.css"></style>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-self: stretch;
}

.profile-grid__full {
  grid-column: 1 / -1;
}
</style>