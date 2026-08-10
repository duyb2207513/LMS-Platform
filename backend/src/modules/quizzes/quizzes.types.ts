export interface QuizInput { title: string; description?: string | null; passingScore?: number; maxAttempts?: number; timeLimitMinutes?: number | null; isPublished?: boolean }
export type UpdateQuizInput = Partial<QuizInput>;
export interface QuestionInput { text: string; explanation?: string | null; points?: number; position?: number }
export type UpdateQuestionInput = Partial<QuestionInput>;
export interface OptionInput { text: string; isCorrect?: boolean; position?: number }
export type UpdateOptionInput = Partial<OptionInput>;
export interface SubmitAttemptInput { answers: Array<{ questionId: string; optionId: string }> }
