import { AppError } from "../../common/errors/AppError.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";
import { prisma } from "../../config/database.js";
import type { CreateSectionInput, UpdateSectionInput } from "./sections.types.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const checkId = (id: string, resource: string) => { if (!UUID.test(id)) throw new AppError(404, `${resource} not found`); };
const canManage = (instructorId: string, actor: AuthTokenPayload) => actor.role === "ADMIN" || instructorId === actor.userId;

async function getManagedCourse(courseId: string, actor: AuthTokenPayload) {
  checkId(courseId, "Course");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, instructorId: true } });
  if (!course) throw new AppError(404, "Course not found");
  if (!canManage(course.instructorId, actor)) throw new AppError(403, "You do not have permission to manage this course");
  return course;
}

async function getManagedSection(sectionId: string, actor: AuthTokenPayload) {
  checkId(sectionId, "Section");
  const section = await prisma.section.findUnique({ where: { id: sectionId }, include: { course: { select: { instructorId: true } } } });
  if (!section) throw new AppError(404, "Section not found");
  if (!canManage(section.course.instructorId, actor)) throw new AppError(403, "You do not have permission to manage this section");
  return section;
}

export async function listManagedSections(courseId: string, actor: AuthTokenPayload) {
  await getManagedCourse(courseId, actor);
  return prisma.section.findMany({
    where: { courseId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { lessons: { orderBy: [{ position: "asc" }, { createdAt: "asc" }], include: { quiz: { include: { questions: { orderBy: [{ position: "asc" }, { createdAt: "asc" }], include: { options: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } } } } } } }
  });
}

export async function createSection(courseId: string, actor: AuthTokenPayload, input: CreateSectionInput) {
  await getManagedCourse(courseId, actor);
  const position = input.position ?? ((await prisma.section.aggregate({ where: { courseId }, _max: { position: true } }))._max.position ?? 0) + 1;
  return prisma.section.create({ data: { courseId, title: input.title, position } });
}

export async function updateSection(sectionId: string, actor: AuthTokenPayload, input: UpdateSectionInput) {
  await getManagedSection(sectionId, actor);
  return prisma.section.update({ where: { id: sectionId }, data: input });
}

export async function deleteSection(sectionId: string, actor: AuthTokenPayload) {
  const section = await getManagedSection(sectionId, actor);
  const files = await prisma.lesson.findMany({ where: { sectionId }, select: { videoUrl: true, documentUrl: true } });
  await prisma.section.delete({ where: { id: section.id } });
  return files.flatMap(file => [file.videoUrl, file.documentUrl]).filter((url): url is string => Boolean(url));
}

export { getManagedSection };
