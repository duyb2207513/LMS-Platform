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
        description: "Secure HttpOnly refresh token cookie set by the login endpoint"
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
