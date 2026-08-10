export type LessonType = "VIDEO" | "TEXT" | "DOCUMENT";

export interface CreateLessonInput {
  title: string;
  lessonType: LessonType;
  content?: string | null;
  durationSeconds?: number | null;
  position?: number;
  isPreview?: boolean;
  isRequired?: boolean;
  isPublished?: boolean;
}

export type UpdateLessonInput = Partial<CreateLessonInput>;
