import { ref } from 'vue';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { handleError } from '@/shared/lib/errorHandler';

/**
 * Composable для работы с тестами студента (API-интеграция)
 */
export function useStudentTests() {
  const tests = ref([]);
  const currentTest = ref(null);
  const result = ref(null);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Загрузить список доступных тестов
   */
  async function loadTests(studentId) {
    loading.value = true;
    error.value = null;
    try {
      const response = await httpClient.get(API_ROUTES.student.tests(studentId));
      tests.value = response.data.data.tests;
    } catch (err) {
      error.value = err;
      handleError(err, { fallbackMessage: 'Ошибка загрузки тестов' });
    } finally {
      loading.value = false;
    }
  }

  /**
   * Загрузить тест для прохождения
   */
  async function loadTest(studentId, testId) {
    loading.value = true;
    error.value = null;
    try {
      const response = await httpClient.get(API_ROUTES.student.testById(studentId, testId));
      currentTest.value = response.data.data.test;
      return currentTest.value;
    } catch (err) {
      error.value = err;
      handleError(err, { fallbackMessage: 'Ошибка загрузки теста' });
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Отправить ответы
   * @param {Array} answers - [{ questionId, answerIds: [] }]
   */
  async function submitTest(studentId, testId, answers) {
    loading.value = true;
    error.value = null;
    try {
      const response = await httpClient.post(
        API_ROUTES.student.submitTest(studentId, testId),
        { answers }
      );
      result.value = response.data.data.result;
      return result.value;
    } catch (err) {
      error.value = err;
      handleError(err, { fallbackMessage: 'Ошибка отправки ответов' });
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    tests,
    currentTest,
    result,
    loading,
    error,
    loadTests,
    loadTest,
    submitTest,
  };
}
