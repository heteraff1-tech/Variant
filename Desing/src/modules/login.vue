<template>
  <div id="app-content">
    <form class="form">
      <h1 class="heading-h1">Вход в аккаунт</h1>

      <div class="contant">
        <UiInput
          label="Логин"
          placeholder="Придумайте никнейм"
          required
          type="text"
          v-model="form.login"
        />

        <UiInput
          label="Пароль"
          placeholder="Пароль от аккаунта"
          required
          type="password"
          v-model="form.password"
        />
      </div>

      <div class="content-button">
        <UiButton @click="sendForm"> Войти </UiButton>
        <span class="body-b3">Нет аккаунта? <a href="/register">Регистрация</a></span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import api from '@/http-common.js'; // axios instance
import { useRouter } from 'vue-router'; // навигация
import UiInput from '@/components/ui/input.vue';
import UiButton from '@/components/ui/button.vue';
import { useToast } from 'vue-toastification';
const toast = useToast();
// 1. Создаём реактивный объект формы
const form = reactive({
  login: '',
  password_hash: '',
});

// 2. Получаем router (чтобы делать переходы)
const router = useRouter();

// 3. Функция отправки формы
async function sendForm(event: Event) {
  event.preventDefault();

  try {
    // 4. Запрос на API
    const response = await api.post('/auth/login', {
      login: form.login,
      password: form.password,
    });

    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('userid', user.id);
    localStorage.setItem('role_id', user.role_id);

    switch (user.role_id) {
      case 1: // студент
        router.push(`/student/${user.id}`);
        break;

      case 3: // учитель
        router.push(`/teacher/${user.id}`);
        break;

      case 2: // администратор
        router.push(`/admin/${user.id}`);
        break;

      default:
        router.push('/login');
    }

    console.log('Ответ сервера:', response.data);
    // 🎯 здесь позже добавим:
    // - сохранение токена
    // - role redirect
    // - обработку ошибок
  } catch (error) {
    console.error('Ошибка логина:', error);
    toast.error('Ошибка при входе: ' + (error.response?.data?.message || error.message));
  }
}
</script>
<style scoped src="@/assets/styles/auth/login.css"></style>
