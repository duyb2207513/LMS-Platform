import test from 'node:test';
import assert from 'node:assert/strict';
import { courseGradesCsv } from '../src/gradebook/csv';
import type { CourseGrade } from '../src/types';

test('exports a UTF-8 CSV with escaped student names', () => {
  const grade = { studentId: 'u1', courseId: 'c1', finalScore: 81.5, passed: true, student: { id: 'u1', fullName: 'Nguyễn, "Duy"', email: 'duy@example.com', avatarUrl: null }, rule: { courseId: 'c1', assignmentWeight: 60, quizWeight: 40, passingScore: 70 }, assignment: { percent: 80, earned: 80, maximum: 100, total: 1, graded: 1 }, quiz: { percent: 83.75, total: 2, attempted: 2 } } satisfies CourseGrade;
  const csv = courseGradesCsv('ExpressJS', [grade]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Nguyễn, ""Duy"""/);
  assert.match(csv, /"81.5","Đạt"/);
});
