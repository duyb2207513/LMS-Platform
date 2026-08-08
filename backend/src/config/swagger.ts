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