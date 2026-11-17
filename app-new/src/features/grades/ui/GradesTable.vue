<template>
  <div class="journal-wrapper">
    <div v-if="isLoading" class="loader-container">
      <UiLoader />
    </div>

    <div v-else class="table-scroll">
      <table class="journal-table">
        <thead>
          <tr>
            <th class="col-student sticky-col">Ученик</th>
            <th 
              v-for="col in dateColumns" 
              :key="col.date"
              class="col-date"
            >
              <div class="date-header">
                <span class="day-num">{{ col.day }}</span>
                <span class="day-name">{{ col.dayName }}</span>
              </div>
            </th>
            <th class="col-avg">Ср. балл</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id">
            <td class="col-student sticky-col">
              {{ student.lastName }} {{ student.name }}
            </td>
            <td 
              v-for="col in dateColumns" 
              :key="col.date"
              class="cell-wrapper"
            >
              <GradeCell
                :value="gradesMap?.[student.id]?.[col.date]"
                :student-id="student.id"
                :date="col.date"
                :is-resetting="isResetting"
                @save="saveGrade"
                @reset-test="resetTestGrade"
              />
            </td>
            <td class="col-avg">
              <span :class="{'avg-good': (averagesMap?.[student.id] ?? 0) >= 4, 'avg-bad': (averagesMap?.[student.id] ?? 0) > 0 && (averagesMap?.[student.id] ?? 0) < 3}">
                {{ averagesMap?.[student.id] != null ? averagesMap[student.id] : '—' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useGradesTable } from '../model/useGradesTable';
import GradeCell from './GradeCell.vue';
import UiLoader from '@/shared/ui/UiLoader.vue';

const props = defineProps({
  groupId: { type: Number, required: true },
  subjectId: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  teacherId: { type: Number, required: true },
});


const { 
  students, 
  gradesMap, 
  averagesMap,
  dateColumns, 
  isLoading, 
  saveGrade,
  resetTestGrade,
  isResetting,
} = useGradesTable(props);
</script>

<style scoped>
.journal-wrapper {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.table-scroll {
  overflow-x: hidden;
  width: 100%;
}

.journal-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  border: 1px solid #e5e7eb;
  padding: 0;
  height: 40px;
  overflow: hidden;
}

/* Шапка */
thead th {
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Колонка студентов — фиксированная ширина */
.col-student {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  padding: 0 12px;
  text-align: left;
  font-weight: 500;
  color: #374151;
  background: #f9fafb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Колонки дат — равномерно распределяются */
.col-date {
  /* table-layout: fixed автоматически распределит оставшееся место поровну */
}

.date-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.day-num { font-weight: 700; font-size: 13px; }
.day-name { font-size: 9px; color: #9ca3af; text-transform: uppercase; }

/* Sticky Column */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 20;
  border-right: 2px solid #e5e7eb;
}
thead .sticky-col { z-index: 30; }

/* Ячейки оценок — растягиваются на всю ширину колонки */
.cell-wrapper {
  background: white;
  padding: 0;
}

.cell-wrapper :deep(.grade-cell) {
  width: 100%;
  height: 100%;
}

.cell-wrapper :deep(.evaluation) {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  text-align: center;
  border: none;
  outline: none;
  border-radius: 0;
  padding: 0;
  font-size: 13px;
  transition: 0.1s;
}

.cell-wrapper :deep(.evaluation:hover) {
  background-color: #f3f4f6;
}

.cell-wrapper :deep(.evaluation.has-test:hover) {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
}

.cell-wrapper :deep(.evaluation:focus) {
  background-color: #eff6ff;
  box-shadow: inset 0 0 0 2px var(--accent-default, #3b82f6);
}

.cell-wrapper :deep(.insanity) {
  color: var(--error-default, #ef4444);
}

/* Колонка среднего балла */
.col-avg {
  width: 70px;
  min-width: 70px;
  max-width: 70px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: #374151;
  background: #f0f4ff;
  border-left: 2px solid #c7d2fe;
}

thead .col-avg {
  background: #e0e7ff;
  font-weight: 700;
  font-size: 11px;
  color: #4338ca;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.avg-good {
  color: #059669;
}

.avg-bad {
  color: var(--error-default, #ef4444);
}
</style>
