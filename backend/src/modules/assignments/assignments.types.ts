export interface AssignmentInput {
  title: string;
  description?: string | null;
  instructions?: string | null;
  dueAt: Date;
  maxScore?: number;
  allowResubmission?: boolean;
  maxSubmissions?: number;
  allowLateSubmissions?: boolean;
  isPublished?: boolean;
}

export type UpdateAssignmentInput = Partial<AssignmentInput>;

export interface GradeSubmissionInput {
  score: number;
  comment?: string | null;
}

export interface CourseGradeRuleInput {
  assignmentWeight: number;
  quizWeight: number;
  passingScore: number;
}
