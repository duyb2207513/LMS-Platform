import { onUnmounted, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { LearningEventType } from '@/types/analytics'

export function useLearningTracker() {
  const api = useApi()
  const sessionId = ref<string>(crypto.randomUUID())
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let isTracking = false

  async function sendEvent(input: {
    courseId: string
    lessonId?: string
    eventType: LearningEventType
    durationSeconds?: number
  }) {
    try {
      await api.post('/analytics/events', {
        courseId: input.courseId,
        lessonId: input.lessonId,
        eventType: input.eventType,
        durationSeconds: input.durationSeconds || 0,
        occurredAt: new Date().toISOString(),
        sessionId: sessionId.value,
      })
    } catch (error) {
      console.warn('[LearningTracker] Failed to send event:', error)
    }
  }

  function startHeartbeat(courseId: string, lessonId: string, intervalSeconds: number = 30) {
    if (isTracking) stopHeartbeat()
    isTracking = true

    // Initial event: LESSON_STARTED
    sendEvent({
      courseId,
      lessonId,
      eventType: 'LESSON_STARTED',
      durationSeconds: 0,
    })

    // Heartbeat every intervalSeconds
    heartbeatTimer = setInterval(() => {
      if (document.hidden) return // Pause heartbeat if tab is hidden
      sendEvent({
        courseId,
        lessonId,
        eventType: 'STUDY_SESSION',
        durationSeconds: intervalSeconds,
      })
    }, intervalSeconds * 1000)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    isTracking = false
  }

  onUnmounted(() => {
    stopHeartbeat()
  })

  return {
    sessionId,
    sendEvent,
    startHeartbeat,
    stopHeartbeat,
  }
}
