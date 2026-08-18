import { env } from "../../config/env.js";
import { executeAiTool } from "./ai.tools.js";
import type { AiChatMessage, AiChatResponse } from "./ai.types.js";

interface AgentIntent {
  category: "COURSE_SEARCH" | "COURSE_DETAIL" | "ACADEMIC_QNA" | "POLICY_QUERY" | "STUDENT_PROGRESS" | "OFF_TOPIC";
  keyword?: string;
  isFree?: boolean;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  topic?: "refund" | "certificate" | "assignment" | "payment" | "general";
  courseIdentifier?: string;
  explanationTopic?: string;
  contextSummary?: string;
}

const INTENT_ROUTER_PROMPT = `Bạn là Router Agent trong hệ thống Multi-Agent của LMS Platform.
Nhiệm vụ: Phân tích câu hỏi MỚI NHẤT của người dùng KẾT HỢP với LỊCH SỬ ĐỐI THOẠI trước đó để phân loại và trích xuất tham số chính xác (trả về ĐÚNG 1 JSON duy nhất, không kèm giải thích hay markdown code fence).

QUY TẮC LIÊN KẾT NGỮ CẢNH (CONTEXT LINKING & COREFERENCE RESOLUTION):
- Nếu người dùng hỏi câu hỏi tiếp nối (ví dụ: "Nó có miễn phí không?", "Khóa đó học trong bao lâu?", "Giảng viên của khóa này là ai?", "Giải thích kỹ hơn về phần trên...", "Có bài tập gì trong bài này?"):
  -> BẮT BUỘC đọc lịch sử các câu trước để xác định "Nó/Khóa đó/Bài này" là gì, rồi điền đúng keyword / courseIdentifier / explanationTopic.

Các nhóm (category):
1. "COURSE_SEARCH": Người dùng tìm kiếm, lọc danh sách khóa học (tìm theo từ khóa, miễn phí/có phí, cấp độ).
2. "COURSE_DETAIL": Người dùng hỏi thông tin cụ thể về 1 khóa học (giáo trình, số bài học, giảng viên, thời lượng).
3. "ACADEMIC_QNA": Người dùng hỏi kiến thức chuyên môn bài giảng, lý thuyết, giải thích code, thuật toán, khái niệm kỹ thuật.
4. "POLICY_QUERY": Người dùng hỏi quy chế, chính sách của web (hoàn tiền trong 24h, điều kiện cấp chứng chỉ, cách nộp bài tập assignment, thanh toán).
5. "STUDENT_PROGRESS": Người dùng hỏi tiến độ học tập cá nhân, bài tập cần nộp của mình.
6. "OFF_TOPIC": Người dùng hỏi những chủ đề KHÔNG liên quan đến học tập hay nền tảng LMS (thời tiết, giải trí, showbiz, chính trị, giá vàng, bói toán, đùa cợt vô nghĩa).

Format JSON:
{
  "category": "COURSE_SEARCH" | "COURSE_DETAIL" | "ACADEMIC_QNA" | "POLICY_QUERY" | "STUDENT_PROGRESS" | "OFF_TOPIC",
  "keyword": "từ khóa trích xuất",
  "isFree": true | false,
  "level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "topic": "refund" | "certificate" | "assignment" | "payment" | "general",
  "courseIdentifier": "tên hoặc id khóa học đang được nhắc tới",
  "explanationTopic": "chủ đề chuyên môn cần giải thích",
  "contextSummary": "tóm tắt ngắn gọn ngữ cảnh liên kết từ các câu trước (1 câu)"
}`;

const SYNTHESIZER_SYSTEM_PROMPT = `Bạn là Trợ lý Học tập AI LMS Platform (Editorial & Response Synthesizer).
NHIỆM VỤ: Dựa trên lịch sử đối thoại và dữ liệu thực tế được cung cấp bởi các Specialist Agents, hãy biên soạn câu trả lời hoàn chỉnh, sâu sắc, có tính liên kết cao và chuyên nghiệp cho người học.

QUY TẮC PHONG CÁCH VÀ VĂN PHONG (BẮT BUỘC):
1. LIÊN KẾT HỘI THOẠI LIỀN MẠCH:
   - Nếu là câu hỏi tiếp nối (follow-up): Trả lời trực tiếp vào vấn đề của đối tượng vừa hỏi ở câu trước, không chào hỏi lại rườm rà.
   - Giữ ngữ cảnh xuyên suốt cuộc trò chuyện để tạo cảm giác có chiều sâu và thấu hiểu.
2. TUYỆT ĐỐI KHÔNG LẠM DỤNG ICON/EMOJI:
   - Không chèn emoji lung tung ở đầu mỗi dòng hoặc giữa câu.
   - Giữ văn phong nghiêm túc, học thuật, trong sáng và thanh lịch.
3. ĐỊNH DẠNG MARKDOWN CHUẨN:
   - Dùng tiêu đề rõ ràng (##, ### nếu cần).
   - Dùng danh sách đánh số hoặc gạch đầu dòng gọn gàng, dứt khoát.
   - Với code: Luôn dùng code block có chỉ định ngôn ngữ (ví dụ: \`\`\`javascript).
4. NỘI DUNG CHÍNH XÁC & CÓ CHIỀU SÂU:
   - Trả lời đúng trọng tâm dựa trên dữ liệu thật được cung cấp.
   - Nếu là danh sách khóa học: Nêu rõ Tên khóa học, Danh mục, Trình độ, Học phí và đường dẫn xem chi tiết dạng: [Xem khóa học](/courses/{slug}).
   - Nếu là kiến thức chuyên môn: Giải thích nguyên lý cốt lõi, cơ chế hoạt động, ưu nhược điểm và ví dụ minh họa trực quan.`;

async function callGeminiRaw(prompt: string, systemInstruction?: string, temperature = 0.2): Promise<string> {
  let apiKey = (env.geminiApiKey || "").trim().replace(/^["']|["']$/g, "");
  if (apiKey.startsWith("DAIzaSy")) {
    apiKey = apiKey.slice(1);
  }
  if (!apiKey) throw new Error("Chưa cấu hình GEMINI_API_KEY");

  const candidateModels = [
    env.geminiModel || "gemini-2.0-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        ...(systemInstruction ? { system_instruction: { parts: [{ text: systemInstruction }] } } : {}),
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generation_config: {
          temperature,
          max_output_tokens: 1800,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        lastError = new Error(`Gemini API (${model}) error (${res.status}): ${err}`);
        if (res.status === 404) {
          // Model not found, try next candidate model
          continue;
        }
        throw lastError;
      }

      const data = (await res.json()) as any;
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) {
      lastError = err;
      if (candidateModels.indexOf(model) < candidateModels.length - 1) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Không thể kết nối đến Gemini API");
}

function formatHistorySnippet(history: AiChatMessage[]): string {
  if (!history.length) return "Chưa có lịch sử trước đó.";
  return history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "Người dùng" : "Trợ lý AI"}: ${h.content}`)
    .join("\n");
}

/**
 * AGENT 1: Multi-turn Context-Aware Intent Classifier
 */
async function runIntentClassifierAgent(userMessage: string, history: AiChatMessage[]): Promise<AgentIntent> {
  const historyText = formatHistorySnippet(history);
  try {
    const prompt = `LỊCH SỬ ĐỐI THOẠI GẦN ĐÂY (3-5 lượt gần nhất):\n${historyText}\n\nCÂU HỎI MỚI NHẤT CỦA NGƯỜI DÙNG:\n"${userMessage}"\n\nHãy phân tích ngữ cảnh, liên kết với câu hỏi trước (nếu có) và trả về JSON theo đúng định dạng được yêu cầu.`;
    const rawResult = await callGeminiRaw(prompt, INTENT_ROUTER_PROMPT, 0.1);

    const cleaned = rawResult.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as AgentIntent;
    if (parsed.category) return parsed;
  } catch (error) {
    console.warn("Intent Classifier fallback to heuristic:", error);
  }

  // Heuristic Fallback
  const q = userMessage.toLowerCase();
  if (q.includes("miễn phí") || q.includes("khóa học") || q.includes("học phí") || q.includes("danh sách khóa")) {
    return {
      category: "COURSE_SEARCH",
      isFree: q.includes("miễn phí") || q.includes("free") || q.includes("0đ"),
      keyword: q.replace(/(tìm|cho tôi|các|khóa học|miễn phí|free)/gi, "").trim(),
    };
  }
  if (q.includes("hoàn tiền") || q.includes("chứng chỉ") || q.includes("bài tập") || q.includes("thanh toán")) {
    let topic: AgentIntent["topic"] = "general";
    if (q.includes("hoàn tiền")) topic = "refund";
    else if (q.includes("chứng chỉ")) topic = "certificate";
    else if (q.includes("bài tập")) topic = "assignment";
    else if (q.includes("thanh toán")) topic = "payment";
    return { category: "POLICY_QUERY", topic };
  }
  if (q.includes("tiến độ") || q.includes("điểm của tôi") || q.includes("bài chưa nộp")) {
    return { category: "STUDENT_PROGRESS" };
  }

  return { category: "ACADEMIC_QNA", explanationTopic: userMessage };
}

/**
 * AGENT 2: Specialist Execution Layer
 */
async function runSpecialistAgent(intent: AgentIntent, userMessage: string, currentUserId?: string, courseId?: string): Promise<any> {
  switch (intent.category) {
    case "COURSE_SEARCH": {
      return executeAiTool("searchCourses", {
        keyword: intent.keyword || undefined,
        level: intent.level || undefined,
        isFree: intent.isFree,
      });
    }

    case "COURSE_DETAIL": {
      return executeAiTool("getCourseDetails", {
        courseIdentifier: intent.courseIdentifier || intent.keyword || userMessage,
      });
    }

    case "ACADEMIC_QNA": {
      const dbKnowledge = await executeAiTool("searchLearningContent", {
        query: intent.explanationTopic || intent.keyword || userMessage,
        courseId,
      });
      return {
        queryTopic: intent.explanationTopic || userMessage,
        dbKnowledge,
      };
    }

    case "POLICY_QUERY": {
      return executeAiTool("getLmsPolicies", {
        topic: intent.topic || "general",
      });
    }

    case "STUDENT_PROGRESS": {
      return executeAiTool("getStudentLearningSummary", {}, currentUserId);
    }

    case "OFF_TOPIC": {
      return {
        isOffTopic: true,
        reason: "Yêu cầu không liên quan đến học tập hay nền tảng giáo dục LMS.",
      };
    }

    default:
      return {};
  }
}

/**
 * AGENT 3: Context-Aware Synthesis & Editorial Agent
 */
async function runSynthesisAgent(userMessage: string, intent: AgentIntent, specialistData: any, history: AiChatMessage[]): Promise<string> {
  if (intent.category === "OFF_TOPIC" || specialistData.isOffTopic) {
    return `Tôi là Trợ lý Học tập LMS Platform, hiện chỉ hỗ trợ các câu hỏi liên quan đến kiến thức học tập, bài giảng và khóa học trên hệ thống.

Bạn có thắc mắc nào về bài học hoặc cần tư vấn khóa học để nâng cao kỹ năng không?`;
  }

  const historyText = formatHistorySnippet(history);
  const prompt = `LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
${historyText}

CÂU HỎI HIỆN TẠI CỦA HỌC VIÊN:
"${userMessage}"

PHÂN LOẠI Ý ĐỊNH VÀ NGỮ CẢNH LIÊN KẾT (INTENT):
${JSON.stringify(intent, null, 2)}

DỮ LIỆU THỰC TẾ TRÍCH XUẤT TỪ HỆ THỐNG LMS:
${JSON.stringify(specialistData, null, 2)}

HÃY BIÊN SOẠN CÂU TRẢ LỜI CÓ CHIỀU SÂU VÀ MẠCH LẠC:
- Trả lời liên kết tự nhiên với những gì đã trao đổi ở các câu trước (không chào hỏi lại nếu đang trò chuyện tiếp nối).
- Giải thích sâu sắc, rõ ràng, sư phạm, có dẫn chứng hoặc ví dụ cụ thể.
- Trình bày Markdown thanh lịch, TUYỆT ĐỐI KHÔNG dùng emoji ở đầu mỗi dòng.
- Đảm bảo tính chính xác theo dữ liệu hệ thống đã cung cấp.`;

  return callGeminiRaw(prompt, SYNTHESIZER_SYSTEM_PROMPT, 0.3);
}

/**
 * MAIN ORCHESTRATOR: Điều phối luồng Multi-Agent với Session Memory
 */
export async function askGeminiAgent(
  message: string,
  history: AiChatMessage[] = [],
  courseId?: string,
  currentUserId?: string
): Promise<AiChatResponse> {
  const apiKey = env.geminiApiKey;
  if (!apiKey) {
    return {
      reply: "Hệ thống chưa cấu hình `GEMINI_API_KEY`. Vui lòng khai báo API Key trong file `.env` của Backend để kích hoạt Trợ lý AI.",
      suggestions: ["Tìm khóa học lập trình", "Chính sách hoàn tiền 24 giờ", "Cách nhận chứng chỉ"],
    };
  }

  try {
    // 1. Tác tử phân tích ý định có liên kết ngữ cảnh lịch sử
    const intent = await runIntentClassifierAgent(message, history);

    // 2. Tác tử chuyên môn thực thi tra cứu dữ liệu
    const specialistData = await runSpecialistAgent(intent, message, currentUserId, courseId);

    // 3. Tác tử tổng hợp câu trả lời sâu sắc & liền mạch
    const reply = await runSynthesisAgent(message, intent, specialistData, history);

    return {
      reply: reply.trim(),
      suggestions: generateContextSuggestions(intent.category),
    };
  } catch (error) {
    console.error("Multi-Agent execution error:", error);
    throw error;
  }
}

function generateContextSuggestions(category: AgentIntent["category"]): string[] {
  switch (category) {
    case "COURSE_SEARCH":
    case "COURSE_DETAIL":
      return ["Xem các khóa học mới nhất", "Có khóa học nào về AI không?", "Lộ trình học Lập trình Web"];
    case "POLICY_QUERY":
      return ["Điều kiện hoàn tiền trong 24 giờ", "Quy chế làm bài tập và tính điểm", "Điều kiện cấp chứng chỉ LMS"];
    case "ACADEMIC_QNA":
      return ["Giải thích chi tiết hơn bằng ví dụ", "Có bài tập thực hành về phần này không?", "Tìm khóa học liên quan đến chủ đề này"];
    case "STUDENT_PROGRESS":
      return ["Xem danh sách bài tập chưa nộp", "Tiến độ hoàn thành khóa học", "Cách nhận chứng chỉ khi học xong"];
    default:
      return ["Khám phá các khóa học nổi bật", "Chính sách hoàn tiền trong 24 giờ", "Cách nhận chứng chỉ LMS"];
  }
}