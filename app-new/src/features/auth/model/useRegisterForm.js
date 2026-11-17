import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'vue-toastification';
import * as yup from 'yup';

// Базовая схема (для всех ролей)
const baseSchema = {
  role: yup.string().required('Выберите роль'),
  login: yup
    .string()
    .required('Введите логин')
    .min(3, 'Логин должен быть не менее 3 символов')
    .matches(/^[a-zA-Z0-9_]+$/, 'Только латинские буквы, цифры и _'),
  password: yup
    .string()
    .required('Введите пароль')
    .min(8, 'Пароль должен быть не менее 8 символов'),
  confirmPassword: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),
};

// Дополнительная схема для студента и учителя
const profileSchema = {
  last_name: yup.string().required('Введите фамилию'),
  name: yup.string().required('Введите имя'),
  patronymic: yup.string(),
  orgCode: yup.string().required('Введите код организации'),
};

/**
 * Хук логики формы регистрации
 */
export function useRegisterForm() {
  const authStore = useAuthStore();
  const toast = useToast();

  const formData = ref({
    role: '',
    login: '',
    password: '',
    confirmPassword: '',
    last_name: '',
    name: '',
    patronymic: '',
    orgCode: '',
  });

  const errors = ref({});
  const isLoading = ref(false);

  // Опции для селекта ролей
  const roleOptions = [
    { value: 'студент', label: 'Студент' },
    { value: 'учитель', label: 'Учитель' },
    { value: 'администратор', label: 'Администратор' },
  ];

  // Нужна ли форма профиля (ФИО + код орг.)
  const needsProfile = computed(() =>
    formData.value.role === 'студент' || formData.value.role === 'учитель'
  );

  // Динамическая схема
  const getSchema = () => {
    if (needsProfile.value) {
      return yup.object({ ...baseSchema, ...profileSchema });
    }
    return yup.object(baseSchema);
  };

  const handleSubmit = async () => {
    errors.value = {};
    isLoading.value = true;

    try {
      await getSchema().validate(formData.value, { abortEarly: false });

      const { confirmPassword, ...payload } = formData.value;

      // Если администратор — не отправляем поля профиля
      if (!needsProfile.value) {
        const { last_name, name, patronymic, orgCode, ...adminPayload } = payload;
        await authStore.register(adminPayload);
      } else {
        await authStore.register(payload);
      }

      toast.success('Регистрация успешна! Теперь войдите в систему.');
      return { success: true };
    } catch (err) {
      if (err.inner) {
        err.inner.forEach((validationError) => {
          errors.value[validationError.path] = validationError.message;
        });
      } else {
        console.error('Ошибка регистрации:', err);
      }
      return { success: false };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    formData,
    errors,
    isLoading,
    roleOptions,
    needsProfile,
    handleSubmit,
  };
}
