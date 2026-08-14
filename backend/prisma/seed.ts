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
    },
    {
      name: "Khoa học dữ liệu & AI",
      slug: "khoa-hoc-du-lieu-ai",
      description: "Các khóa học về Trí tuệ nhân tạo, Machine Learning và Khoa học dữ liệu"
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
  const aiCategory = categories.get("khoa-hoc-du-lieu-ai")!;

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
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-08-04T08:00:00.000Z")
    },
    {
      slug: "decision-tree-sieu-de-hieu",
      title: "Mô hình Cây Quyết Định (Decision Tree) siêu dễ hiểu",
      description: "Học cách máy tính ra quyết định thông qua ví dụ thực tế về việc 'Hôm nay có nên đi chơi hay không?' mà không cần bất kỳ công thức toán phức tạp nào.",
      categoryId: aiCategory.id,
      level: "BEGINNER" as const,
      price: 0,
      isFree: true,
      language: "Vietnamese",
      requirements: "Không cần kiến thức lập trình trước đó",
      learningOutcomes: "Hiểu mô hình Cây quyết định; biết vẽ và giải thích cây; hiểu khái niệm cơ bản về AI/Machine Learning",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-08-05T08:00:00.000Z")
    },
    {
      slug: "nhap-mon-mang-no-ron-nhan-tao",
      title: "Nhập môn Mạng Nơ-ron Nhân tạo (Neural Network)",
      description: "Khóa học nhập môn giúp bạn hiểu nguyên lý hoạt động của Mạng Nơ-ron Nhân tạo (ANN) - nền tảng của Deep Learning và Trí tuệ Nhân tạo hiện đại.",
      categoryId: aiCategory.id,
      level: "BEGINNER" as const,
      price: 0,
      isFree: true,
      language: "Vietnamese",
      requirements: "Kiến thức toán học cơ bản",
      learningOutcomes: "Hiểu cấu trúc của một Neuron nhân tạo; nắm vững cơ chế lan truyền xuôi và lan truyền ngược; hiểu cách mạng học từ dữ liệu",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-08-06T08:00:00.000Z")
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

async function seedSprint4(studentId: string) {
  const course = await prisma.course.findUniqueOrThrow({ where: { slug: "expressjs-rest-api-tu-co-ban" } });
  const order = await prisma.order.upsert({
    where: { id: "60000000-0000-4000-8000-000000000001" },
    update: { userId: studentId, status: "PAID", subtotal: 299000, total: 299000, paidAt: new Date("2026-08-05T08:00:00.000Z") },
    create: { id: "60000000-0000-4000-8000-000000000001", orderNumber: "ORD-DEMO-PAID-001", userId: studentId, status: "PAID", subtotal: 299000, total: 299000, paidAt: new Date("2026-08-05T08:00:00.000Z") }
  });
  await prisma.orderItem.upsert({
    where: { orderId_courseId: { orderId: order.id, courseId: course.id } },
    update: { courseTitleSnapshot: course.title, priceSnapshot: 299000 },
    create: { orderId: order.id, courseId: course.id, courseTitleSnapshot: course.title, priceSnapshot: 299000 }
  });
  await prisma.payment.upsert({
    where: { idempotencyKey: "seed-demo-payment-001" },
    update: { orderId: order.id, status: "SUCCEEDED", amount: 299000, providerTransactionId: "MOCK-SEED-001", paidAt: new Date("2026-08-05T08:00:00.000Z") },
    create: { orderId: order.id, provider: "MOCK", status: "SUCCEEDED", amount: 299000, idempotencyKey: "seed-demo-payment-001", providerTransactionId: "MOCK-SEED-001", paidAt: new Date("2026-08-05T08:00:00.000Z") }
  });
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId: course.id } },
    update: { status: "COMPLETED", progressPercent: 100, completedAt: new Date("2026-08-06T08:00:00.000Z") },
    create: { studentId, courseId: course.id, status: "COMPLETED", progressPercent: 100, completedAt: new Date("2026-08-06T08:00:00.000Z") }
  });
  await prisma.certificate.upsert({
    where: { studentId_courseId: { studentId, courseId: course.id } },
    update: { enrollmentId: enrollment.id, studentNameSnapshot: "Nguyễn Minh Student", courseTitleSnapshot: course.title, instructorNameSnapshot: "Trần Văn Instructor", revokedAt: null },
    create: { certificateNumber: "LMS-2026-DEMO0001", verificationCode: "demo-certificate-verification-code", enrollmentId: enrollment.id, studentId, courseId: course.id, studentNameSnapshot: "Nguyễn Minh Student", courseTitleSnapshot: course.title, instructorNameSnapshot: "Trần Văn Instructor", issuedAt: new Date("2026-08-06T08:00:00.000Z") }
  });
}

async function seedAdditionalLearningContent(studentId: string) {
  const definitions = [
    {
      slug: "expressjs-rest-api-tu-co-ban",
      section: { id: "11000000-0000-4000-8000-000000000001", title: "Xây dựng REST API với ExpressJS" },
      lessons: [
        { id: "21000000-0000-4000-8000-000000000001", title: "REST API và cấu trúc dự án", lessonType: "TEXT" as const, content: "Tìm hiểu REST, HTTP method, status code và cách tổ chức backend ExpressJS theo module.", position: 1 },
        { id: "21000000-0000-4000-8000-000000000002", title: "Middleware và xử lý lỗi", lessonType: "VIDEO" as const, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", durationSeconds: 600, position: 2 },
        { id: "21000000-0000-4000-8000-000000000003", title: "Tài liệu HTTP status code", lessonType: "DOCUMENT" as const, documentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", position: 3 }
      ],
      completedLessons: 3,
      status: "COMPLETED" as const
    },
    {
      slug: "postgresql-thiet-ke-database",
      section: { id: "12000000-0000-4000-8000-000000000001", title: "Nền tảng PostgreSQL" },
      lessons: [
        { id: "22000000-0000-4000-8000-000000000001", title: "Thiết kế bảng và quan hệ", lessonType: "TEXT" as const, content: "Thiết kế bảng, khóa chính, khóa ngoại và các quan hệ one-to-one, one-to-many, many-to-many.", position: 1 },
        { id: "22000000-0000-4000-8000-000000000002", title: "Index và tối ưu truy vấn", lessonType: "VIDEO" as const, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", durationSeconds: 720, position: 2 },
        { id: "22000000-0000-4000-8000-000000000003", title: "Tài liệu thiết kế database", lessonType: "DOCUMENT" as const, documentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", position: 3 }
      ],
      completedLessons: 1,
      status: "ACTIVE" as const
    },
    {
      slug: "decision-tree-sieu-de-hieu",
      section: { id: "14000000-0000-4000-8000-000000000001", title: "Cơ bản về Cây quyết định" },
      lessons: [
        {
          id: "24000000-0000-4000-8000-000000000001",
          title: "Giới thiệu giải thuật Cây Quyết Định (Decision Tree)",
          lessonType: "TEXT" as const,
          content: "Cây Quyết Định (Decision Tree) là một thuật toán học máy có giám sát (Supervised Learning) phổ biến nhất hiện nay. Nó có thể dùng cho cả bài toán phân lớp (Classification) lẫn bài toán hồi quy (Regression).\n\nMô hình hoạt động bằng cách phân chia dữ liệu thành các nhóm nhỏ hơn dựa trên các đặc trưng (features) đầu vào.\n\nCÁC GIẢI THUẬT XÂY DỰNG CÂY PHỔ BIẾN:\n1. ID3 (Iterative Dichotomiser 3): Sử dụng Entropy và Information Gain (độ tăng thông tin) để chọn các đặc trưng phân chia.\n2. C4.5: Bản nâng cấp của ID3, hỗ trợ dữ liệu liên tục và xử lý các giá trị bị thiếu.\n3. CART (Classification and Regression Trees): Sử dụng chỉ số Gini Impurity (độ vẩn đục Gini) để phân chia dữ liệu.\n\nNGUYÊN LÝ CỐT LÕI:\nThuật toán bắt đầu ở nút gốc (Root Node) chứa toàn bộ dữ liệu, sau đó tìm câu hỏi phân chia tốt nhất dựa trên một trong các tiêu chí đo lường (như Entropy hay Gini). Quá trình này lặp lại cho các nút con (Internal Nodes) cho đến khi đạt được các nút lá (Leaf Nodes) là kết quả phân lớp cuối cùng, không thể phân chia thêm.",
          position: 1
        },
        {
          id: "24000000-0000-4000-8000-000000000002",
          title: "Bài toán cụ thể: Dự đoán khách hàng mua laptop",
          lessonType: "TEXT" as const,
          content: "Để hiểu rõ hơn về giải thuật, hãy cùng xem xét một bài toán thực tế: Dự đoán xem một người có mua máy tính xách tay (Laptop) hay không dựa trên 3 thông tin:\n- Độ tuổi (Trẻ / Trung niên / Già)\n- Thu nhập (Cao / Trung bình / Thấp)\n- Là học sinh/sinh viên? (Có / Không)\n\nDưới đây là bảng dữ liệu lịch sử gồm 8 khách hàng:\n\n┌────┬───────────┬───────────┬───────────┬─────────────┐\n│ ID │  Độ tuổi  │ Thu nhập  │ Học sinh? │ Mua Laptop? │\n├────┼───────────┼───────────┼───────────┼─────────────┤\n│ 1  │ Trẻ       │ Cao       │ Không     │ KHÔNG       │\n│ 2  │ Trẻ       │ Cao       │ Có        │ CÓ          │\n│ 3  │ Trung niên│ Cao       │ Không     │ CÓ          │\n│ 4  │ Già       │ Trung bình│ Không     │ CÓ          │\n│ 5  │ Già       │ Thấp      │ Có        │ KHÔNG       │\n│ 6  │ Trẻ       │ Trung bình│ Không     │ KHÔNG       │\n│ 7  │ Trung niên│ Thấp      │ Có        │ CÓ          │\n│ 8  │ Già       │ Trung bình│ Có        │ CÓ          │\n└────┴───────────┴───────────┴───────────┴─────────────┘\n\nMục tiêu của chúng ta là xây dựng một Cây Quyết Định từ bảng dữ liệu này để tự động dự đoán cho một khách hàng mới.",
          position: 2
        },
        {
          id: "24000000-0000-4000-8000-000000000003",
          title: "Cách tính Entropy và xây dựng cây quyết định",
          lessonType: "TEXT" as const,
          content: "Bây giờ chúng ta sẽ cùng tính toán để xem máy tính chọn đặc trưng nào làm Nút gốc (Root Node) bằng giải thuật ID3:\n\nBƯỚC 1: TÍNH ENTROPY CỦA TOÀN BỘ DỮ LIỆU BAN ĐẦU\n- Tổng số mẫu: 8 (5 mẫu CÓ mua, 3 mẫu KHÔNG mua).\n- Công thức Entropy: H(S) = - (p_yes * log2(p_yes) + p_no * log2(p_no))\n- H(S) = - (5/8 * log2(5/8) + 3/8 * log2(3/8)) ≈ 0.954 (Độ hỗn loạn cao vì tỷ lệ mua/không mua khá cân bằng).\n\nBƯỚC 2: TÍNH ENTROPY SAU KHI PHÂN CHIA THEO THUỘC TÍNH\nHãy thử phân chia dữ liệu theo đặc trưng Độ tuổi:\n1. Nhóm Trẻ (3 mẫu: ID 1, 2, 6): có 1 người mua (CÓ) và 2 người không mua (KHÔNG).\n   - Entropy(Trẻ) = - (1/3 * log2(1/3) + 2/3 * log2(2/3)) ≈ 0.918\n2. Nhóm Trung niên (2 mẫu: ID 3, 7): cả 2 đều mua (CÓ).\n   - Entropy(Trung niên) = 0 (Độ tinh khiết tuyệt đối, phân lớp hoàn toàn).\n3. Nhóm Già (3 mẫu: ID 4, 5, 8): có 2 người mua (CÓ) và 1 người không mua (KHÔNG).\n   - Entropy(Già) = - (2/3 * log2(2/3) + 1/3 * log2(1/3)) ≈ 0.918\n\nEntropy trung bình khi chia theo Độ tuổi:\n- H(S, Độ tuổi) = (3/8 * 0.918) + (2/8 * 0) + (3/8 * 0.918) ≈ 0.688\n\nBƯỚC 3: TÍNH ĐỘ TĂNG THÔNG TIN (INFORMATION GAIN - IG)\n- IG(Độ tuổi) = H(S) - H(S, Độ tuổi) = 0.954 - 0.688 = 0.266\n\nThực hiện tương tự cho Thu nhập và Học sinh?, ta được:\n- IG(Học sinh?) ≈ 0.311 (Lớn nhất!)\n- IG(Thu nhập) ≈ 0.048\n\nKẾT LUẬN:\nVì Học sinh? có Information Gain lớn nhất (0.311), thuật toán ID3 sẽ chọn đặc trưng này làm Nút gốc để chia nhánh đầu tiên!",
          position: 3
        }
      ],
      completedLessons: 1,
      status: "ACTIVE" as const
    },
    {
      slug: "nhap-mon-mang-no-ron-nhan-tao",
      section: { id: "2f0f5ef2-33ef-4352-bc85-87be958085b7", title: "Chương 1: Giới thiệu về các giải thuật máy học" },
      lessons: [
        {
          id: "1fb4a708-78db-4e1d-bbc2-4c6f024246d6",
          title: "Mạng nơ-ron nhân tạo",
          lessonType: "DOCUMENT" as const,
          documentUrl: "http://localhost:3000/uploads/lesson-files/5996132d-d94e-4d3a-91d2-5b890269644e.pdf",
          position: 1
        }
      ],
      completedLessons: 0,
      status: "ACTIVE" as const
    }
  ];

  for (const definition of definitions) {
    const course = await prisma.course.findUniqueOrThrow({ where: { slug: definition.slug } });
    const section = await prisma.section.upsert({
      where: { id: definition.section.id },
      update: { courseId: course.id, title: definition.section.title, position: 1 },
      create: { ...definition.section, courseId: course.id, position: 1 }
    });

    for (const lesson of definition.lessons) {
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: { ...lesson, sectionId: section.id, isPreview: lesson.position === 1, isRequired: true, isPublished: true },
        create: { ...lesson, sectionId: section.id, isPreview: lesson.position === 1, isRequired: true, isPublished: true }
      });
      const isCompleted = lesson.position <= definition.completedLessons;
      await prisma.lessonProgress.upsert({
        where: { studentId_lessonId: { studentId, lessonId: lesson.id } },
        update: { isCompleted, completedAt: isCompleted ? new Date("2026-08-06T08:00:00.000Z") : null, lastWatchedSecond: isCompleted ? (lesson.durationSeconds ?? 0) : 0 },
        create: { studentId, lessonId: lesson.id, isCompleted, completedAt: isCompleted ? new Date("2026-08-06T08:00:00.000Z") : null, lastWatchedSecond: isCompleted ? (lesson.durationSeconds ?? 0) : 0 }
      });
    }

    const progressPercent = Math.round((definition.completedLessons / definition.lessons.length) * 10000) / 100;
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId: course.id } },
      update: { status: definition.status, progressPercent, completedAt: definition.status === "COMPLETED" ? new Date("2026-08-06T08:00:00.000Z") : null },
      create: { studentId, courseId: course.id, status: definition.status, progressPercent, completedAt: definition.status === "COMPLETED" ? new Date("2026-08-06T08:00:00.000Z") : null }
    });
  }

  const dockerCourse = await prisma.course.findUniqueOrThrow({ where: { slug: "docker-trien-khai-ung-dung" } });
  const dockerSection = await prisma.section.upsert({
    where: { id: "13000000-0000-4000-8000-000000000001" },
    update: { courseId: dockerCourse.id, title: "Docker từ cơ bản đến triển khai", position: 1 },
    create: { id: "13000000-0000-4000-8000-000000000001", courseId: dockerCourse.id, title: "Docker từ cơ bản đến triển khai", position: 1 }
  });
  const dockerLessons = [
    { id: "23000000-0000-4000-8000-000000000001", title: "Container và image", lessonType: "TEXT" as const, content: "Tìm hiểu image, container, registry và vòng đời của một container Docker.", position: 1 },
    { id: "23000000-0000-4000-8000-000000000002", title: "Triển khai với Docker Compose", lessonType: "VIDEO" as const, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", durationSeconds: 800, position: 2 }
  ];
  for (const lesson of dockerLessons) {
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: { ...lesson, sectionId: dockerSection.id, isPreview: lesson.position === 1, isRequired: true, isPublished: true },
      create: { ...lesson, sectionId: dockerSection.id, isPreview: lesson.position === 1, isRequired: true, isPublished: true }
    });
  }
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
  await seedSprint4(student.id);
  await seedAdditionalLearningContent(student.id);

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
