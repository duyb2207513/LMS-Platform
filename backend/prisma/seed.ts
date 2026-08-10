import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl })
});

const TEST_PASSWORD = "Password123";

async function seedUsers(passwordHash: string) {
  const users = [
    {
      email: "student@lms.test",
      fullName: "Nguyễn Minh Student",
      role: "STUDENT" as const,
      status: "ACTIVE" as const
    },
    {
      email: "instructor@lms.test",
      fullName: "Trần Văn Instructor",
      role: "INSTRUCTOR" as const,
      status: "ACTIVE" as const
    },
    {
      email: "admin@lms.test",
      fullName: "Lê Minh Admin",
      role: "ADMIN" as const,
      status: "ACTIVE" as const
    },
    {
      email: "blocked@lms.test",
      fullName: "Tài khoản bị khóa",
      role: "STUDENT" as const,
      status: "BLOCKED" as const
    }
  ];

  const result = [];
  for (const user of users) {
    result.push(await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        passwordHash,
        role: user.role,
        status: user.status
      },
      create: { ...user, passwordHash }
    }));
  }
  return result;
}

async function seedCategories() {
  const categories = [
    {
      name: "Lập trình Web",
      slug: "lap-trinh-web",
      description: "Các khóa học Frontend, Backend và phát triển website"
    },
    {
      name: "Lập trình Mobile",
      slug: "lap-trinh-mobile",
      description: "Xây dựng ứng dụng di động với React Native và Flutter"
    },
    {
      name: "Cơ sở dữ liệu",
      slug: "co-so-du-lieu",
      description: "SQL, PostgreSQL và thiết kế cơ sở dữ liệu"
    },
    {
      name: "DevOps",
      slug: "devops",
      description: "Docker, triển khai và vận hành phần mềm"
    }
  ];

  const result = new Map<string, { id: string }>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description
      },
      create: category,
      select: { id: true }
    });
    result.set(category.slug, saved);
  }
  return result;
}

async function seedCourses(instructorId: string, categories: Map<string, { id: string }>) {
  const webCategory = categories.get("lap-trinh-web")!;
  const mobileCategory = categories.get("lap-trinh-mobile")!;
  const databaseCategory = categories.get("co-so-du-lieu")!;
  const devopsCategory = categories.get("devops")!;

  const courses = [
    {
      slug: "expressjs-rest-api-tu-co-ban",
      title: "ExpressJS REST API từ cơ bản",
      description: "Học cách xây dựng REST API hoàn chỉnh với ExpressJS, TypeScript, xác thực JWT và xử lý lỗi.",
      categoryId: webCategory.id,
      level: "BEGINNER" as const,
      price: 299000,
      isFree: false,
      language: "Vietnamese",
      requirements: "Kiến thức JavaScript cơ bản",
      learningOutcomes: "Xây dựng REST API; xác thực JWT; tổ chức backend theo module",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-08-01T08:00:00.000Z")
    },
    {
      slug: "react-native-cho-nguoi-moi",
      title: "React Native cho người mới",
      description: "Xây dựng ứng dụng Android và iOS bằng React Native, Expo và TypeScript.",
      categoryId: mobileCategory.id,
      level: "BEGINNER" as const,
      price: 0,
      isFree: true,
      language: "Vietnamese",
      requirements: "Biết JavaScript hoặc TypeScript là một lợi thế",
      learningOutcomes: "Thiết kế giao diện mobile; navigation; gọi REST API",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-08-02T08:00:00.000Z")
    },
    {
      slug: "postgresql-thiet-ke-database",
      title: "PostgreSQL và thiết kế Database",
      description: "Nắm vững SQL, quan hệ giữa các bảng, index và thiết kế cơ sở dữ liệu thực tế.",
      categoryId: databaseCategory.id,
      level: "INTERMEDIATE" as const,
      price: 399000,
      isFree: false,
      language: "Vietnamese",
      requirements: "Kiến thức lập trình căn bản",
      learningOutcomes: "Thiết kế ERD; viết SQL; tối ưu truy vấn bằng index",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-08-03T08:00:00.000Z")
    },
    {
      slug: "docker-trien-khai-ung-dung",
      title: "Docker và triển khai ứng dụng",
      description: "Khóa học đang được biên soạn về Docker, Docker Compose và triển khai hệ thống LMS.",
      categoryId: devopsCategory.id,
      level: "INTERMEDIATE" as const,
      price: 499000,
      isFree: false,
      language: "Vietnamese",
      requirements: "Biết sử dụng terminal cơ bản",
      learningOutcomes: "Viết Dockerfile; sử dụng Docker Compose; quản lý container",
      status: "DRAFT" as const,
      publishedAt: null
    }
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: { ...course, instructorId },
      create: { ...course, instructorId }
    });
  }
}

async function seedLearningContent(studentId: string) {
  const course = await prisma.course.findUniqueOrThrow({ where: { slug: "react-native-cho-nguoi-moi" } });
  const sectionOne = await prisma.section.upsert({
    where: { id: "10000000-0000-4000-8000-000000000001" },
    update: { courseId: course.id, title: "Bắt đầu với React Native", position: 1 },
    create: { id: "10000000-0000-4000-8000-000000000001", courseId: course.id, title: "Bắt đầu với React Native", position: 1 }
  });
  const sectionTwo = await prisma.section.upsert({
    where: { id: "10000000-0000-4000-8000-000000000002" },
    update: { courseId: course.id, title: "Kết nối REST API", position: 2 },
    create: { id: "10000000-0000-4000-8000-000000000002", courseId: course.id, title: "Kết nối REST API", position: 2 }
  });

  const lessons = [
    {
      id: "20000000-0000-4000-8000-000000000001", sectionId: sectionOne.id,
      title: "React Native và Expo là gì?", lessonType: "TEXT" as const,
      content: "Tổng quan về React Native, Expo và cấu trúc một ứng dụng mobile.", position: 1,
      isPreview: true, isRequired: true, isPublished: true
    },
    {
      id: "20000000-0000-4000-8000-000000000002", sectionId: sectionOne.id,
      title: "Tạo giao diện đầu tiên", lessonType: "VIDEO" as const,
      videoUrl: "https://example.com/seed/react-native-ui.mp4", durationSeconds: 600, position: 2,
      isPreview: false, isRequired: true, isPublished: true
    },
    {
      id: "20000000-0000-4000-8000-000000000003", sectionId: sectionTwo.id,
      title: "Gọi API bằng Axios", lessonType: "TEXT" as const,
      content: "Cấu hình Axios, Bearer token và xử lý lỗi từ REST API.", position: 1,
      isPreview: false, isRequired: true, isPublished: true
    }
  ];
  for (const lesson of lessons) {
    await prisma.lesson.upsert({ where: { id: lesson.id }, update: lesson, create: lesson });
  }

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId: course.id } },
    update: { status: "ACTIVE", progressPercent: 33.33, completedAt: null },
    create: { studentId, courseId: course.id, progressPercent: 33.33 }
  });
  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId: lessons[0].id } },
    update: { isCompleted: true, completedAt: new Date(), lastWatchedSecond: 0 },
    create: { studentId, lessonId: lessons[0].id, isCompleted: true, completedAt: new Date() }
  });
}

async function seedSprint3(studentId: string, instructorId: string) {
  const course = await prisma.course.findUniqueOrThrow({ where: { slug: "react-native-cho-nguoi-moi" } });
  const lessonId = "20000000-0000-4000-8000-000000000003";
  const quiz = await prisma.quiz.upsert({
    where: { lessonId },
    update: { title: "Kiểm tra kiến thức Axios", description: "Ôn tập cách kết nối REST API", passingScore: 70, maxAttempts: 3, isPublished: true },
    create: { id: "30000000-0000-4000-8000-000000000001", lessonId, title: "Kiểm tra kiến thức Axios", description: "Ôn tập cách kết nối REST API", passingScore: 70, maxAttempts: 3, isPublished: true }
  });
  const question = await prisma.question.upsert({
    where: { id: "31000000-0000-4000-8000-000000000001" },
    update: { quizId: quiz.id, text: "Header nào dùng để gửi access token?", explanation: "REST API sử dụng Bearer token trong Authorization header.", points: 1, position: 1 },
    create: { id: "31000000-0000-4000-8000-000000000001", quizId: quiz.id, text: "Header nào dùng để gửi access token?", explanation: "REST API sử dụng Bearer token trong Authorization header.", points: 1, position: 1 }
  });
  const options = [
    { id: "32000000-0000-4000-8000-000000000001", text: "Authorization", isCorrect: true, position: 1 },
    { id: "32000000-0000-4000-8000-000000000002", text: "Content-Length", isCorrect: false, position: 2 },
    { id: "32000000-0000-4000-8000-000000000003", text: "Accept-Language", isCorrect: false, position: 3 }
  ];
  for (const option of options) await prisma.quizOption.upsert({ where: { id: option.id }, update: { ...option, questionId: question.id }, create: { ...option, questionId: question.id } });
  await prisma.review.upsert({
    where: { courseId_userId: { courseId: course.id, userId: studentId } },
    update: { rating: 5, content: "Khóa học dễ hiểu và có ví dụ thực tế." },
    create: { id: "40000000-0000-4000-8000-000000000001", courseId: course.id, userId: studentId, rating: 5, content: "Khóa học dễ hiểu và có ví dụ thực tế." }
  });
  const root = await prisma.comment.upsert({
    where: { id: "50000000-0000-4000-8000-000000000001" },
    update: { lessonId, userId: studentId, content: "Access token nên lưu ở đâu trên mobile?", deletedAt: null },
    create: { id: "50000000-0000-4000-8000-000000000001", lessonId, userId: studentId, content: "Access token nên lưu ở đâu trên mobile?" }
  });
  await prisma.comment.upsert({
    where: { id: "50000000-0000-4000-8000-000000000002" },
    update: { lessonId, userId: instructorId, parentId: root.id, content: "Bạn nên dùng Expo SecureStore thay vì AsyncStorage.", deletedAt: null },
    create: { id: "50000000-0000-4000-8000-000000000002", lessonId, userId: instructorId, parentId: root.id, content: "Bạn nên dùng Expo SecureStore thay vì AsyncStorage." }
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const users = await seedUsers(passwordHash);
  const instructor = users.find(user => user.role === "INSTRUCTOR")!;
  const student = users.find(user => user.role === "STUDENT" && user.status === "ACTIVE")!;
  const categories = await seedCategories();
  await seedCourses(instructor.id, categories);
  await seedLearningContent(student.id);
  await seedSprint3(student.id, instructor.id);

  console.log("Seed completed successfully");
  console.log("Test password for every seeded account: Password123");
  console.log("Accounts: student@lms.test, instructor@lms.test, admin@lms.test, blocked@lms.test");
}

main()
  .catch(error => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
