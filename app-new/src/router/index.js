import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/admin/:id',
      component: () => import('@/pages/admin/AdminLayout.vue'), // Можно создать лейаут
      meta: { requiresAuth: true, role: 2 },
      children: [
        { path: 'teachers', component: () => import('@/pages/admin/TeachersPage.vue') },
        { path: 'groups', component: () => import('@/pages/admin/GroupsPage.vue') }
      ]
    },
    {
      path: '/teacher/:id',
      component: () => import('@/pages/teacher/TeacherLayout.vue'),
      meta: { requiresAuth: true, role: 3 },
      children: [
        { path: '', name: 'teacher-main', component: () => import('@/pages/teacher/TeacherMainPage.vue') },
        { path: 'journal', name: 'journal', component: () => import('@/pages/teacher/JournalPage.vue') },
        { path: 'create-test', name: 'create-test', component: () => import('@/pages/teacher/CreateTestPage.vue') },
      ]
    },
    {
      path: '/student/:id',
      component: () => import('@/pages/student/StudentLayout.vue'),
      meta: { requiresAuth: true, role: 1 },
      children: [
        { path: '', redirect: to => `${to.path}/tests` },
        { path: 'tests', name: 'student-tests', component: () => import('@/pages/student/StudentTestsPage.vue') },
        { path: 'tests/:testId', name: 'student-test', component: () => import('@/pages/student/StudentTestPage.vue') },
        { path: 'journal', name: 'student-journal', component: () => import('@/pages/student/StudentJournalPage.vue') },
      ]
    },
    {
      path: '/',
      redirect: () => {
        const auth = useAuthStore();
        if (!auth.isAuthenticated) return '/login';
        if (auth.isAdmin) return `/admin/${auth.user.id}/teachers`;
        if (auth.isTeacher) return `/teacher/${auth.user.id}/journal`;
        if (auth.isStudent) return `/student/${auth.user.id}/tests`;
        return '/login';
      }
    }
  ]
});

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  // При перезагрузке страницы ждём восстановления сессии из sessionStorage
  // Без этого гард срабатывал синхронно до завершения init() → редирект на /login
  if (!auth.isInitialized) {
    await auth.init();
  }

  // Если страница только для гостей, а юзер залогинен
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next('/');
  }

  // Если страница требует авторизации
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login');
  }

  // Проверка прав по роли
  if (to.meta.role && auth.user?.role_id !== to.meta.role) {
    return next('/');
  }

  next();
});

export default router;
