import type { NotificationType, RootStackParamList } from '../types';

export type NotificationDestination = { name: keyof RootStackParamList; params?: Record<string, unknown> };
const text = (data: Record<string, unknown>, key: string) => typeof data[key] === 'string' ? data[key] as string : undefined;

export function notificationDestination(type: NotificationType | string, data: Record<string, unknown> = {}): NotificationDestination {
  const assignmentId = text(data, 'assignmentId'), courseId = text(data, 'courseId');
  if (type === 'DIRECT_MESSAGE') return { name: 'Messages', params: { initialUserId: text(data, 'senderId') || text(data, 'userId') } };
  if ((type === 'ASSIGNMENT_DUE' || type === 'ASSIGNMENT_GRADED') && assignmentId && courseId) return { name: 'AssignmentDetail', params: { assignmentId, courseId } };
  if (type === 'PAYMENT_SUCCEEDED' && text(data, 'orderId')) return { name: 'PaymentResult', params: { orderId: text(data, 'orderId') } };
  if (type === 'CERTIFICATE_ISSUED') return { name: 'Certificates' };
  if (text(data, 'courseSlug')) return { name: 'CourseDetail', params: { slug: text(data, 'courseSlug') } };
  if (courseId) return { name: 'Learning', params: { courseId, courseTitle: text(data, 'courseTitle') || 'Khóa học', ...(text(data, 'lessonId') ? { lessonId: text(data, 'lessonId') } : {}) } };
  return { name: 'Main', params: { screen: 'NotificationsTab' } };
}
