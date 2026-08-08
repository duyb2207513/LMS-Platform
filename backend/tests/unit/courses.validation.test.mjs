import assert from "node:assert/strict";
import {
  validateCreateCourseInput,
  validateInstructorCourseQuery,
  validatePublicCourseQuery,
  validateUpdateCourseInput
} from "../../dist/modules/courses/courses.validation.js";

assert.deepEqual(validatePublicCourseQuery({}).data, {
  page: 1, limit: 12, sortBy: "createdAt", sortOrder: "desc"
});
assert.ok(validatePublicCourseQuery({ limit: "51" }).errors?.limit);
assert.ok(validatePublicCourseQuery({ minPrice: "100", maxPrice: "50" }).errors?.maxPrice);
assert.ok(validatePublicCourseQuery({ level: "UNKNOWN" }).errors?.level);
assert.deepEqual(validateInstructorCourseQuery({ status: "DRAFT" }).data, {
  page: 1, limit: 10, status: "DRAFT"
});

const categoryId = "550e8400-e29b-41d4-a716-446655440000";
const freeCourse = validateCreateCourseInput({
  title: "ExpressJS cơ bản",
  description: "REST API",
  categoryId,
  level: "BEGINNER",
  price: 299000,
  isFree: true
});
assert.equal(freeCourse.data?.price, 0);
assert.ok(validateCreateCourseInput({}).errors?.title);
assert.ok(validateCreateCourseInput({
  title: "Course", description: "Description", categoryId, level: "BEGINNER",
  instructorId: categoryId
}).errors?.instructorId);
assert.ok(validateUpdateCourseInput({ status: "PUBLISHED" }).errors?.status);
assert.ok(validateUpdateCourseInput({ price: -1 }).errors?.price);

console.log("Courses validation tests passed");
