// backend/src/features/notifications/notifications.worker.js
const {
  Worker,
  connection,
  logger,
  emailsQueue,
} = require('../../services/queue.service');
const notificationsService = require('./notifications.service');
const { sendToUser } = require('./notifications.sse');

function toDto(notification) {
  return {
    id: notification._id.toString(),
    userId: notification.user.toString(),
    type: notification.type,
    entityType: notification.entityType,
    entityId: notification.entityId,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl,
    priority: notification.priority,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

new Worker(
  'notifications',
  async (job) => {
    if (job.name !== 'create-notification') return;

    const data = job.data;
    if (!data || !data.userId || !data.type) {
      logger.warn('Invalid notification job payload', {
        jobId: job?.id,
      });
      return;
    }

    const notification = await notificationsService.create(data);
    if (!notification) return;

    const dto = toDto(notification);

    sendToUser(dto.userId, {
      type: 'notification:new',
      payload: dto,
    });

    await emailsQueue.add('send-notification-email', notification.toObject(), {
      jobId: `email:${notification._id}`,
      removeOnComplete: true,
      removeOnFail: 50,
    });
  },
  connection
).on('failed', (job, err) => {
  logger.error('Notification job failed', {
    jobId: job?.id,
    error: err?.message,
  });
});
