<template>
  <div class="container">
    <nav>
      <div class="info">
        <h5 class="heading-h4">Екатерина Васильевна</h5>
        <span class="description-d1">Преподаватель</span>
      </div>
      <div class="menu">
        <div class="item">
          <span class="body-b2">Главная страница</span>
        </div>
        <div class="item">
          <a class="body-b2">Журнал</a>
        </div>
        <div class="item">
          <a class="body-b2">Конструктор теста</a>
        </div>
      </div>
    </nav>
    <div class="content">
      <div class="header">
        <h1 class="heading-h1">Создание теста</h1>
        <a href="">Посмотреть подсказку</a>
      </div>

      <div class="designer">
        <!-- СПИСОК ВОПРОСОВ -->
        <div v-for="(question, qIndex) in questions" :key="qIndex" class="question">
          <div style="display: flex; justify-content: space-between; align-items: center">
            <h2>Вопрос {{ qIndex + 1 }}</h2>
            <button
              v-if="questions.length > 1"
              @click="removeQuestion(qIndex)"
              class="delete-question-btn"
              type="button"
            >
              🗑️ Удалить вопрос
            </button>
          </div>

          <div class="information">
            <div class="description">
              <!-- ТЕКСТ ВОПРОСА -->
              <UiInput
                v-model="question.description"
                placeholder="Введите текст вопроса"
                type="text"
              />
              <!-- ЗАГРУЗКА ИЗОБРАЖЕНИЯ ВОПРОСА -->
              <input
                type="file"
                :ref="`questionFileInput${qIndex}`"
                style="display: none"
                accept="image/*"
                @change="e => onQuestionImageSelected(e, qIndex)"
              />
              <!-- ПРЕВЬЮ ИЗОБРАЖЕНИЯ ВОПРОСА -->
              <div v-if="question.imagePreview" class="add-img-container">
                <div class="add-img" :style="{ display: 'flex' }">
                  <div
                    class="info-add-img"
                    :style="{ backgroundImage: `url(${question.imagePreview})` }"
                  ></div>
                  <div class="img-controls">
                    <a
                      href="#"
                      class="add-text"
                      @click.prevent="$refs[`questionFileInput${qIndex}`][0].click()"
                    >
                      Изменить фотографию
                    </a>
                    <a
                      href="#"
                      class="add-text delete-btn"
                      @click.prevent="removeQuestionImage(qIndex)"
                    >
                      Удалить
                    </a>
                  </div>
                </div>
              </div>
              <a
                v-else
                href="#"
                class="add-text"
                @click.prevent="$refs[`questionFileInput${qIndex}`][0].click()"
              >
                + Добавить фотографию к вопросу
              </a>
            </div>
            <!-- ВАРИАНТЫ ОТВЕТОВ -->
            <div class="add-answer">
              <div class="answers">
                <div v-for="(answer, aIndex) in question.answers" :key="aIndex" class="answer">
                  <div class="check">
                    <!-- ЧЕКБОКС ПРАВИЛЬНОГО ОТВЕТА -->
                    <input
                      type="checkbox"
                      v-model="answer.isCorrect"
                      :id="`answer-${qIndex}-${aIndex}`"
                    />
                    <!-- ТЕКСТ ОТВЕТА -->
                    <UiInput
                      v-model="answer.text"
                      :label="`Вариант ответа ${aIndex + 1}`"
                      placeholder="Введите вариант ответа"
                      type="text"
                    />
                  </div>
                  <!-- УДАЛЕНИЕ ОТВЕТА -->
                  <div class="delete" @click="removeAnswer(qIndex, aIndex)" style="cursor: pointer">
                    <img src="@/assets/images/common/delete.svg" alt="Удалить" />
                  </div>
                </div>
              </div>
              <!-- ДОБАВИТЬ ОТВЕТ -->
              <a href="#" class="add-text" @click.prevent="addAnswer(qIndex)">
                + Добавить вариант ответа
              </a>
            </div>
          </div>
        </div>
        <!-- ДОБАВИТЬ ВОПРОС -->
        <UiButton @click="addQuestion" secondary type="button"> Добавить вопрос </UiButton>
      </div>
    </div>
    <div class="setting">
      <div class="setting-test">
        <h3 class="heading-h3">Настройки теста</h3>
        <div class="inputs">
          <UiInput
            v-model="beginningDate"
            label="Начало теста"
            placeholder="Выбрать дату"
            required
            type="date"
          />
          <UiInput
            v-model="endDate"
            label="Окончание теста"
            placeholder="Выбрать дату"
            required
            type="date"
          />
          <UiInput
            v-model="testTime"
            label="Время прохождения (минуты)"
            placeholder="Назначить время"
            required
            type="number"
          />

          <!-- ВЫБОР ПРЕДМЕТА -->
          <div class="subject-selection">
            <label class="body-b2">Выбор предмета *</label>
            <select v-model="selectedSubjectId" required class="subject-select">
              <option :value="null" disabled>Выберите предмет</option>
              <option v-for="subject in availableSubjects" :key="subject.id" :value="subject.id">
                {{ subject.title }}
              </option>
            </select>
          </div>

          <div class="group-selection">
            <label class="body-b2">Выбор групп *</label>

            <div v-if="loading" class="loading">Загрузка групп...</div>

            <div v-else-if="!selectedSubjectId" class="no-subject">
              <span class="description-d1">Сначала выберите предмет</span>
            </div>

            <div v-else-if="filteredGroups.length === 0" class="no-groups">
              <span class="description-d1">Нет доступных групп для выбранного предмета</span>
            </div>

            <div v-else class="custom-multiselect">
              <!-- Кнопка для раскрытия списка -->
              <div class="multiselect-trigger" @click="isGroupDropdownOpen = !isGroupDropdownOpen">
                <span v-if="selectedGroupIds.length === 0" class="placeholder">
                  Выберите группы
                </span>
                <span v-else class="selected-text"> Выбрано: {{ selectedGroupIds.length }} </span>
                <span class="arrow" :class="{ open: isGroupDropdownOpen }">▼</span>
              </div>

              <!-- Выпадающий список с чекбоксами -->
              <div v-if="isGroupDropdownOpen" class="multiselect-dropdown">
                <div
                  v-for="group in filteredGroups"
                  :key="group.id"
                  class="multiselect-option"
                  @click="toggleGroupSelection(group.id)"
                >
                  <input
                    type="checkbox"
                    :checked="selectedGroupIds.includes(group.id)"
                    @click.stop
                  />
                  <span>{{ group.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="info-text">
        <h3 class="heading-h3">Информация теста</h3>
        <div class="content-test">
          <UiInput
            v-model="testTitle"
            label="Заголовок"
            placeholder="Введите название"
            required
            type="text"
          />
          <UiInput
            v-model="testDescription"
            label="Описание"
            placeholder="Введите описание теста"
            required
            type="text"
          />
        </div>
      </div>
      <div class="intro-img">
        <h3 class="heading-h3">Обложка теста</h3>
        <div class="input-add">
          <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            width="48.000000"
            height="48.000000"
            opacity="0.199999988"
            fill="none"
          >
            <rect
              id="Свойство 1=Export"
              width="48.000000"
              height="48.000000"
              x="0.000000"
              y="0.000000"
            />
            <path
              id="fill"
              d="M39 19.5L39 40.5L9 40.5L9 19.5L39 19.5Z"
              opacity="0.200000003"
              fill="rgb(232,232,238)"
              fill-rule="nonzero"
            />
            <path
              id="border"
              d="M20.5 10.1213L17.5613 13.0612C17.3371 13.2852 17.0478 13.4325 16.7348 13.482C16.4219 13.5315 16.1012 13.4807 15.8189 13.3368C15.5366 13.1929 15.307 12.9634 15.1632 12.681C15.0193 12.3987 14.9685 12.0781 15.018 11.7651C15.0675 11.4521 15.2148 11.1628 15.4388 10.9387L22.9388 3.43871C23.125 3.25229 23.357 3.11821 23.6115 3.04996C23.866 2.98172 24.134 2.98172 24.3885 3.04996C24.643 3.11821 24.875 3.25229 25.0613 3.43871L32.5612 10.9387C32.7852 11.1629 32.9325 11.4521 32.982 11.7651C33.0315 12.0781 32.9806 12.3987 32.8367 12.681C32.6929 12.9633 32.4633 13.1928 32.181 13.3367C31.8987 13.4806 31.5781 13.5314 31.2651 13.4819C30.9522 13.4324 30.6629 13.2852 30.4387 13.0612L27.5 10.1213L25.5 8.12058L25.5 25.5C25.5 25.8167 25.3997 26.1254 25.2135 26.3816C25.0273 26.6379 24.7648 26.8287 24.4635 26.9265C24.1623 27.0244 23.8377 27.0244 23.5365 26.9265C23.2352 26.8287 22.9727 26.6379 22.7865 26.3816C22.6003 26.1254 22.5 25.8167 22.5 25.5L22.5 8.12058L20.5 10.1213ZM12.5 21L15 21C15.3168 21 15.6254 20.8997 15.8817 20.7135C16.1379 20.5273 16.3287 20.2647 16.4266 19.9635C16.5245 19.6622 16.5245 19.3377 16.4266 19.0364C16.3287 18.7352 16.1379 18.4726 15.8817 18.2864C15.6254 18.1002 15.3168 18 15 18L10.5 18C9.97339 18 9.45606 18.1386 9 18.4019C8.54394 18.6652 8.16523 19.0439 7.90192 19.5C7.63862 19.956 7.5 20.4734 7.5 21L7.5 39C7.5 39.5266 7.63862 40.0439 7.90192 40.5C8.16523 40.956 8.54394 41.3347 9 41.598C9.45606 41.8613 9.97339 42 10.5 42L37.5 42C38.0266 42 38.5439 41.8613 39 41.598C39.4561 41.3347 39.8348 40.956 40.0981 40.5C40.3614 40.0439 40.5 39.5266 40.5 39L40.5 21C40.5 20.4734 40.3614 19.956 40.0981 19.5C39.8348 19.0439 39.4561 18.6652 39 18.4019C38.5439 18.1386 38.0266 18 37.5 18L33 18C32.6832 18 32.3746 18.1002 32.1183 18.2864C31.862 18.4726 31.6713 18.7352 31.5734 19.0364C31.4755 19.3377 31.4755 19.6622 31.5734 19.9635C31.6713 20.2647 31.862 20.5273 32.1183 20.7135C32.3746 20.8997 32.6832 21 33 21L37.5 21L37.5 39L10.5 39L10.5 21L12.5 21Z"
              fill="rgb(171,174,180)"
              fill-rule="evenodd"
            />
          </svg>
          <span class="body-b1">Нажмите, чтобы загрузить фотографию</span>
        </div>
      </div>
      <UiButton @click="publishTest" :disabled="loading" type="button">
        {{ loading ? 'Публикация...' : 'Опубликовать тест' }}
      </UiButton>
    </div>
  </div>
</template>
<style scoped src="@/assets/styles/roles/teacher/create-task.css"></style>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from '@/http-common.js';
import { useToast } from 'vue-toastification';
const toast = useToast();
const route = useRouter();

const router = useRouter();

// ============ СОСТОЯНИЕ ФОРМЫ ============
// ID пользователя и учителя
const userId = ref(route.params.id); // user_id из URL
const teacherId = ref(null); // teacher_id получаем с сервера

// Настройки теста
const testTitle = ref('');
const testDescription = ref('');
const beginningDate = ref('');
const endDate = ref('');
const testTime = ref('');
const selectedSubjectId = ref(null);
const selectedGroupIds = ref([]); // Массив ID выбранных групп
const isGroupDropdownOpen = ref(false); // Состояние для dropdown групп

// Обложка теста
const testCoverImage = ref(null);
const testCoverImagePreview = ref(null);

// Вопросы
const questions = ref([
  {
    description: '',
    imageFile: null,
    imagePreview: null,
    answers: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  },
]);

// ============ ДАННЫЕ С СЕРВЕРА ============
const teacherInfo = ref({
  id: null,
  name: '',
  last_name: '',
  patronymic: '',
});

const availableGroups = ref([]); // Список доступных групп учителя
const availableSubjects = ref([]); // Список предметов учителя
const loading = ref(false);
const error = ref(null);

// ============ ПОЛУЧЕНИЕ ДАННЫХ ============
// Получить информацию об учителе и его teacher_id
async function fetchTeacherInfo() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const response = await axios.get('/teacher/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Сохраняем данные учителя
    teacherInfo.value = response.data.teacher;
    teacherId.value = response.data.teacher.id;

    console.log('Teacher info loaded:', teacherInfo.value);
    console.log('Teacher ID:', teacherId.value);
  } catch (err) {
    console.error('Ошибка получения информации учителя:', err);
    router.push('/');
  }
}
// Получить группы учителя
async function fetchTeacherGroups() {
  try {
    loading.value = true;
    const token = localStorage.getItem('token');

    const response = await axios.get('/teacher/groups', {
      headers: { Authorization: `Bearer ${token}` },
    });

    availableGroups.value = response.data.groups;
    console.log('Загружено групп:', availableGroups.value.length);

    // Извлекаем уникальные предметы из групп
    const subjectsMap = new Map();
    response.data.groups.forEach(group => {
      if (group.subjects) {
        group.subjects.forEach(subject => {
          if (!subjectsMap.has(subject.id)) {
            subjectsMap.set(subject.id, subject);
          }
        });
      }
    });
    availableSubjects.value = Array.from(subjectsMap.values());
    console.log('Загружено предметов:', availableSubjects.value.length);
  } catch (err) {
    console.error('Ошибка получения групп:', err);
    error.value = 'Не удалось загрузить группы';
  } finally {
    loading.value = false;
  }
}

// ============ COMPUTED PROPERTIES ============
// Фильтрация групп по выбранному предмету
const filteredGroups = computed(() => {
  if (!selectedSubjectId.value) {
    return [];
  }

  return availableGroups.value.filter(group => {
    // Проверяем, есть ли выбранный предмет в массиве subjects группы
    return group.subjects && group.subjects.some(subject => subject.id === selectedSubjectId.value);
  });
});

// ============ РАБОТА С ВОПРОСАМИ ============
// Добавить вопрос
function addQuestion() {
  questions.value.push({
    description: '',
    imageFile: null,
    imagePreview: null,
    answers: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });
}
// Удалить вопрос
function removeQuestion(index) {
  if (questions.value.length > 1) {
    questions.value.splice(index, 1);
  }
}
// Добавить вариант ответа
function addAnswer(questionIndex) {
  questions.value[questionIndex].answers.push({
    text: '',
    isCorrect: false,
  });
}
// Удалить вариант ответа
function removeAnswer(questionIndex, answerIndex) {
  if (questions.value[questionIndex].answers.length > 2) {
    questions.value[questionIndex].answers.splice(answerIndex, 1);
  }
}
// ============ РАБОТА С ИЗОБРАЖЕНИЯМИ ============
const fileInput = ref(null);
// Загрузка изображения обложки теста
const triggerUpload = () => {
  fileInput.value.click();
};
const onFileSelected = event => {
  const file = event.target.files[0];
  if (file) {
    testCoverImage.value = file;
    testCoverImagePreview.value = URL.createObjectURL(file);
  }
};
const removeImage = () => {
  testCoverImage.value = null;
  testCoverImagePreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
// Загрузка изображения вопроса
function onQuestionImageSelected(event, questionIndex) {
  const file = event.target.files[0];
  if (file) {
    questions.value[questionIndex].imageFile = file;
    questions.value[questionIndex].imagePreview = URL.createObjectURL(file);
  }
}
function removeQuestionImage(questionIndex) {
  questions.value[questionIndex].imageFile = null;
  questions.value[questionIndex].imagePreview = null;
}

// ============ ВЫБОР ГРУПП ============
// Переключение выбора группы (клик на чекбокс)
function toggleGroupSelection(groupId) {
  const index = selectedGroupIds.value.indexOf(groupId);
  if (index > -1) {
    selectedGroupIds.value.splice(index, 1);
  } else {
    selectedGroupIds.value.push(groupId);
  }
}

// ============ ПУБЛИКАЦИЯ ТЕСТА ============
async function publishTest() {
  try {
    // Валидация
    if (!testTitle.value) {
      toast.error('Введите заголовок теста');
      return;
    }

    if (selectedGroupIds.value.length === 0) {
      toast.warning('Выберите хотя бы одну группу');
      return;
    }
    if (!selectedSubjectId.value) {
      toast.error('Выберите предмет');
      return;
    }
    if (questions.value.some(q => !q.description)) {
      toast.error('Заполните все вопросы');
      return;
    }
    if (questions.value.some(q => q.answers.some(a => !a.text))) {
      toast.error('Заполните все варианты ответов');
      return;
    }
    if (questions.value.some(q => !q.answers.some(a => a.isCorrect))) {
      toast.error('В каждом вопросе должен быть хотя бы один правильный ответ');
      return;
    }
    loading.value = true;
    // Создаем FormData (для отправки файлов)
    const formData = new FormData();

    formData.append('title', testTitle.value);
    formData.append('description', testDescription.value);
    formData.append('beginning_date', beginningDate.value);
    formData.append('end_date', endDate.value);
    formData.append('time', testTime.value);
    formData.append('subject_id', selectedSubjectId.value);
    formData.append('group_ids', JSON.stringify(selectedGroupIds.value));
    // Добавляем обложку теста
    if (testCoverImage.value) {
      formData.append('img', testCoverImage.value);
    }
    // Подготавливаем данные вопросов (без файлов)
    const questionsData = questions.value.map(q => ({
      description: q.description,
      answers: q.answers.map(a => ({
        text: a.text,
        isCorrect: a.isCorrect,
      })),
    }));
    formData.append('questions', JSON.stringify(questionsData));
    // Добавляем изображения вопросов
    questions.value.forEach((q, index) => {
      if (q.imageFile) {
        formData.append(`questionImage_${index}`, q.imageFile);
      }
    });
    // Отправляем на сервер
    const token = localStorage.getItem('token');
    const response = await axios.post('/createTest/', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    toast.success('Тест успешно опубликован!');
    router.push(`/teacher/${userId.value}`); // Редирект на главную учителя
  } catch (err) {
    console.error('Ошибка публикации теста:', err);
    toast.error('Ошибка при публикации теста: ' + (err.response?.data?.message || err.message));
  } finally {
    loading.value = false;
  }
}
// ============ ИНИЦИАЛИЗАЦИЯ ============
onMounted(() => {
  fetchTeacherInfo();
  fetchTeacherGroups();
});
</script>
