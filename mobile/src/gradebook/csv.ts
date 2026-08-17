import type { CourseGrade } from '../types';

const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
export function courseGradesCsv(courseTitle: string, grades: CourseGrade[]) {
  const rows = [
    ['Khóa học', courseTitle],
    [],
    ['Học viên', 'Email', 'Bài tập (%)', 'Đã chấm', 'Quiz (%)', 'Đã làm quiz', 'Điểm tổng kết', 'Kết quả'],
    ...grades.map(item => [item.student?.fullName || item.studentId, item.student?.email || '', item.assignment.percent, `${item.assignment.graded}/${item.assignment.total}`, item.quiz.percent, `${item.quiz.attempted}/${item.quiz.total}`, item.finalScore, item.passed ? 'Đạt' : 'Chưa đạt']),
  ];
  return `\uFEFF${rows.map(row => row.map(escapeCell).join(',')).join('\r\n')}`;
}
