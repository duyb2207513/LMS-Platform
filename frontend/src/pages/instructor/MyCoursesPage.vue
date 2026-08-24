<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import InstructorLayout from "@/layouts/InstructorLayout.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { useCourseStore } from "@/stores/courses";
import { CourseStatus, CourseLevel } from "@/types";

const courseStore = useCourseStore();
const search = ref("");
const status = ref<"ALL" | CourseStatus>("ALL");
const level = ref<"ALL" | CourseLevel>("ALL");
const page = ref(1);
const PAGE_SIZE = 8;

const filteredCourses = computed(() =>
  courseStore.myCourses.filter((course) => {
    const keyword = search.value.trim().toLocaleLowerCase("vi");
    return (
      (!keyword ||
        `${course.title} ${course.description}`
          .toLocaleLowerCase("vi")
          .includes(keyword)) &&
      (status.value === "ALL" || course.status === status.value) &&
      (level.value === "ALL" || course.level === level.value)
    );
  }),
);

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCourses.value.length / PAGE_SIZE)));
const paginatedCourses = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredCourses.value.slice(start, start + PAGE_SIZE);
});

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p;
    window.scrollTo({ top: 300, behavior: "smooth" });
  }
}

watch([search, status, level], () => {
  page.value = 1;
});

function getStatusBadge(status: CourseStatus) {
  switch (status) {
    case CourseStatus.PUBLISHED:
      return {
        text: "Đã xuất bản",
        class:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
      };
    case CourseStatus.DRAFT:
      return {
        text: "Bản nháp",
        class:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      };
    case CourseStatus.ARCHIVED:
      return {
        text: "Đã lưu trữ",
        class:
          "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400",
      };
    default:
      return {
        text: status,
        class:
          "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400",
      };
  }
}

function getLevelText(level: CourseLevel) {
  switch (level) {
    case CourseLevel.BEGINNER:
      return "Cơ bản";
    case CourseLevel.INTERMEDIATE:
      return "Trung cấp";
    case CourseLevel.ADVANCED:
      return "Nâng cao";
    default:
      return level;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

onMounted(async () => {
  await courseStore.fetchMyCourses();
});
</script>

<template>
  <InstructorLayout>
    <div class="instructor-courses-page w-full">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white">
            Khóa học của tôi
          </h1>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Quản lý tất cả khóa học bạn đã tạo
          </p>
        </div>
        <router-link to="/instructor/courses/create">
          <BaseButton size="sm" class="!h-8 !rounded-none !px-3 !text-xs">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tạo khóa học
          </BaseButton>
        </router-link>
      </div>

      <section
        class="mb-4 grid min-h-16 overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[minmax(0,1fr)_14rem_14rem]"
      >
        <input
          v-model="search"
          class="h-16 w-full border-0 border-r border-slate-200 bg-slate-50 px-5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
          placeholder="Tìm theo tên hoặc mô tả khóa học..."
        />
        <select
          v-model="status"
          class="h-16 w-full border-0 border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option :value="CourseStatus.PUBLISHED">Đã xuất bản</option>
          <option :value="CourseStatus.DRAFT">Bản nháp</option>
          <option :value="CourseStatus.ARCHIVED">Đã lưu trữ</option>
        </select>
        <select
          v-model="level"
          class="h-16 w-full border-0 bg-slate-50 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 dark:bg-slate-800"
        >
          <option value="ALL">Tất cả cấp độ</option>
          <option :value="CourseLevel.BEGINNER">Cơ bản</option>
          <option :value="CourseLevel.INTERMEDIATE">Trung cấp</option>
          <option :value="CourseLevel.ADVANCED">Nâng cao</option>
        </select>
      </section>

      <!-- Loading -->
      <div v-if="courseStore.loading" class="py-12">
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredCourses.length === 0"
        class="border border-slate-100 bg-white py-20 text-center transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900"
      >
        <svg
          class="w-20 h-20 mx-auto text-slate-300 dark:text-slate-700 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300">
          {{
            courseStore.myCourses.length
              ? "Không tìm thấy khóa học phù hợp"
              : "Chưa có khóa học nào"
          }}
        </h3>
        <p class="text-slate-500 dark:text-slate-400 mt-2 mb-6">
          {{
            courseStore.myCourses.length
              ? "Thử thay đổi từ khóa hoặc bộ lọc."
              : "Bắt đầu tạo khóa học đầu tiên của bạn"
          }}
        </p>
        <router-link
          v-if="!courseStore.myCourses.length"
          to="/instructor/courses/create"
        >
          <BaseButton class="!rounded-none">Tạo khóa học đầu tiên</BaseButton>
        </router-link>
      </div>

      <!-- Course List -->
      <div v-else class="space-y-5">
        <div
          v-for="course in paginatedCourses"
          :key="course.id"
          class="course-row overflow-hidden border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="course-row__layout grid h-full sm:grid-cols-[22rem_minmax(0,1fr)]">
            <!-- Thumbnail -->
            <div
              class="course-row__media relative aspect-video bg-purple-100 dark:bg-purple-950 sm:aspect-auto"
            >
              <img
                v-if="course.thumbnailUrl"
                :src="course.thumbnailUrl"
                :alt="course.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="h-16 w-16 text-purple-300 dark:text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
            </div>

            <!-- Info -->
            <div class="flex min-w-0 flex-col">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-3 dark:border-slate-800">
                <div class="flex items-center gap-2">
                  <span :class="['px-2.5 py-1 text-[11px] font-bold', getStatusBadge(course.status).class]">{{ getStatusBadge(course.status).text }}</span>
                  <span class="border-l border-slate-200 pl-2 text-[11px] font-semibold text-slate-500 dark:border-slate-700">{{ getLevelText(course.level) }}</span>
                </div>
                <time class="text-[10px] text-slate-400">Tạo ngày {{ formatDate(course.createdAt) }}</time>
              </div>

              <div class="min-w-0 flex-1 px-6 py-5">
                <h3 class="max-w-4xl text-xl font-black leading-tight text-slate-950 dark:text-white">{{ course.title }}</h3>
                <p class="mt-3 line-clamp-3 max-w-4xl text-sm leading-6 text-slate-500 dark:text-slate-400">{{ course.description || 'Khóa học chưa có mô tả.' }}</p>
              </div>

              <div class="grid grid-cols-2 border-t border-slate-200 dark:border-slate-800 sm:flex sm:justify-end">
                <router-link :to="`/instructor/courses/${course.id}/builder`" class="course-action course-action--primary">Nội dung</router-link>
                <router-link :to="`/instructor/courses/${course.id}/assignments`" class="course-action">Bài tập</router-link>
                <router-link :to="`/instructor/courses/${course.id}/announcements`" class="course-action">Thông báo</router-link>
                <router-link :to="`/instructor/courses/${course.id}/edit`" class="course-action">Chỉnh sửa</router-link>
              </div>
            </div>
          </div>
        </div>

        <nav
          v-if="paginatedCourses.length > 0"
          class="mt-10 flex items-center justify-center gap-2 pt-4"
          aria-label="Phân trang"
        >
          <button
            :disabled="page <= 1"
            class="flex h-10 items-center justify-center border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            @click="goToPage(page - 1)"
          >
            ← Trước
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            :class="[
              'grid h-10 w-10 place-items-center border text-sm font-bold transition',
              p === page
                ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
            ]"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>
          <button
            :disabled="page >= totalPages"
            class="flex h-10 items-center justify-center border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            @click="goToPage(page + 1)"
          >
            Sau →
          </button>
        </nav>
      </div>
    </div>
  </InstructorLayout>
</template>

<style scoped>
.course-row {
  min-height: 17rem;
}

.course-row > div {
  min-height: 17rem;
}

.course-row__media::after {
  position: absolute;
  inset: 0 0 0 auto;
  width: 1px;
  background: var(--border);
  content: '';
}

.course-action {
  display: inline-flex;
  min-width: 6.5rem;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  border-left: 1px solid var(--border);
  padding: .65rem 1rem;
  color: var(--text);
  font-size: .75rem;
  font-weight: 700;
  transition: background-color 150ms ease, color 150ms ease;
}

.course-action:hover {
  background: var(--surface-muted);
  color: #7c3aed;
}

.course-action--primary {
  background: #7c3aed;
  color: white;
}

.course-action--primary:hover {
  background: #6d28d9;
  color: white;
}

.instructor-courses-page :deep(button),
.instructor-courses-page input,
.instructor-courses-page select {
  border-radius: 0 !important;
}

@media (max-width: 639px) {
  .course-row {
    min-height: 0;
  }

  .course-row > div {
    min-height: 0;
  }

  .course-row__media::after { display:none }
  .course-action:nth-child(odd) { border-left:0 }
  .course-action { border-top:1px solid var(--border) }
}
</style>
