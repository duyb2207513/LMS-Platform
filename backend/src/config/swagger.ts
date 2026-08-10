import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.3",

  info: {
    title: "LMS Platform API",
    version: "1.0.0",
    description: "REST API documentation for the LMS Platform"
  },

  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Local development server"
    }
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      refreshTokenCookie: {
        type: "apiKey",
        in: "cookie",
        name: "refreshToken",
        description: "Secure HttpOnly refresh token cookie set by login"
      }
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        additionalProperties: false,
        required: ["fullName", "email", "password", "confirmPassword"],
        properties: {
          fullName: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            example: "Trần Minh Duy"
          },
          email: {
            type: "string",
            format: "email",
            maxLength: 255,
            example: "duy@example.com"
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
            example: "Password123"
          },
          confirmPassword: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "Password123"
          }
        }
      },
      UserResponse: {
        type: "object",
        required: [
          "id",
          "fullName",
          "email",
          "avatarUrl",
          "role",
          "status",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
          fullName: { type: "string", example: "Trần Minh Duy" },
          email: { type: "string", format: "email", example: "duy@example.com" },
          avatarUrl: { type: "string", format: "uri", nullable: true, example: null },
          role: { type: "string", enum: ["STUDENT"], example: "STUDENT" },
          status: { type: "string", enum: ["ACTIVE"], example: "ACTIVE" },
          createdAt: { type: "string", format: "date-time", example: "2026-08-07T08:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-08-07T08:00:00.000Z" }
        }
      },
      LoginRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            maxLength: 255,
            example: "duy@example.com"
          },
          password: {
            type: "string",
            format: "password",
            example: "Password123"
          }
        }
      },
      LoginUserResponse: {
        type: "object",
        required: ["id", "fullName", "email", "avatarUrl", "role", "status"],
        properties: {
          id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
          fullName: { type: "string", example: "Trần Minh Duy" },
          email: { type: "string", format: "email", example: "duy@example.com" },
          avatarUrl: { type: "string", format: "uri", nullable: true, example: null },
          role: {
            type: "string",
            enum: ["STUDENT", "INSTRUCTOR", "ADMIN"],
            example: "STUDENT"
          },
          status: { type: "string", enum: ["ACTIVE"], example: "ACTIVE" }
        }
      },
      LoginResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Login successful" },
          data: {
            type: "object",
            required: ["accessToken", "user"],
            properties: {
              accessToken: {
                type: "string",
                description: "JWT access token valid for 15 minutes",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              },
              user: { $ref: "#/components/schemas/LoginUserResponse" }
            }
          }
        }
      },
      RefreshTokenResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Token refreshed successfully" },
          data: {
            type: "object",
            required: ["accessToken"],
            properties: {
              accessToken: {
                type: "string",
                description: "New JWT access token valid for 15 minutes",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              }
            }
          }
        }
      },
      LogoutResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Logout successful" },
          data: { nullable: true, example: null }
        }
      },
      ProfileResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Profile retrieved successfully" },
          data: {
            type: "object",
            required: [
              "id",
              "fullName",
              "email",
              "avatarUrl",
              "role",
              "status",
              "createdAt",
              "updatedAt"
            ],
            properties: {
              id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
              fullName: { type: "string", example: "Trần Minh Duy" },
              email: { type: "string", format: "email", example: "duy@example.com" },
              avatarUrl: { type: "string", format: "uri", nullable: true, example: null },
              role: {
                type: "string",
                enum: ["STUDENT", "INSTRUCTOR", "ADMIN"],
                example: "STUDENT"
              },
              status: {
                type: "string",
                enum: ["ACTIVE", "BLOCKED"],
                example: "ACTIVE"
              },
              createdAt: { type: "string", format: "date-time", example: "2026-08-07T08:00:00.000Z" },
              updatedAt: { type: "string", format: "date-time", example: "2026-08-07T08:00:00.000Z" }
            }
          }
        }
      },
      UpdateProfileRequest: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          fullName: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            example: "Trần Minh Duy Updated"
          },
          avatarUrl: {
            type: "string",
            format: "uri",
            nullable: true,
            example: "https://example.com/avatar.jpg"
          }
        }
      },
      UpdateProfileResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Profile updated successfully" },
          data: {
            type: "object",
            required: ["id", "fullName", "email", "avatarUrl", "role", "status"],
            properties: {
              id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
              fullName: { type: "string", example: "Trần Minh Duy Updated" },
              email: { type: "string", format: "email", example: "duy@example.com" },
              avatarUrl: {
                type: "string",
                format: "uri",
                nullable: true,
                example: "https://example.com/avatar.jpg"
              },
              role: {
                type: "string",
                enum: ["STUDENT", "INSTRUCTOR", "ADMIN"],
                example: "STUDENT"
              },
              status: {
                type: "string",
                enum: ["ACTIVE", "BLOCKED"],
                example: "ACTIVE"
              }
            }
          }
        }
      },
      ChangePasswordRequest: {
        type: "object",
        additionalProperties: false,
        required: ["currentPassword", "newPassword", "confirmNewPassword"],
        properties: {
          currentPassword: {
            type: "string",
            format: "password",
            example: "Password123"
          },
          newPassword: {
            type: "string",
            format: "password",
            minLength: 8,
            pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
            example: "NewPassword456"
          },
          confirmNewPassword: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "NewPassword456"
          }
        }
      },
      ChangePasswordResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Password changed successfully" },
          data: { nullable: true, example: null }
        }
      },
      Category: {
        type: "object",
        required: ["id", "name", "slug", "description"],
        properties: {
          id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
          name: { type: "string", example: "Lập trình Web" },
          slug: { type: "string", example: "lap-trinh-web" },
          description: {
            type: "string",
            nullable: true,
            example: "Các khóa học phát triển website"
          }
        }
      },
      CreateCategoryRequest: {
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100, example: "Lập trình Web" },
          description: {
            type: "string",
            nullable: true,
            example: "Các khóa học phát triển website"
          }
        }
      },
      UpdateCategoryRequest: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100, example: "Phát triển Web" },
          description: { type: "string", nullable: true, example: "Frontend và Backend" }
        }
      },
      CategoryResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Category created successfully" },
          data: { $ref: "#/components/schemas/Category" }
        }
      },
      CategoryListResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Categories retrieved successfully" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Category" }
          }
        }
      },
      CourseLevel: {
        type: "string",
        enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
      },
      CourseStatus: {
        type: "string",
        enum: ["DRAFT", "PUBLISHED", "ARCHIVED"]
      },
      Course: {
        type: "object",
        required: ["id", "title", "slug", "description", "level", "price", "isFree", "status"],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "ExpressJS cơ bản" },
          slug: { type: "string", example: "expressjs-co-ban" },
          description: { type: "string" },
          thumbnailUrl: { type: "string", format: "uri", nullable: true },
          level: { $ref: "#/components/schemas/CourseLevel" },
          price: { type: "number", minimum: 0, example: 299000 },
          isFree: { type: "boolean", example: false },
          language: { type: "string", example: "Vietnamese" },
          requirements: { type: "string", nullable: true },
          learningOutcomes: { type: "string", nullable: true },
          status: { $ref: "#/components/schemas/CourseStatus" },
          publishedAt: { type: "string", format: "date-time", nullable: true },
          instructor: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              fullName: { type: "string" },
              avatarUrl: { type: "string", nullable: true }
            }
          },
          category: { $ref: "#/components/schemas/Category" }
        }
      },
      CreateCourseRequest: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "categoryId", "level"],
        properties: {
          title: { type: "string", maxLength: 255 },
          description: { type: "string" },
          categoryId: { type: "string", format: "uuid" },
          level: { $ref: "#/components/schemas/CourseLevel" },
          price: { type: "number", minimum: 0, default: 0 },
          isFree: { type: "boolean", default: false },
          language: { type: "string", maxLength: 50, default: "Vietnamese" },
          requirements: { type: "string", nullable: true },
          learningOutcomes: { type: "string", nullable: true }
        }
      },
      UpdateCourseRequest: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        description: "All fields are optional. instructorId, status, slug, and thumbnailUrl are not accepted.",
        properties: {
          title: { type: "string", maxLength: 255 },
          description: { type: "string" },
          categoryId: { type: "string", format: "uuid" },
          level: { $ref: "#/components/schemas/CourseLevel" },
          price: { type: "number", minimum: 0 },
          isFree: { type: "boolean" },
          language: { type: "string", maxLength: 50 },
          requirements: { type: "string", nullable: true },
          learningOutcomes: { type: "string", nullable: true }
        }
      },
      CourseResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string" },
          data: { $ref: "#/components/schemas/Course" }
        }
      },
      CourseListResponse: {
        type: "object",
        required: ["success", "message", "data", "meta"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          message: { type: "string", example: "Courses retrieved successfully" },
          data: { type: "array", items: { $ref: "#/components/schemas/Course" } },
          meta: {
            type: "object",
            required: ["page", "limit", "totalItems", "totalPages"],
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 12 },
              totalItems: { type: "integer", example: 25 },
              totalPages: { type: "integer", example: 3 }
            }
          }
        }
      },
      ThumbnailResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", enum: [true] },
          message: { type: "string", example: "Thumbnail uploaded successfully" },
          data: {
            type: "object",
            properties: { thumbnailUrl: { type: "string", format: "uri" } }
          }
        }
      },
      CourseStatusResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", enum: [true] },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              status: { $ref: "#/components/schemas/CourseStatus" },
              publishedAt: { type: "string", format: "date-time", nullable: true }
            }
          }
        }
      },
      LessonType: {
        type: "string",
        enum: ["VIDEO", "TEXT", "DOCUMENT"]
      },
      Section: {
        type: "object",
        required: ["id", "courseId", "title", "position"],
        properties: {
          id: { type: "string", format: "uuid" },
          courseId: { type: "string", format: "uuid" },
          title: { type: "string", maxLength: 255, example: "Giới thiệu" },
          position: { type: "integer", minimum: 1, example: 1 },
          lessons: { type: "array", items: { $ref: "#/components/schemas/Lesson" } }
        }
      },
      Lesson: {
        type: "object",
        required: ["id", "sectionId", "title", "lessonType", "position", "isPreview", "isRequired", "isPublished"],
        properties: {
          id: { type: "string", format: "uuid" },
          sectionId: { type: "string", format: "uuid" },
          title: { type: "string", maxLength: 255, example: "Cài đặt môi trường" },
          lessonType: { $ref: "#/components/schemas/LessonType" },
          content: { type: "string", nullable: true },
          videoUrl: { type: "string", format: "uri", nullable: true },
          documentUrl: { type: "string", format: "uri", nullable: true },
          durationSeconds: { type: "integer", minimum: 0, nullable: true },
          position: { type: "integer", minimum: 1 },
          isPreview: { type: "boolean" },
          isRequired: { type: "boolean" },
          isPublished: { type: "boolean" },
          quiz: { type: "object", nullable: true, description: "Quiz metadata (full questions/options are returned on instructor management endpoints)" }
        }
      },
      CreateSectionRequest: {
        type: "object", additionalProperties: false, required: ["title"],
        properties: { title: { type: "string", maxLength: 255 }, position: { type: "integer", minimum: 1 } }
      },
      UpdateSectionRequest: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: { title: { type: "string", maxLength: 255 }, position: { type: "integer", minimum: 1 } }
      },
      CreateLessonRequest: {
        type: "object", additionalProperties: false, required: ["title", "lessonType"],
        properties: {
          title: { type: "string", maxLength: 255 }, lessonType: { $ref: "#/components/schemas/LessonType" },
          content: { type: "string", nullable: true }, durationSeconds: { type: "integer", minimum: 0, nullable: true },
          position: { type: "integer", minimum: 1 }, isPreview: { type: "boolean", default: false },
          isRequired: { type: "boolean", default: true }, isPublished: { type: "boolean", default: false }
        }
      },
      UpdateLessonRequest: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: {
          title: { type: "string", maxLength: 255 }, lessonType: { $ref: "#/components/schemas/LessonType" },
          content: { type: "string", nullable: true }, durationSeconds: { type: "integer", minimum: 0, nullable: true },
          position: { type: "integer", minimum: 1 }, isPreview: { type: "boolean" }, isRequired: { type: "boolean" }, isPublished: { type: "boolean" }
        }
      },
      EnrollmentResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", enum: [true] }, message: { type: "string", example: "Course enrolled successfully" },
          data: { type: "object", properties: { id: { type: "string", format: "uuid" }, courseId: { type: "string", format: "uuid" }, progressPercent: { type: "number", example: 0 }, status: { type: "string", enum: ["ACTIVE", "COMPLETED", "CANCELLED"] } } }
        }
      },
      CourseContentResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", enum: [true] }, message: { type: "string" },
          data: { type: "object", properties: { course: { type: "object", properties: { id: { type: "string", format: "uuid" }, title: { type: "string" } } }, sections: { type: "array", items: { $ref: "#/components/schemas/Section" } } } }
        }
      },
      UpdateLessonProgressRequest: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: { lastWatchedSecond: { type: "integer", minimum: 0, example: 120 }, isCompleted: { type: "boolean", example: true } }
      },
      ProgressSummary: {
        type: "object", required: ["totalLessons", "completedLessons", "progressPercent"],
        properties: { totalLessons: { type: "integer", example: 10 }, completedLessons: { type: "integer", example: 4 }, progressPercent: { type: "number", format: "float", example: 40 } }
      },
      LessonProgressResponse: {
        type: "object",
        properties: { success: { type: "boolean", enum: [true] }, message: { type: "string" }, data: { type: "object", properties: { lessonProgress: { type: "object" }, courseProgress: { $ref: "#/components/schemas/ProgressSummary" } } } }
      },
      CourseProgressResponse: {
        type: "object",
        properties: { success: { type: "boolean", enum: [true] }, message: { type: "string" }, data: { $ref: "#/components/schemas/ProgressSummary" } }
      },
      CreateQuizRequest: {
        type: "object", additionalProperties: false, required: ["title"],
        properties: { title: { type: "string", maxLength: 255 }, description: { type: "string", nullable: true }, passingScore: { type: "integer", minimum: 0, maximum: 100, default: 70 }, maxAttempts: { type: "integer", minimum: 1, maximum: 20, default: 3 }, timeLimitMinutes: { type: "integer", minimum: 1, maximum: 300, nullable: true }, isPublished: { type: "boolean", default: false } }
      },
      UpdateQuizRequest: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: { title: { type: "string", maxLength: 255 }, description: { type: "string", nullable: true }, passingScore: { type: "integer", minimum: 0, maximum: 100 }, maxAttempts: { type: "integer", minimum: 1, maximum: 20 }, timeLimitMinutes: { type: "integer", minimum: 1, maximum: 300, nullable: true }, isPublished: { type: "boolean" } }
      },
      CreateQuestionRequest: {
        type: "object", additionalProperties: false, required: ["text"],
        properties: { text: { type: "string", maxLength: 5000 }, explanation: { type: "string", nullable: true }, points: { type: "integer", minimum: 1, maximum: 100, default: 1 }, position: { type: "integer", minimum: 1 } }
      },
      UpdateQuestionRequest: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: { text: { type: "string", maxLength: 5000 }, explanation: { type: "string", nullable: true }, points: { type: "integer", minimum: 1, maximum: 100 }, position: { type: "integer", minimum: 1 } }
      },
      CreateQuizOptionRequest: {
        type: "object", additionalProperties: false, required: ["text"],
        properties: { text: { type: "string", maxLength: 2000 }, isCorrect: { type: "boolean", default: false }, position: { type: "integer", minimum: 1 } }
      },
      UpdateQuizOptionRequest: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: { text: { type: "string", maxLength: 2000 }, isCorrect: { type: "boolean" }, position: { type: "integer", minimum: 1 } }
      },
      SubmitQuizAttemptRequest: {
        type: "object", additionalProperties: false, required: ["answers"],
        properties: { answers: { type: "array", items: { type: "object", required: ["questionId", "optionId"], properties: { questionId: { type: "string", format: "uuid" }, optionId: { type: "string", format: "uuid" } } } } }
      },
      CreateReviewRequest: {
        type: "object", additionalProperties: false, required: ["rating"],
        properties: { rating: { type: "integer", minimum: 1, maximum: 5 }, content: { type: "string", maxLength: 2000, nullable: true } }
      },
      UpdateReviewRequest: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: { rating: { type: "integer", minimum: 1, maximum: 5 }, content: { type: "string", maxLength: 2000, nullable: true } }
      },
      CreateCommentRequest: {
        type: "object", additionalProperties: false, required: ["content"],
        properties: { content: { type: "string", maxLength: 5000 }, parentId: { type: "string", format: "uuid", nullable: true, description: "Top-level comment ID when creating a reply" } }
      },
      UpdateCommentRequest: {
        type: "object", additionalProperties: false, required: ["content"],
        properties: { content: { type: "string", maxLength: 5000 } }
      },
      CreateOrderRequest: {
        type: "object", additionalProperties: false, required: ["courseIds"],
        properties: { courseIds: { type: "array", minItems: 1, maxItems: 20, uniqueItems: true, items: { type: "string", format: "uuid" } } }
      },
      OrderItem: {
        type: "object", required: ["courseId", "courseTitleSnapshot", "priceSnapshot"],
        properties: { id: { type: "string", format: "uuid" }, courseId: { type: "string", format: "uuid" }, courseTitleSnapshot: { type: "string" }, priceSnapshot: { type: "number", example: 299000 } }
      },
      Order: {
        type: "object", required: ["id", "orderNumber", "status", "subtotal", "total", "currency", "items"],
        properties: { id: { type: "string", format: "uuid" }, orderNumber: { type: "string", example: "ORD-20260810-ABC123" }, status: { type: "string", enum: ["PENDING", "PAID", "CANCELLED"] }, subtotal: { type: "number" }, total: { type: "number" }, currency: { type: "string", enum: ["VND"] }, paidAt: { type: "string", format: "date-time", nullable: true }, items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } } }
      },
      MockPaymentCallbackRequest: {
        type: "object", required: ["token", "status"],
        properties: { token: { type: "string", description: "Opaque token embedded in mockPaymentUrl" }, status: { type: "string", enum: ["SUCCEEDED", "FAILED"] } }
      },
      MockPaymentWebhookRequest: {
        type: "object", additionalProperties: false, required: ["eventId", "paymentId", "status", "providerTransactionId", "amount", "currency"],
        properties: { eventId: { type: "string" }, paymentId: { type: "string", format: "uuid" }, status: { type: "string", enum: ["SUCCEEDED", "FAILED"] }, providerTransactionId: { type: "string" }, amount: { type: "number" }, currency: { type: "string", enum: ["VND"] } }
      },
      Certificate: {
        type: "object", required: ["id", "certificateNumber", "verificationCode", "studentNameSnapshot", "courseTitleSnapshot", "instructorNameSnapshot", "issuedAt"],
        properties: { id: { type: "string", format: "uuid" }, certificateNumber: { type: "string", example: "LMS-2026-A1B2C3D4" }, verificationCode: { type: "string" }, studentNameSnapshot: { type: "string" }, courseTitleSnapshot: { type: "string" }, instructorNameSnapshot: { type: "string" }, issuedAt: { type: "string", format: "date-time" }, revokedAt: { type: "string", format: "date-time", nullable: true } }
      },
      AdminUserUpdateRequest: {
        type: "object", additionalProperties: false,
        properties: { role: { type: "string", enum: ["STUDENT", "INSTRUCTOR", "ADMIN"] }, status: { type: "string", enum: ["ACTIVE", "BLOCKED"] } }
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "message"],
        properties: {
          success: { type: "boolean", enum: [false], example: false },
          message: { type: "string" },
          errors: {
            type: "object",
            additionalProperties: { type: "string" }
          }
        }
      }
    }
  }
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [
    "./src/routes/*.ts",
    "./src/modules/**/*.routes.ts"
  ]
});
