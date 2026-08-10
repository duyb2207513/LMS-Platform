import assert from "node:assert/strict";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { validateAdminCourseUpdate, validateAdminUserUpdate } from "../../dist/modules/admin/admin.validation.js";
import { COURSE_THUMBNAIL_MAX_SIZE, LESSON_FILE_MAX_SIZE, isValidStoredImage, isValidStoredLessonFile } from "../../dist/config/upload.js";

assert.deepEqual(validateAdminUserUpdate({ role: "INSTRUCTOR", status: "ACTIVE" }).data, { role: "INSTRUCTOR", status: "ACTIVE" });
assert.ok(validateAdminUserUpdate({ password: "hacked" }).errors.password);
assert.ok(validateAdminUserUpdate({ role: "OWNER" }).errors.role);
assert.equal(validateAdminCourseUpdate({ status: "ARCHIVED" }).data.status, "ARCHIVED");
assert.ok(validateAdminCourseUpdate({ status: "DELETED" }).errors.status);
assert.equal(COURSE_THUMBNAIL_MAX_SIZE, 5 * 1024 * 1024);
assert.equal(LESSON_FILE_MAX_SIZE, 100 * 1024 * 1024);

const validPng = join(tmpdir(), `${randomUUID()}.png`), fakePng = join(tmpdir(), `${randomUUID()}.png`), pdf = join(tmpdir(), `${randomUUID()}.pdf`);
try {
  await writeFile(validPng, Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0]));
  await writeFile(fakePng, Buffer.from("not an image"));
  await writeFile(pdf, Buffer.from("%PDF-1.7 demo"));
  assert.equal(await isValidStoredImage(validPng, "image/png"), true);
  assert.equal(await isValidStoredImage(fakePng, "image/png"), false);
  assert.equal(await isValidStoredLessonFile(pdf, "application/pdf"), true);
  assert.equal(await isValidStoredLessonFile(fakePng, "application/pdf"), false);
} finally { await Promise.all([validPng, fakePng, pdf].map(file => unlink(file).catch(() => undefined))); }
console.log("Sprint 5 admin validation and upload security tests passed");
