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

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const users = await seedUsers(passwordHash);
  const instructor = users.find(user => user.role === "INSTRUCTOR")!;
  const categories = await seedCategories();
  await seedCourses(instructor.id, categories);

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
