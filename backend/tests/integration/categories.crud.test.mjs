import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const categoriesUrl = "http://localhost:3000/api/v1/categories";
const stamp = Date.now().toString();
const createdCategoryIds = [];
const testEmails = [
  `category-admin-${stamp}@example.com`,
  `category-student-${stamp}@example.com`,
  `category-instructor-${stamp}@example.com`
];
const courseSlug = `category-course-${stamp}`;

function createAuthorization(user) {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  return `Bearer ${token}`;
}

async function sendJson(url, method, authorization, body) {
  return fetch(url, {
    method,
    headers: {
      ...(authorization ? { authorization } : {}),
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

try {
  const [admin, student, instructor] = await Promise.all([
    prisma.user.create({
      data: {
        fullName: "Category Admin",
        email: testEmails[0],
        passwordHash: "not-used",
        role: "ADMIN"
      }
    }),
    prisma.user.create({
      data: {
        fullName: "Category Student",
        email: testEmails[1],
        passwordHash: "not-used",
        role: "STUDENT"
      }
    }),
    prisma.user.create({
      data: {
        fullName: "Category Instructor",
        email: testEmails[2],
        passwordHash: "not-used",
        role: "INSTRUCTOR"
      }
    })
  ]);

  const adminAuthorization = createAuthorization(admin);
  const studentAuthorization = createAuthorization(student);
  const instructorAuthorization = createAuthorization(instructor);

  assert.equal((await fetch(categoriesUrl)).status, 200);
  assert.equal(
    (await sendJson(categoriesUrl, "POST", undefined, { name: `No Auth ${stamp}` })).status,
    401
  );
  assert.equal(
    (
      await sendJson(categoriesUrl, "POST", studentAuthorization, {
        name: `Student Category ${stamp}`
      })
    ).status,
    403
  );
  assert.equal(
    (
      await sendJson(categoriesUrl, "POST", instructorAuthorization, {
        name: `Instructor Category ${stamp}`
      })
    ).status,
    403
  );

  const zuluCreateResponse = await sendJson(categoriesUrl, "POST", adminAuthorization, {
    name: `Zulu Web ${stamp}`,
    description: "Zulu description"
  });
  const zuluCreateBody = await zuluCreateResponse.json();
  assert.equal(zuluCreateResponse.status, 201);
  createdCategoryIds.push(zuluCreateBody.data.id);

  const alphaCreateResponse = await sendJson(categoriesUrl, "POST", adminAuthorization, {
    name: `Alpha Web ${stamp}`,
    description: "Alpha description"
  });
  const alphaCreateBody = await alphaCreateResponse.json();
  assert.equal(alphaCreateResponse.status, 201);
  createdCategoryIds.push(alphaCreateBody.data.id);

  const duplicateNameResponse = await sendJson(categoriesUrl, "POST", adminAuthorization, {
    name: `Alpha Web ${stamp}`
  });
  assert.equal(duplicateNameResponse.status, 409);

  const listResponse = await fetch(categoriesUrl);
  const listBody = await listResponse.json();
  const testCategories = listBody.data.filter((category) =>
    createdCategoryIds.includes(category.id)
  );
  assert.deepEqual(
    testCategories.map((category) => category.name),
    [`Alpha Web ${stamp}`, `Zulu Web ${stamp}`]
  );

  const updateResponse = await sendJson(
    `${categoriesUrl}/${zuluCreateBody.data.id}`,
    "PATCH",
    adminAuthorization,
    { name: `Phát triển Web ${stamp}`, description: "Frontend và Backend" }
  );
  const updateBody = await updateResponse.json();
  assert.equal(updateResponse.status, 200);
  assert.equal(updateBody.data.slug, `phat-trien-web-${stamp}`);

  const duplicateSlugResponse = await sendJson(categoriesUrl, "POST", adminAuthorization, {
    name: `Phat trien Web ${stamp}`
  });
  assert.equal(duplicateSlugResponse.status, 409);

  assert.equal(
    (
      await sendJson(
        `${categoriesUrl}/${zuluCreateBody.data.id}`,
        "PATCH",
        studentAuthorization,
        { name: `Forbidden ${stamp}` }
      )
    ).status,
    403
  );
  assert.equal(
    (
      await sendJson(
        `${categoriesUrl}/00000000-0000-4000-8000-000000000000`,
        "PATCH",
        adminAuthorization,
        { name: `Missing ${stamp}` }
      )
    ).status,
    404
  );

  const course = await prisma.course.create({
    data: {
      instructorId: instructor.id,
      categoryId: zuluCreateBody.data.id,
      title: `Category Course ${stamp}`,
      slug: courseSlug,
      description: "Course preventing category deletion",
      level: "BEGINNER"
    }
  });

  const inUseDeleteResponse = await fetch(`${categoriesUrl}/${zuluCreateBody.data.id}`, {
    method: "DELETE",
    headers: { authorization: adminAuthorization }
  });
  assert.equal(inUseDeleteResponse.status, 409);

  await prisma.course.delete({ where: { id: course.id } });

  const deleteZuluResponse = await fetch(`${categoriesUrl}/${zuluCreateBody.data.id}`, {
    method: "DELETE",
    headers: { authorization: adminAuthorization }
  });
  assert.equal(deleteZuluResponse.status, 204);

  const deleteAlphaResponse = await fetch(`${categoriesUrl}/${alphaCreateBody.data.id}`, {
    method: "DELETE",
    headers: { authorization: adminAuthorization }
  });
  assert.equal(deleteAlphaResponse.status, 204);

  console.log("Categories CRUD integration tests passed");
} finally {
  await prisma.course.deleteMany({ where: { slug: courseSlug } });
  await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
  await prisma.$disconnect();
}
