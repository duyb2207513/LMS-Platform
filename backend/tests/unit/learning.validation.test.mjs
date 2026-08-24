import assert from "node:assert/strict";
import { validateCreateSectionInput, validateUpdateSectionInput } from "../../dist/modules/sections/sections.validation.js";
import { validateCreateLessonInput, validateUpdateLessonInput } from "../../dist/modules/lessons/lessons.validation.js";
import { validateUpdateLessonProgressInput } from "../../dist/modules/progress/progress.validation.js";
import { validateCreateLessonContent, validateReorderLessonContents, validateUpdateLessonContent } from "../../dist/modules/lesson-contents/lesson-contents.validation.js";

assert.deepEqual(validateCreateSectionInput({ title: "  Introduction  " }).data, { title: "Introduction" });
assert.ok(validateCreateSectionInput({ title: "" }).errors.title);
assert.ok(validateUpdateSectionInput({ position: 0 }).errors.position);
assert.ok(validateUpdateSectionInput({}).errors.body);

assert.equal(validateCreateLessonInput({ title: "Lesson", lessonType: "VIDEO" }).data.lessonType, "VIDEO");
assert.ok(validateCreateLessonInput({ title: "Lesson", lessonType: "AUDIO" }).errors.lessonType);
assert.ok(validateUpdateLessonInput({ videoUrl: "client-value" }).errors.videoUrl);
assert.ok(validateUpdateLessonInput({ isPublished: "yes" }).errors.isPublished);

assert.deepEqual(validateUpdateLessonProgressInput({ lastWatchedSecond: 10, isCompleted: true }).data, { lastWatchedSecond: 10, isCompleted: true });
assert.ok(validateUpdateLessonProgressInput({ lastWatchedSecond: -1 }).errors.lastWatchedSecond);
assert.ok(validateUpdateLessonProgressInput({}).errors.body);

assert.deepEqual(validateCreateLessonContent({ contentType: "TEXT", textContent: "  Nội dung  " }).data, { contentType: "TEXT", textContent: "Nội dung" });
assert.ok(validateCreateLessonContent({ contentType: "TEXT" }).errors.textContent);
assert.ok(validateCreateLessonContent({ contentType: "AUDIO" }).errors.contentType);
assert.equal(validateUpdateLessonContent({ textContent: "  Updated  " }).data.textContent, "Updated");
assert.ok(validateReorderLessonContents({ contentIds: ["same", "same"] }).errors.contentIds);

console.log("Learning validation tests passed");
