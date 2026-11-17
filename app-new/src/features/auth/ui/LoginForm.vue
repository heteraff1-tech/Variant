<template>
  <form class="form" @submit.prevent="handleSubmit">
    <h1 class="heading-h1">Вход в аккаунт</h1>

    <div class="contant">
      <UiInput
        label="Логин"
        placeholder="Введите ваш логин"
        required
        v-model="formData.login"
        :error="errors.login"
      />

      <UiInput
        label="Пароль"
        placeholder="Пароль от аккаунта"
        required
        type="password"
        v-model="formData.password"
        :error="errors.password"
      />
    </div>

    <div class="content-button">
      <UiButton type="submit" :loading="isLoading"> Войти </UiButton>
      <span class="body-b3">
        Нет аккаунта? <router-link to="/register">Регистрация</router-link>
      </span>
    </div>
  </form>
</template>

<script setup>
import { UiInput, UiButton } from '@/shared/ui';
import { useLoginForm } from '../model/useLoginForm';

const { 
  formData, 
  errors, 
  isLoading, 
  handleSubmit 
} = useLoginForm();
</script>

<style scoped src="@/assets/styles/auth/login.css"></style>