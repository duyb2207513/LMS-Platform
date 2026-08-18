import { prisma } from "../../config/database.js";
import { logger } from "../../config/logger.js";

export const aiToolDeclarations = [
  {
    name: "searchLearningContent",
    description: "Tìm kiếm nội dung bài giảng, lý thuyết, khái niệm chuyên môn hoặc code mẫu trong các bài học của LMS để giải đáp thắc mắc học tập.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        query: {
          type: "STRING" as const,
          description: "Từ khóa hoặc câu hỏi kiến thức cần tra cứu (ví dụ: 'middleware', 'docker container', 'quan hệ 1-n', 'neural network')",
        },
        courseId: {
          type: "STRING" as const,
          description: "ID của khóa học cụ thể (tùy chọn nếu người dùng đang hỏi trong 1 khóa học)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "searchCourses",
    description: "Tìm kiếm các khóa học có trên hệ thống LMS Platform theo tên, công nghệ, danh mục, cấp độ hoặc học phí.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        keyword: {
          type: "STRING" as const,
          description: "Từ khóa tìm kiếm tên khóa học hoặc chủ đề (ví dụ: 'python', 'react', 'devops', 'database')",
        },
        level: {
          type: "STRING" as const,
          enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
          description: "Cấp độ khóa học",
        },
        isFree: {
          type: "BOOLEAN" as const,
          description: "True nếu người dùng muốn tìm khóa học miễn phí",
        },
      },
    },
  },
  {
    name: "getCourseDetails",
    description: "Lấy thông tin chi tiết về giáo trình, danh sách các chương mục, bài giảng, giảng viên và học phí của một khóa học.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        courseIdentifier: {
          type: "STRING" as const,
          description: "ID hoặc slug hoặc tên gần đúng của khóa học",
        },
      },
      required: ["courseIdentifier"],
    },
  },
  {
    name: "getStudentLearningSummary",
    description: "Tra cứu tiến độ học tập, các khóa học đã đăng ký và bài tập sắp tới hạn của học viên hiện tại.",
    parameters: {
      type: "OBJECT" as const,
      properties: {},
    },
  },
  {
    name: "getLmsPolicies",
    description: "Tra cứu chính sách, quy chế học tập chính thức của LMS (quy định hoàn tiền trong 24h, điều kiện cấp chứng chỉ, cách nộp bài tập & quiz, thanh toán).",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        topic: {
          type: "STRING" as const,
          enum: ["refund", "certificate", "assignment", "payment", "general"],
          description: "Chủ đề quy chế cần tra cứu",
        },
      },
      required: ["topic"],
    },
  },
];

export async function executeAiTool(name: string, args: Record<string, any>, currentUserId?: string): Promise<any> {
  logger.info({ tool: name, args, userId: currentUserId || "guest" }, `[AI Tool] Executing tool: ${name}`);
  try {
    switch (name) {
      case "searchLearningContent": {
        const query = String(args.query || "").trim();
        const courseId = args.courseId ? String(args.courseId) : undefined;
        logger.info(`[AI Tool: searchLearningContent] Searching lessons with query="${query}", courseId=${courseId || "all"}`);

        const lessons = await prisma.lesson.findMany({
          where: {
            isPublished: true,
            ...(courseId ? { section: { courseId } } : {}),
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 4,
          select: {
            id: true,
            title: true,
            lessonType: true,
            content: true,
            section: {
              select: {
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        });

        logger.info(`[AI Tool: searchLearningContent] Found ${lessons.length} matched lessons in DB`);

        if (!lessons.length) {
          return {
            found: false,
            message: `Không tìm thấy bài học nào có nội dung trực tiếp về "${query}". Hãy dùng kiến thức chuyên môn của bạn để giải thích ngắn gọn, dễ hiểu cho học viên.`,
          };
        }

        return {
          found: true,
          results: lessons.map((l) => ({
            lessonId: l.id,
            lessonTitle: l.title,
            lessonType: l.lessonType,
            sectionTitle: l.section.title,
            courseId: l.section.course.id,
            courseTitle: l.section.course.title,
            contentSnippet: l.content ? l.content.slice(0, 400) + "..." : "Bài giảng video/tài liệu",
          })),
        };
      }

      case "searchCourses": {
        const keyword = args.keyword ? String(args.keyword).trim() : undefined;
        const level = args.level ? String(args.level) : undefined;
        const isFree = typeof args.isFree === "boolean" ? args.isFree : undefined;
        logger.info({ keyword, level, isFree }, `[AI Tool: searchCourses] Querying courses`);

        const courses = await prisma.course.findMany({
          where: {
            status: "PUBLISHED",
            ...(keyword
              ? {
                  OR: [
                    { title: { contains: keyword, mode: "insensitive" } },
                    { description: { contains: keyword, mode: "insensitive" } },
                    { category: { name: { contains: keyword, mode: "insensitive" } } },
                  ],
                }
              : {}),
            ...(level ? { level: level as any } : {}),
            ...(isFree !== undefined ? { isFree } : {}),
          },
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            isFree: true,
            level: true,
            description: true,
            category: { select: { name: true } },
            instructor: { select: { fullName: true } },
          },
        });

        logger.info(`[AI Tool: searchCourses] Found ${courses.length} courses`);

        return {
          total: courses.length,
          courses: courses.map((c) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            category: c.category?.name || "LMS",
            level: c.level,
            priceFormatted: c.isFree || Number(c.price) === 0 ? "Miễn phí" : `${Number(c.price).toLocaleString("vi-VN")} đ`,
            instructor: c.instructor?.fullName || "Giảng viên LMS",
            description: c.description ? c.description.slice(0, 150) + "..." : "",
          })),
        };
      }

      case "getCourseDetails": {
        const identifier = String(args.courseIdentifier || "").trim();
        logger.info(`[AI Tool: getCourseDetails] Fetching details for identifier="${identifier}"`);

        const course = await prisma.course.findFirst({
          where: {
            status: "PUBLISHED",
            OR: [
              { id: identifier.length === 36 ? identifier : undefined },
              { slug: identifier },
              { title: { contains: identifier, mode: "insensitive" } },
            ].filter(Boolean) as any,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            level: true,
            price: true,
            isFree: true,
            description: true,
            category: { select: { name: true } },
            instructor: { select: { fullName: true } },
            sections: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                lessons: {
                  where: { isPublished: true },
                  orderBy: { position: "asc" },
                  select: { id: true, title: true, lessonType: true, durationSeconds: true },
                },
              },
            },
          },
        });

        if (!course) {
          logger.warn(`[AI Tool: getCourseDetails] Course not found for "${identifier}"`);
          return { found: false, message: `Không tìm thấy khóa học phù hợp với từ khóa "${identifier}".` };
        }

        const sections = course.sections || [];
        const totalLessons = sections.reduce((sum: number, s) => sum + (s.lessons?.length || 0), 0);
        logger.info(`[AI Tool: getCourseDetails] Found course "${course.title}" with ${sections.length} sections, ${totalLessons} lessons`);

        return {
          found: true,
          course: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            category: course.category?.name,
            level: course.level,
            priceFormatted: course.isFree || Number(course.price) === 0 ? "Miễn phí" : `${Number(course.price).toLocaleString("vi-VN")} đ`,
            description: course.description,
            instructor: course.instructor?.fullName || "Giảng viên",
            totalSections: sections.length,
            totalLessons,
            curriculumOutline: sections.map((s) => ({
              sectionTitle: s.title,
              lessonCount: s.lessons?.length || 0,
              lessonTitles: (s.lessons || []).map((l) => l.title),
            })),
          },
        };
      }

      case "getStudentLearningSummary": {
        logger.info(`[AI Tool: getStudentLearningSummary] Looking up student progress for userId=${currentUserId || "none"}`);
        if (!currentUserId) {
          return {
            isLoggedIn: false,
            message: "Học viên chưa đăng nhập tài khoản. Hãy gợi ý người dùng đăng nhập để xem tiến độ cá nhân.",
          };
        }

        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: currentUserId, status: "ACTIVE" },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                assignments: {
                  where: { isPublished: true },
                  select: {
                    id: true,
                    title: true,
                    dueAt: true,
                    submissions: {
                      where: { studentId: currentUserId },
                      select: { id: true, attemptNumber: true, feedback: { select: { score: true } } },
                    },
                  },
                },
              },
            },
          },
        });

        return {
          isLoggedIn: true,
          enrolledCoursesCount: enrollments.length,
          courses: enrollments.map((e) => {
            const pendingAssignments = e.course.assignments.filter((a) => a.submissions.length === 0);
            return {
              courseId: e.course.id,
              courseTitle: e.course.title,
              progressPercent: Math.round(Number(e.progressPercent || 0)),
              pendingAssignmentsCount: pendingAssignments.length,
              pendingAssignments: pendingAssignments.map((a) => ({
                title: a.title,
                dueAt: a.dueAt.toISOString(),
              })),
            };
          }),
        };
      }

      case "getLmsPolicies": {
        const topic = String(args.topic || "general");
        const policies = {
          refund: `QUY CHẾ HOÀN TIỀN (24H REFUND POLICY):
1. Điều kiện: Yêu cầu hoàn tiền phải được gửi trong vòng 24 giờ (1 ngày) kể từ khi thanh toán thành công đơn hàng.
2. Tiến độ: Tiến độ học chưa vượt quá 20% tổng số bài giảng.
3. Cách thực hiện: Vào menu tài khoản -> "Lịch sử đơn hàng" -> Chọn đơn hàng cần hoàn -> Bấm "Yêu cầu hoàn tiền" và nhập lý do.
4. Xử lý: Admin sẽ xét duyệt trong vòng 24h - 48h và hoàn tiền về phương thức thanh toán ban đầu.`,

          certificate: `ĐIỀU KIỆN CẤP VÀ XÁC THỰC CHỨNG CHỈ:
1. Điều kiện cấp: Học viên phải hoàn thành 100% bài học và đạt điểm tổng kết từ điểm chuẩn (Passing Score, thường là 70%) trở lên.
2. Nhận chứng chỉ: Sau khi đạt điều kiện, vào trang "Khóa học của tôi" hoặc trang "Chứng chỉ" để nhận và tải chứng chỉ PDF chất lượng cao.
3. Xác thực trực tuyến: Mỗi chứng chỉ có 1 mã code duy nhất (Certificate Code). Bất kỳ ai cũng có thể vào trang /verify-certificate nhập mã để tra cứu tính hợp lệ.`,

          assignment: `QUY CHẾ BÀI TẬP VÀ ĐIỂM SỐ:
1. Bài tập trắc nghiệm (Quiz): Làm trực tiếp trong bài học, có chấm điểm tức thì.
2. Bài tập tự luận (Assignment): Nộp bài bằng văn bản hoặc đính kèm tối đa 5 file (PDF, DOCX, ZIP...). Giảng viên sẽ chấm điểm và để lại nhận xét.
3. Chỉnh sửa bài nộp: Học viên có thể chỉnh sửa bài nộp của mình khi bài đang ở trạng thái chờ chấm điểm.
4. Tỷ trọng điểm môn học: Điểm tổng kết được tính theo tỷ trọng do giảng viên quy định (ví dụ: 60% Assignment + 40% Quiz).`,

          payment: `THANH TOÁN & MÃ GIẢM GIÁ (COUPON):
1. Phương thức: Hỗ trợ cổng thanh toán trực tuyến VNPay và Mock Payment thử nghiệm.
2. Mã giảm giá: Tại trang thanh toán (Checkout), nhập mã Coupon vào ô "Mã giảm giá" và bấm "Áp dụng" để được giảm trừ trực tiếp.
3. Đơn hàng: Toàn bộ lịch sử giao dịch được lưu trữ minh bạch tại trang "Lịch sử đơn hàng".`,

          general: `HỆ THỐNG LMS PLATFORM:
Nền tảng học trực tuyến chất lượng cao với các khóa học Lập trình, AI, DevOps, Cơ sở dữ liệu. Hỗ trợ học qua Video/PDF, thảo luận dưới bài giảng, làm Quiz, nộp Assignment có giảng viên chấm, cấp chứng chỉ hoàn thành và chính sách bảo vệ học viên với quy chế hoàn tiền trong 24 giờ.`,
        };

        return {
          topic,
          content: policies[topic as keyof typeof policies] || policies.general,
        };
      }

      default:
        return { error: `Không nhận diện được tool: ${name}` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Lỗi khi thực thi công cụ dữ liệu" };
  }
}
