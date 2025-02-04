// subscriber.ts
import {
  SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import { ResendNotificationTemplates } from '../modules/resend-notification/service';

export default async function handleInviteCreated({
  event: { data: { user: invitedUser, token, role } },
  container,
}: SubscriberArgs<{
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  token: string;
  role?: string;
}>) {
  const notificationModuleService = container.resolve(
    Modules.NOTIFICATION
  );

  if (!invitedUser?.email || !token) {
    throw new Error("Missing required data for invite.created event");
  }

  // Validate environment variables
  const adminUrl = process.env.ADMIN_INVITE_URL_PREFIX;
  if (!adminUrl) {
    throw new Error("ADMIN_INVITE_URL_PREFIX environment variable is not set");
  }

  console.log(`Processing admin invite for ${invitedUser.email}`);

  try {
    await notificationModuleService.createNotifications({
      to: invitedUser.email,
      channel: "email",
      template: ResendNotificationTemplates.INVITE_ADMIN,
      data: {
        token,
        user: invitedUser,
        subject: `You've been invited to join ${process.env.COMPANY_NAME || 'our'} admin team`,
        accept_invite_url: `${adminUrl}/invite?token=${token}`,
      },
    });
    console.log(`Invite email sent successfully to ${invitedUser.email}`);
  } catch (error) {
    console.error("Admin invite notification failed:", error);
    // Re-throw or handle error appropriately
    throw error;
  }
}

export const config: SubscriberConfig = {
  event: "invite.created",
};
