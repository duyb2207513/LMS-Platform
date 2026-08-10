export interface ReviewInput { rating: number; content?: string | null }
export type UpdateReviewInput = Partial<ReviewInput>;
