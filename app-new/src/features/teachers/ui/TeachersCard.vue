<template>
  <div class="teacher-card">
    <div class="teacher-card__header">
      <div class="teacher-card__info">
        <h3 class="teacher-card__name">
          {{ teacher.lastName }} {{ teacher.name }}
        </h3>
        <p class="teacher-card__role">{{ teacher.role }}</p>
      </div>
    </div>

    <div class="teacher-card__subjects">
      <div 
        v-for="subj in teacher.subjects" 
        :key="subj.id" 
        class="subject-tag"
      >
        {{ subj.title }}
        <span class="subject-tag__groups">
          {{ subj.groups.join(', ') }}
        </span>
      </div>
      <div v-if="teacher.subjects.length === 0" class="no-subjects">
        Нет назначенных предметов
      </div>
    </div>

    <div class="teacher-card__actions">
      <UiButton size="sm" variant="secondary" @click="$emit('edit', teacher)">
        Редактировать
      </UiButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { UiButton } from '@/shared/ui';

const props = defineProps({
  teacher: {
    type: Object,
    required: true,
  },
});

defineEmits(['edit']);

const initials = computed(() => {
  return (props.teacher.lastName[0] + props.teacher.name[0]).toUpperCase();
});
</script>

<style scoped>
.teacher-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border: 1px solid #f3f4f6;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.teacher-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.05);
}

.teacher-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.teacher-card__avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.teacher-card__name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.teacher-card__role {
  font-size: 13px;
  color: #6b7280;
  margin: 2px 0 0 0;
}

.teacher-card__subjects {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subject-tag {
  background: #eff6ff;
  color: #2563eb;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.subject-tag__groups {
  color: #60a5fa;
  font-size: 11px;
  margin-left: 4px;
}

.no-subjects {
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.teacher-card__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
