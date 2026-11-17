<template>
  <div class="container">
    <!-- ==================== КОНСТРУКТОР ВОПРОСОВ ==================== -->
    <div class="content">
      <div class="header">
        <h1 class="heading-h1">Создание теста</h1>
        <a href="#">Посмотреть подсказку</a>
      </div>

      <div class="designer">
        <!-- СПИСОК ВОПРОСОВ -->
        <div v-for="(question, qIndex) in questions" :key="qIndex" class="question">
          <div class="question-header">
            <h2>Вопрос {{ qIndex + 1 }}</h2>
            <div class="question-header-controls">
              <!-- ВЫБОР ТИПА ВОПРОСА -->
              <select
                :value="question.question_type"
                @change="changeQuestionType(qIndex, $event.target.value)"
                class="type-select"
              >
                <option v-for="qt in QUESTION_TYPES" :key="qt.value" :value="qt.value">
                  {{ qt.label }}
                </option>
              </select>
              <button
                v-if="questions.length > 1"
                @click="removeQuestion(qIndex)"
                class="delete-question-btn"
                type="button"
              >
                Удалить вопрос
              </button>
            </div>
          </div>

          <div class="information">
            <div class="description">
              <!-- ТЕКСТ ВОПРОСА -->
              <UiInput
                v-if="question.question_type !== 'fill_blanks'"
                v-model="question.description"
                placeholder="Введите текст вопроса"
                type="text"
              />

              <!-- ТЕКСТ С ПРОПУСКАМИ (fill_blanks) -->
              <div v-if="question.question_type === 'fill_blanks'" class="fill-blanks-editor">
                <label class="body-b2">
                  Текст с пропусками (оберните ответы в фигурные скобки)
                </label>
                <textarea
                  v-model="question.description"
                  class="fill-blanks-textarea"
                  placeholder="Пример: Столица России — {Москва}, а столица Франции — {Париж}"
                  rows="4"
                ></textarea>
                <div v-if="question.description" class="fill-blanks-preview">
                  <span class="fill-blanks-preview-label">Превью:</span>
                  <div v-html="getFillBlanksPreview(question.description)"></div>
                </div>
              </div>

              <!-- СКРЫТЫЙ INPUT ДЛЯ ФАЙЛА -->
              <input
                type="file"
                :ref="el => { if (el) questionFileInputs[qIndex] = el }"
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
                      @click.prevent="questionFileInputs[qIndex]?.click()"
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
                @click.prevent="questionFileInputs[qIndex]?.click()"
              >
                + Добавить фотографию к вопросу
              </a>
            </div>

            <!-- ========== ВАРИАНТЫ ОТВЕТОВ (single/multiple) ========== -->
            <div v-if="question.question_type === 'single_choice' || question.question_type === 'multiple_choice'" class="add-answer">
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
                  <!-- УДАЛЕНИЕ ОТВЕТА (только если > 3) -->
                  <div
                    v-if="question.answers.length > 3"
                    class="delete"
                    @click="removeAnswer(qIndex, aIndex)"
                  >
                    <img src="@/assets/svg/delete.svg" alt="Удалить" />
                  </div>
                </div>
              </div>
              <!-- ДОБАВИТЬ ОТВЕТ -->
              <a href="#" class="add-text" @click.prevent="addAnswer(qIndex)">
                + Добавить вариант ответа
              </a>
            </div>

            <!-- ========== ОТКРЫТЫЙ ОТВЕТ (open_answer) ========== -->
            <div v-if="question.question_type === 'open_answer'" class="open-answer-editor">
              <UiInput
                v-model="question.correctAnswer"
                label="Эталонный ответ"
                placeholder="Введите правильный ответ (сравнивается без учёта регистра)"
                type="text"
              />
              <span class="hint-text">
                Ответ студента будет сравниваться с эталоном без учёта регистра и лишних пробелов
              </span>
            </div>

            <!-- ========== СООТВЕТСТВИЕ (matching) ========== -->
            <div v-if="question.question_type === 'matching'" class="matching-editor">
              <div class="matching-header">
                <span class="matching-col-label">Левая сторона</span>
                <span class="matching-col-label">Правая сторона</span>
              </div>
              <div v-for="(pair, pIndex) in question.pairs" :key="pIndex" class="matching-pair">
                <UiInput
                  v-model="pair.left"
                  :placeholder="`Элемент ${pIndex + 1}`"
                  type="text"
                />
                <span class="matching-arrow">—</span>
                <UiInput
                  v-model="pair.right"
                  :placeholder="`Соответствие ${pIndex + 1}`"
                  type="text"
                />
                <button
                  v-if="question.pairs.length > 2"
                  @click="removePair(qIndex, pIndex)"
                  class="remove-item-btn"
                  type="button"
                >
                  x
                </button>
              </div>
              <a href="#" class="add-text" @click.prevent="addPair(qIndex)">
                + Добавить пару
              </a>
            </div>

            <!-- ========== ПОСЛЕДОВАТЕЛЬНОСТЬ (ordering) ========== -->
            <div v-if="question.question_type === 'ordering'" class="ordering-editor">
              <span class="hint-text">
                Расположите элементы в правильном порядке. Студент увидит их в перемешанном виде.
              </span>
              <div v-for="(item, iIndex) in question.items" :key="iIndex" class="ordering-item">
                <span class="ordering-number">{{ iIndex + 1 }}</span>
                <UiInput
                  v-model="item.text"
                  :placeholder="`Элемент ${iIndex + 1}`"
                  type="text"
                />
                <div class="ordering-controls">
                  <button
                    @click="moveOrderItem(qIndex, iIndex, -1)"
                    :disabled="iIndex === 0"
                    class="ordering-move-btn"
                    type="button"
                  >
                    ▲
                  </button>
                  <button
                    @click="moveOrderItem(qIndex, iIndex, 1)"
                    :disabled="iIndex === question.items.length - 1"
                    class="ordering-move-btn"
                    type="button"
                  >
                    ▼
                  </button>
                </div>
                <button
                  v-if="question.items.length > 2"
                  @click="removeOrderItem(qIndex, iIndex)"
                  class="remove-item-btn"
                  type="button"
                >
                  x
                </button>
              </div>
              <a href="#" class="add-text" @click.prevent="addOrderItem(qIndex)">
                + Добавить элемент
              </a>
            </div>
          </div>
        </div>

        <!-- ДОБАВИТЬ ВОПРОС -->
        <div class="add-question-section">
          <UiButton @click="addQuestion('single_choice')" secondary type="button">Добавить вопрос</UiButton>
        </div>
      </div>
    </div>

    <!-- ==================== ПАНЕЛЬ НАСТРОЕК ==================== -->
    <div class="setting">
      <!-- Настройки теста -->
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

          <!-- ПЕРЕМЕШИВАНИЕ ВОПРОСОВ -->
          <div class="shuffle-toggle">
            <label class="shuffle-label">
              <input type="checkbox" v-model="shuffleQuestions" />
              <span>Перемешать вопросы</span>
            </label>
            <span class="hint-text">У каждого студента вопросы будут в случайном порядке</span>
          </div>

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

          <!-- ВЫБОР ГРУПП -->
          <div class="group-selection">
            <label class="body-b2">Выбор групп *</label>

            <div v-if="loading" class="loading">Загрузка групп...</div>

            <div v-else-if="!selectedSubjectId" class="no-subject">
              <span class="description-d1">Сначала выберите предмет</span>
            </div>

            <div v-else-if="availableGroups.length === 0" class="no-groups">
              <span class="description-d1">Нет доступных групп для выбранного предмета</span>
            </div>

            <div v-else class="custom-multiselect">
              <!-- Кнопка раскрытия -->
              <div class="multiselect-trigger" @click="isGroupDropdownOpen = !isGroupDropdownOpen">
                <span v-if="selectedGroupIds.length === 0" class="placeholder">
                  Выберите группы
                </span>
                <span v-else class="selected-text">Выбрано: {{ selectedGroupIds.length }}</span>
                <span class="arrow" :class="{ open: isGroupDropdownOpen }">▼</span>
              </div>

              <!-- Выпадающий список с чекбоксами -->
              <div v-if="isGroupDropdownOpen" class="multiselect-dropdown">
                <div
                  v-for="group in availableGroups"
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

      <!-- Информация теста -->
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
            type="text"
          />
        </div>
      </div>

      <!-- Обложка теста -->
      <div class="intro-img">
        <h3 class="heading-h3">Обложка теста *</h3>

        <!-- Скрытый input для файла обложки -->
        <input
          type="file"
          ref="coverFileInput"
          style="display: none"
          accept="image/*"
          @change="onCoverSelected"
        />

        <!-- Превью обложки, если выбрана -->
        <div v-if="testCoverImagePreview" class="add-img-container">
          <div class="add-img">
            <div
              class="info-add-img"
              :style="{ backgroundImage: `url(${testCoverImagePreview})` }"
            ></div>
            <div class="img-controls">
              <a href="#" class="add-text" @click.prevent="coverFileInput.click()">
                Изменить фотографию
              </a>
              <a href="#" class="add-text delete-btn" @click.prevent="removeCover">Удалить</a>
            </div>
          </div>
        </div>

        <!-- Кнопка загрузки (если нет превью) -->
        <div v-else class="input-add" @click="coverFileInput.click()">
          <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
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

      <!-- Кнопка публикации -->
      <UiButton @click="publishTest" :disabled="loading" type="button">
        {{ loading ? 'Публикация...' : 'Опубликовать тест' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { UiInput, UiButton } from '@/shared/ui';
import { useTestConstructor } from '@/features/tests';

const {
  testTitle,
  testDescription,
  beginningDate,
  endDate,
  testTime,
  selectedSubjectId,
  selectedGroupIds,
  isGroupDropdownOpen,
  shuffleQuestions,
  testCoverImage,
  testCoverImagePreview,
  questions,
  availableSubjects,
  availableGroups,
  loading,
  QUESTION_TYPES,
  addQuestion,
  removeQuestion,
  changeQuestionType,
  addAnswer,
  removeAnswer,
  addPair,
  removePair,
  addOrderItem,
  removeOrderItem,
  moveOrderItem,
  onQuestionImageSelected,
  removeQuestionImage,
  onCoverSelected,
  removeCover,
  toggleGroupSelection,
  publishTest,
  getFillBlanksPreview,
} = useTestConstructor();

// Ref-массив для хранения ссылок на file inputs вопросов
const questionFileInputs = ref([]);

// Ref для input обложки
const coverFileInput = ref(null);
</script>

<style scoped src="@/assets/styles/roles/teacher/create-task.css"></style>
