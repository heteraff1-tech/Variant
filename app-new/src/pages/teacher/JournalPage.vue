<template>
  <section class="teacher-layout">
    <!-- Боковая навигация -->


    <div class="content">
      <header>
        <!-- Календарь -->
        <div class="calendar">
          <img src="@/assets/svg/vuesax_linear_arrow-left.svg" @click="prevMonth" style="cursor: pointer;" />
          <span class="body-b1">{{ monthDisplay }}</span>
          <img src="@/assets/svg/vuesax_linear_arrow-right.svg" @click="nextMonth" style="cursor: pointer;" />
        </div>

        <!-- Фильтры -->
        <div class="fillters">
          <UiInput v-model="search" placeholder="Найдите по ФИО" type="text" />
          
          <div class="select select--default">
            <select class="select__control" v-model="selectedSubjectId">
              <option :value="null" disabled>Выберите предмет</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.title }}
              </option>
            </select>
          </div>

          <div class="select select--default">
            <select 
              class="select__control" 
              v-model="selectedGroupId" 
              :disabled="!selectedSubjectId"
            >
              <option :value="null" disabled>Выберите группу</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.title }}
              </option>
            </select>
          </div>
        </div>
      </header>

      <!-- Контент журнала -->
      <main>
        <div v-if="!selectedGroupId" class="journal-placeholder">
          <div class="placeholder-content">
            <h3 class="heading-h3">Выберите группу и предмет</h3>
            <p class="body-b2">Чтобы увидеть студентов и начать работу с журналом</p>
          </div>
        </div>

        <div v-else id="jounal">
          <!-- Саму таблицу GradesTable мы обновим следующим шагом -->
          <GradesTable
              :group-id="Number(selectedGroupId)"
              :subject-id="Number(selectedSubjectId)"
              :teacher-id="teacherId"
              :month="currentMonth"
              :year="currentYear"
              :search-query="search"
          />
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { UiInput } from '@/shared/ui';
import GradesTable from '@/features/grades/ui/GradesTable.vue';

const authStore = useAuthStore();
const search = ref("");

// Состояние фильтров и дат
const selectedSubjectId = ref(null);
const selectedGroupId = ref(null);
const currentDate = ref(new Date());

const currentMonth = computed(() => currentDate.value.getMonth() + 1);
const currentYear = computed(() => currentDate.value.getFullYear());

const monthDisplay = computed(() => {
  return currentDate.value.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
});

function prevMonth() {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() - 1);
  currentDate.value = d;
}

function nextMonth() {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + 1);
  currentDate.value = d;
}

// Загрузка предметов
const teacherId = ref(null);
const subjects = ref([]);

onMounted(async () => {
  try {
    // Сначала получаем teacherId
    const stateRes = await httpClient.get(API_ROUTES.teacher.state);
    teacherId.value = stateRes.data.data.teacherId;
    // Затем загружаем предметы по teacherId
    if (teacherId.value) {
      const res = await httpClient.get(API_ROUTES.teacher.subjects(teacherId.value));
      subjects.value = res.data.data.subjects;
    }
  } catch (err) {
    console.error('Ошибка загрузки предметов:', err);
  }
});


// Загрузка групп при выборе предмета
const groups = ref([]);
watch(selectedSubjectId, async (newId) => {
  selectedGroupId.value = null;
  if (newId && teacherId.value) {
    const res = await httpClient.get(API_ROUTES.teacher.groups(teacherId.value, newId));
    groups.value = res.data.data.groups;
  } else {
    groups.value = [];
  }
});

</script>

<style scoped src="@/assets/styles/roles/teacher/jounal.css"></style>