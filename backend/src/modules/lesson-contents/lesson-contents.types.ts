export interface LessonContentInput {
  contentType: "TEXT" | "VIDEO" | "DOCUMENT";
  textContent?: string | null;
  position?: number;
}
export interface UpdateLessonContentInput { textContent?: string | null }
export interface ReorderLessonContentsInput { contentIds: string[] }
