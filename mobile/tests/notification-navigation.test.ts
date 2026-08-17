import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationDestination } from '../src/notifications/notificationNavigation';

test('opens an assignment from a grade notification', () => {
  assert.deepEqual(notificationDestination('ASSIGNMENT_GRADED', { assignmentId: 'a1', courseId: 'c1' }), { name: 'AssignmentDetail', params: { assignmentId: 'a1', courseId: 'c1' } });
});

test('opens direct messages with the sender selected', () => {
  assert.deepEqual(notificationDestination('DIRECT_MESSAGE', { senderId: 'u2' }), { name: 'Messages', params: { initialUserId: 'u2' } });
});

test('falls back to the notification tab', () => {
  assert.deepEqual(notificationDestination('WELCOME', {}), { name: 'Main', params: { screen: 'NotificationsTab' } });
});

test('opens the exact lesson when lessonId is present', () => {
  assert.deepEqual(notificationDestination('NEW_LESSON', { courseId: 'c1', courseTitle: 'NodeJS', lessonId: 'l2' }), { name: 'Learning', params: { courseId: 'c1', courseTitle: 'NodeJS', lessonId: 'l2' } });
});
