import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
<<<<<<< HEAD
    url: process.env["DATABASE_URL"],
  },
});
=======
    url: process.env["DATABASE_URL"] ?? "postgresql://postgres:postgres@localhost:5432/lms_platform",
  },
});



>>>>>>> df17fd1ccc89144d240c76d09f8d290190e5b902
