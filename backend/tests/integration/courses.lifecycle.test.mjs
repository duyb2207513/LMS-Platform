import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const api = "http://localhost:3000/api/v1";
const stamp = Date.now().toString();
const emails = ["admin", "owner", "other", "student"].map(
  (name) => `course-${name}-${stamp}@example.com`
);
const courseIds = [];
const uploadedFiles = [];
let categoryId;

const auth = (user) => `Bearer ${jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: "15m" }
)}`;

const sendJson = (url, method, authorization, body) => fetch(url, {
  method,
  headers: { ...(authorization ? { authorization } : {}), "content-type": "application/json" },
  body: JSON.stringify(body)
});

async function upload(courseId, authorization, type = "image/png", size = 4) {
  const form = new FormData();
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const content = type === "image/png"
    ? [pngHeader, new Uint8Array(Math.max(0, size - pngHeader.length))]
    : [new Uint8Array(size)];
  form.append("thumbnail", new Blob(content, { type }), "thumbnail.png");
  const response = await fetch(`${api}/courses/${courseId}/thumbnail`, {
    method: "POST", headers: { authorization }, body: form
  });
  if (response.ok) {
    const body = await response.json();
    uploadedFiles.push(body.data.thumbnailUrl.split("/").pop());
    return { response, body };
  }
  return { response };
}

try {
  const [admin, owner, other, student] = await Promise.all([
    prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash: "x", role: "ADMIN" } }),
    prisma.user.create({ data: { fullName: "Owner", email: emails[1], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Other", email: emails[2], passwordHash: "x", role: "INSTRUCTOR" } }),
    prisma.user.create({ data: { fullName: "Student", email: emails[3], passwordHash: "x", role: "STUDENT" } })
  ]);
  const [adminAuth, ownerAuth, otherAuth, studentAuth] = [admin, owner, other, student].map(auth);
  const category = await prisma.category.create({
    data: { name: `Course Category ${stamp}`, slug: `course-category-${stamp}` }
  });
  categoryId = category.id;
  const payload = {
    title: `Express Course ${stamp}`,
    description: "Build Express REST APIs",
    categoryId,
    level: "BEGINNER",
    price: 299000,
    isFree: false,
    language: "Vietnamese"
  };

  assert.equal((await sendJson(`${api}/courses`, "POST", studentAuth, payload)).status, 403);
  assert.equal((await sendJson(`${api}/courses`, "POST", ownerAuth, {
    ...payload, categoryId: "00000000-0000-4000-8000-000000000000"
  })).status, 400);
  assert.equal((await sendJson(`${api}/courses`, "POST", ownerAuth, {
    ...payload, instructorId: other.id
  })).status, 400);

  const firstResponse = await sendJson(`${api}/courses`, "POST", ownerAuth, payload);
  const first = (await firstResponse.json()).data;
  assert.equal(firstResponse.status, 201);
  assert.equal(first.instructorId, owner.id);
  assert.equal(first.status, "DRAFT");
  courseIds.push(first.id);

  const secondResponse = await sendJson(`${api}/courses`, "POST", ownerAuth, {
    ...payload, isFree: true, price: 999999
  });
  const second = (await secondResponse.json()).data;
  assert.equal(second.slug, `${first.slug}-2`);
  assert.equal(second.price, 0);
  courseIds.push(second.id);

  const adminCourseResponse = await sendJson(`${api}/courses`, "POST", adminAuth, {
    ...payload, title: `Admin Course ${stamp}`
  });
  const adminCourse = (await adminCourseResponse.json()).data;
  assert.equal(adminCourseResponse.status, 201);
  courseIds.push(adminCourse.id);

  assert.equal((await fetch(`${api}/courses?limit=51`)).status, 400);
  assert.equal((await fetch(`${api}/courses?minPrice=500&maxPrice=100`)).status, 400);
  const draftPublicList = await (await fetch(`${api}/courses`)).json();
  assert.equal(draftPublicList.data.some((course) => courseIds.includes(course.id)), false);

  assert.equal((await fetch(`${api}/instructor/courses`, {
    headers: { authorization: studentAuth }
  })).status, 403);
  const ownerList = await (await fetch(`${api}/instructor/courses?status=DRAFT&search=Express`, {
    headers: { authorization: ownerAuth }
  })).json();
  assert.equal(ownerList.data.length, 2);
  assert.equal(ownerList.data.every((course) => course.instructor.id === owner.id), true);
  const managedDraftResponse = await fetch(`${api}/instructor/courses/${first.id}`, {
    headers: { authorization: ownerAuth }
  });
  assert.equal(managedDraftResponse.status, 200);
  assert.equal((await managedDraftResponse.json()).data.id, first.id);
  assert.equal((await fetch(`${api}/instructor/courses/${first.id}`, {
    headers: { authorization: otherAuth }
  })).status, 403);
  assert.equal((await fetch(`${api}/instructor/courses/${first.id}`, {
    headers: { authorization: adminAuth }
  })).status, 200);
  const adminList = await (await fetch(`${api}/instructor/courses`, {
    headers: { authorization: adminAuth }
  })).json();
  assert.equal(adminList.data.filter((course) => courseIds.includes(course.id)).length, 3);

  assert.equal((await sendJson(`${api}/courses/${first.id}`, "PATCH", studentAuth, { price: 1 })).status, 403);
  assert.equal((await sendJson(`${api}/courses/${first.id}`, "PATCH", otherAuth, { price: 1 })).status, 403);
  assert.equal((await sendJson(`${api}/courses/${first.id}`, "PATCH", ownerAuth, { status: "PUBLISHED" })).status, 400);
  const updateResponse = await sendJson(`${api}/courses/${first.id}`, "PATCH", ownerAuth, {
    title: `Express Advanced ${stamp}`, level: "INTERMEDIATE", price: 399000
  });
  const updated = (await updateResponse.json()).data;
  assert.equal(updateResponse.status, 200);
  assert.equal(updated.slug, `express-advanced-${stamp}`);
  assert.equal((await sendJson(`${api}/courses/${first.id}`, "PATCH", adminAuth, {
    description: "Admin updated description"
  })).status, 200);

  assert.equal((await fetch(`${api}/courses/${first.id}/publish`, {
    method: "POST", headers: { authorization: ownerAuth }
  })).status, 400);
  assert.equal((await upload(first.id, ownerAuth, "text/plain")).response.status, 400);
  assert.equal((await upload(first.id, otherAuth)).response.status, 403);
  assert.equal((await upload(first.id, ownerAuth, "image/png", 5 * 1024 * 1024 + 1)).response.status, 400);
  const uploaded = await upload(first.id, ownerAuth, "image/png", 8);
  assert.equal(uploaded.response.status, 200);
  assert.equal((await fetch(uploaded.body.data.thumbnailUrl)).status, 200);

  const publishResponse = await fetch(`${api}/courses/${first.id}/publish`, {
    method: "POST", headers: { authorization: ownerAuth }
  });
  assert.equal(publishResponse.status, 200);
  assert.equal((await publishResponse.json()).data.status, "PUBLISHED");
  assert.equal((await fetch(`${api}/courses/${first.id}/publish`, {
    method: "POST", headers: { authorization: ownerAuth }
  })).status, 409);

  const publicResponse = await fetch(
    `${api}/courses?search=Advanced&categoryId=${categoryId}&level=INTERMEDIATE&minPrice=300000&maxPrice=500000&limit=1`
  );
  const publicBody = await publicResponse.json();
  assert.equal(publicResponse.status, 200);
  assert.equal(publicBody.data[0].id, first.id);
  assert.equal(publicBody.meta.totalItems, 1);
  const detailResponse = await fetch(`${api}/courses/${updated.slug}`);
  const detail = await detailResponse.json();
  assert.equal(detailResponse.status, 200);
  assert.equal(detail.data.instructor.id, owner.id);
  assert.equal(detail.data.category.id, categoryId);
  assert.equal((await fetch(`${api}/courses/${second.slug}`)).status, 404);

  assert.equal((await fetch(`${api}/courses/${first.id}/unpublish`, {
    method: "POST", headers: { authorization: otherAuth }
  })).status, 403);
  assert.equal((await fetch(`${api}/courses/${first.id}/unpublish`, {
    method: "POST", headers: { authorization: ownerAuth }
  })).status, 200);
  assert.equal((await fetch(`${api}/courses/${updated.slug}`)).status, 404);

  assert.equal((await fetch(`${api}/courses/${second.id}`, {
    method: "DELETE", headers: { authorization: ownerAuth }
  })).status, 204);
  assert.equal((await fetch(`${api}/courses/${adminCourse.id}`, {
    method: "DELETE", headers: { authorization: adminAuth }
  })).status, 204);

  assert.equal((await fetch(`${api}/courses/${first.id}/publish`, {
    method: "POST", headers: { authorization: ownerAuth }
  })).status, 200);
  assert.equal((await fetch(`${api}/courses/${first.id}`, {
    method: "DELETE", headers: { authorization: ownerAuth }
  })).status, 204);
  assert.equal((await prisma.course.findUniqueOrThrow({ where: { id: first.id } })).status, "ARCHIVED");
  assert.equal((await fetch(`${api}/courses/${first.id}`, {
    method: "DELETE", headers: { authorization: ownerAuth }
  })).status, 409);

  console.log("Courses lifecycle integration tests passed");
} finally {
  await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
  if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
  await Promise.all(uploadedFiles.map((filename) =>
    unlink(path.resolve("uploads", "course-thumbnails", path.basename(filename))).catch(() => undefined)
  ));
}
