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
