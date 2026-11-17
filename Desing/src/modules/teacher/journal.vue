<template>
  <section class="teacher-layout">
    <nav>
      <div class="info">
        <h5 class="heading-h4">Екатерина Васильевна</h5>
        <span class="description-d1">Преподаватель</span>
      </div>
      <div class="menu">
        <!-- <div class="item">
          <router-link class="body-b2" :to="`/teacher/${teacherId}`">Главная страница</router-link>
        </div> -->
<router-link class="body-b2" :to="`/teacher/${userId}/journal`">Журнал</router-link>

        <!-- <div class="item">
          <router-link class="body-b2" :to="`/teacher/${teacherId}/create-task`">Конструктор теста</router-link>
        </div> -->
      </div>
    </nav>

    <div class="content">
      <header>
        <div class="calendar">
          <img src="@/assets/svg/vuesax_linear_arrow-left.svg" @click="prevMonth" />
          <span>{{ month }}</span>
          <img src="@/assets/svg/vuesax_linear_arrow-right.svg" @click="nextMonth" />
        </div>

        <div class="fillters">
          <UiInput v-model="search" placeholder="Найдите по ФИО" type="text" />
          
          <!-- Селект предмета -->
          <div class="select select--default">
            <select class="select__control" v-model="selectedSubject" @change="onSubjectChange">
              <option :value="null" disabled>Выберите предмет</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject">
                {{ subject.title }}
              </option>
            </select>
          </div>

          <!-- Селект группы -->
          <div class="select select--default">
            <select 
              class="select__control" 
              v-model="selectedGroup" 
              @change="onGroupChange"
              :disabled="!selectedSubject || groups.length === 0"
            >
              <option :value="null" disabled>Выберите группу</option>
              <option v-for="group in groups" :key="group.id" :value="group">
                {{ group.title }}
              </option>
            </select>
          </div>
        </div>
      </header>

      <!-- Подсказка, если не выбраны предмет и группа -->
      <div v-if="!showJournal" class="journal-placeholder">
        <div class="placeholder-content">
          <h3 class="heading-h3">Выберите группу и предмет</h3>
          <p class="body-b2">Чтобы увидеть студентов и начать работу с журналом</p>
          <div v-if="isLoading" class="loader">Загрузка...</div>
          <div v-if="error" class="error-message">{{ error }}</div>
        </div>
      </div>

      <!-- Журнал (показывается только после выбора) -->
      <div v-else id="jounal">
        <div class="interpreter">
          <div class="№-fio">
            <div class="number">№</div>
            <span>Фамилия Имя Отчество</span>
          </div>

          <div class="date">
            <div
              v-for="day in daysInMonth"
              :key="day"
              class="data body-b2"
              :class="{ today: isToday(day) }"
            >
              {{ day }}
            </div>
          </div>

          <h5 class="body-b3">Средний балл</h5>
        </div>
        
        <div class="info-journal">
          <div class="list-fio">
            <div class="item" v-for="student in filteredStudents" :key="student.id">
              <div class="number heading-h5">{{ student.number }}</div>
              <span class="body-b3">{{ student.fullName }}</span>
            </div>
          </div>

          <div class="info-evaluations">
            <div
              class="evaluations"
              v-for="student in filteredStudents"
              :key="student.id"
            >
              <input
                v-for="(day, dayIndex) in daysInMonth"
                :key="day"
                class="evaluation body-b2"
                type="text"
                maxlength="1"
                :value="getGradeValue(student.id, day)"
                :data-student-id="student.id"
                :data-day="day"
                :data-row="student.number - 1"
                :data-col="dayIndex"
                @keydown="onKeyDown"
                @input="onInput"
              />
            </div>
          </div>

          <div class="list-result">
            <div 
              class="result body-b3" 
              v-for="student in filteredStudents" 
              :key="student.id"
            >
              {{ calculateAverage(student.id) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import api from '@/http-common'
import { ref, computed, onMounted, watch } from "vue"
import { useRoute } from 'vue-router'
import UiInput from "@/components/ui/input.vue"
import teacherService from '@/services/teacherService'

const route = useRoute()
const userId = computed(() => route.params.id)

const teacherId = ref(null)
// Состояние для выбора предмета и группы
const selectedSubject = ref(null)
const selectedGroup = ref(null)
const subjects = ref([])
const groups = ref([])
const students = ref([])
const gradesData = ref({}) // { studentId: { "2026-01-15": 5 } }
const isLoading = ref(false)
const error = ref(null)
const search = ref("")

// Вычисляемое свойство: показывать ли журнал
const showJournal = computed(() => {
  return selectedSubject.value && selectedGroup.value && students.value.length > 0
})

// Фильтрация студентов по поиску
const filteredStudents = computed(() => {
  if (!search.value) return students.value
  
  const searchLower = search.value.toLowerCase()
  return students.value.filter(student => 
    student.fullName.toLowerCase().includes(searchLower)
  )
})

const currentDate = ref(new Date())

const month = computed(() => {
  return currentDate.value.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
});

function prevMonth() {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() - 1);
  currentDate.value = d;
  reloadGrades();
}

function nextMonth() {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + 1);
  currentDate.value = d;
  reloadGrades();
}

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => i + 1);
});

function isToday(day) {
  const today = new Date()
  return (
    today.getDate() === day &&
    today.getMonth() === currentDate.value.getMonth() &&
    today.getFullYear() === currentDate.value.getFullYear()
  );
}

// ========== РАБОТА С ОЦЕНКАМИ ==========

// Преобразование числового кода в символ
function gradeToSymbol(gradeCode) {
  if (gradeCode === -1) return "Н"
  if (gradeCode === -2) return "Б"
  if (gradeCode === -3) return "У"
  return String(gradeCode) // 1-5
}

// Преобразование символа в числовой код
function symbolToGrade(symbol) {
  if (symbol === "Н") return -1
  if (symbol === "Б") return -2
  if (symbol === "У") return -3
  return Number(symbol) // 1-5
}

// Получить значение оценки для отображения
function getGradeValue(studentId, day) {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  const gradeCode = gradesData.value[studentId]?.[dateKey]
  if (gradeCode === undefined || gradeCode === null) return ""
  
  return gradeToSymbol(gradeCode)
}

// Вычислить средний балл студента
function calculateAverage(studentId) {
  const studentGrades = gradesData.value[studentId]
  if (!studentGrades) return "—"
  
  const numericGrades = Object.values(studentGrades).filter(g => g >= 1 && g <= 5)
  if (numericGrades.length === 0) return "—"
  
  const sum = numericGrades.reduce((acc, grade) => acc + grade, 0)
  const avg = sum / numericGrades.length
  return avg.toFixed(2)
}

// Получить реальный teacher_id по user_id
async function getTeacherId() {
  try {
    const response = await api.get('/teacher/state')
    teacherId.value = response.data.teacherId
    console.log('✅ Teacher ID получен:', teacherId.value)
  } catch (err) {
    console.error('❌ Ошибка получения teacher_id:', err)
    error.value = 'Не удалось получить данные учителя'
  }
}

// Обработка ввода оценки
async function onInput(e) {
  const allowed = ["1", "2", "3", "4", "5", "Н", "Б", "У"];
  const value = e.target.value.toUpperCase();

  e.target.classList.remove("insanity");

  if (!allowed.includes(value)) {
    e.target.value = "";
    return;
  }

  // Преобразуем Y в Н (для английской раскладки)
  let finalValue = value
  if (value === "Y") {
    finalValue = "Н";
  }

  e.target.value = finalValue;

  if (finalValue === "Н" || finalValue === "2") {
    e.target.classList.add("insanity");
  }

  // Сохраняем оценку
  await saveGradeToServer(e.target)
}

// Сохранение оценки на сервер
async function saveGradeToServer(inputElement) {
  const studentId = Number(inputElement.dataset.studentId)
  const day = Number(inputElement.dataset.day)
  const value = inputElement.value
  
  if (!value) return // Пустое значение не сохраняем
  
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  const gradeCode = symbolToGrade(value)
  
  try {
    await teacherService.saveGrade(teacherId.value, {
      studentId,
      subjectId: selectedSubject.value.id,
      date: dateString,
      grade: gradeCode
    })
    
    // Обновляем локальное состояние
    if (!gradesData.value[studentId]) {
      gradesData.value[studentId] = {}
    }
    gradesData.value[studentId][dateString] = gradeCode
    
    console.log('✅ Оценка сохранена:', { studentId, date: dateString, grade: gradeCode })
  } catch (err) {
    console.error('❌ Ошибка сохранения оценки:', err)
    alert('Не удалось сохранить оценку')
  }
}

// Навигация стрелками
function onKeyDown(e) {
  const key = e.key;
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return;

  e.preventDefault();

  const input = e.target;
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);

  let nextRow = row;
  let nextCol = col;

  if (key === "ArrowUp") nextRow--;
  if (key === "ArrowDown") nextRow++;
  if (key === "ArrowLeft") nextCol--;
  if (key === "ArrowRight") nextCol++;

  const nextInput = document.querySelector(
    `.evaluation[data-row="${nextRow}"][data-col="${nextCol}"]`
  );

  if (nextInput) {
    nextInput.focus();
  }
}

// ========== ЗАГРУЗКА ДАННЫХ ==========

// Загрузить предметы при монтировании
async function loadSubjects() {
  console.log('🔍 teacherId:', teacherId.value) // Добавьте эту строку
  try {
    isLoading.value = true
    error.value = null
    subjects.value = await teacherService.getSubjects(teacherId.value)
    console.log('✅ Загружены предметы:', subjects.value) // И эту
  } catch (err) {
    console.error('Ошибка загрузки предметов:', err)
    error.value = 'Не удалось загрузить предметы'
  } finally {
    isLoading.value = false
  }
}

// Загрузить группы при выборе предмета
async function loadGroups() {
  if (!selectedSubject.value) {
    groups.value = []
    return
  }
  
  try {
    isLoading.value = true
    error.value = null
    groups.value = await teacherService.getGroups(teacherId.value, selectedSubject.value.id)
    // Сбрасываем выбранную группу
    selectedGroup.value = null
    students.value = []
    gradesData.value = {}
  } catch (err) {
    console.error('Ошибка загрузки групп:', err)
    error.value = 'Не удалось загрузить группы'
  } finally {
    isLoading.value = false
  }
}

// Загрузить студентов и оценки при выборе группы
async function loadStudentsAndGrades() {
  if (!selectedGroup.value || !selectedSubject.value) {
    students.value = []
    gradesData.value = {}
    return
  }
  
  try {
    isLoading.value = true
    error.value = null
    
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    
    // Загружаем студентов и оценки параллельно
    const [studentsResult, gradesResult] = await Promise.all([
      teacherService.getStudents(teacherId.value, selectedGroup.value.id, selectedSubject.value.id),
      teacherService.getGrades(teacherId.value, selectedGroup.value.id, selectedSubject.value.id, month, year)
    ])
    
    students.value = studentsResult
    gradesData.value = gradesResult
  } catch (err) {
    console.error('Ошибка загрузки студентов/оценок:', err)
    error.value = 'Не удалось загрузить данные'
  } finally {
    isLoading.value = false
  }
}

// Перезагрузить оценки при смене месяца
async function reloadGrades() {
  if (!selectedGroup.value || !selectedSubject.value) return
  
  try {
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    
    gradesData.value = await teacherService.getGrades(
      teacherId.value,
      selectedGroup.value.id,
      selectedSubject.value.id,
      month,
      year
    )
  } catch (err) {
    console.error('Ошибка загрузки оценок:', err)
  }
}

// Обработчики изменения селектов
function onSubjectChange() {
  loadGroups()
}

function onGroupChange() {
  loadStudentsAndGrades()
}

// Загрузить предметы при монтировании компонента
onMounted(async () => {
  await getTeacherId() // Сначала получаем teacher_id
  if (teacherId.value) {
    loadSubjects() // Потом загружаем предметы
  }
})
</script>

<style scoped src="@/assets/styles/roles/teacher/jounal.css"></style>

<style scoped>
/* Стили для подсказки */
.journal-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px;
}

.placeholder-content {
  text-align: center;
  max-width: 500px;
}

.placeholder-content h3 {
  margin-bottom: 16px;
  color: var(--text-primary, #333);
}

.placeholder-content p {
  color: var(--text-secondary, #666);
  margin-bottom: 20px;
}

.loader {
  color: var(--primary-color, #007bff);
  font-weight: 500;
}

.error-message {
  color: #dc3545;
  font-weight: 500;
  margin-top: 12px;
}

/* Стили для disabled селекта */
.select__control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>