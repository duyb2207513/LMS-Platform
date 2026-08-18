export interface AiChatMessage {
  role: "user" | "model" | "assistant";
  content: string;
}

export interface AiChatRequest {
  message: string;
  history?: AiChatMessage[];
  courseId?: string;
}

export interface AiChatResponse {
  reply: string;
  suggestions?: string[];
  sources?: Array<{
    title: string;
    type: "course" | "lesson" | "policy";
    url?: string;
  }>;
}
