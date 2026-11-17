import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'vue-toastification';
import * as yup from 'yup';


// 1. Схема валидации
const loginSchema = yup.object({
  login: yup
    .string()
    .required('Введите логин'),
  password: yup
    .string()
    .required('Введите пароль')
    .min(6, 'Пароль должен быть не менее 6 символов'),
});


/**
 * Хук логики формы входа
 */
export function useLoginForm() {
  const authStore = useAuthStore();
  const toast = useToast();

  // 2. Реактивное состояние
  const formData = ref({
    login: '',
    password: '',
  });
  const errors = ref({});
  const isLoading = ref(false);

  // 3. Методы (Actions)
  
  // Валидация одного поля (можно использовать при @blur)
  const validateField = async (field) => {
    try {
      await loginSchema.validateAt(field, formData.value);
      errors.value[field] = '';
    } catch (err) {
      errors.value[field] = err.message;
    }
  };

  // Основной метод отправки
  const handleSubmit = async () => {
    errors.value = {};
    isLoading.value = true;

    try {

      // 1. Проверяем валидацию
      await loginSchema.validate(formData.value, { abortEarly: false });

      // 2. Вызываем метод стора (бизнес-логика авторизации там)
      await authStore.login(formData.value);
      toast.success('Добро пожаловать!');
      
      // 3. Редирект делает сам стор или компонент (тут оставим стору)
      authStore.redirectByRole();
      
    } catch (err) {

      // Обработка ошибок валидации Yup
      if (err.inner) {
        err.inner.forEach((validationError) => {
          errors.value[validationError.path] = validationError.message;
        });
      } else {
        
        // Ошибки API уже обработаны в store/http-client
        console.error('Ошибка входа:', err);
      }
    } finally {
      isLoading.value = false;
    }
  };
  return {
    formData,
    errors,
    isLoading,
    validateField,
    handleSubmit,
  };
}