// service.ts
import { ProviderSendNotificationDTO } from '@medusajs/types';
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/utils';

import { Resend } from 'resend';

import { validateModuleOptions } from '../../utils/validate-module-options';
import { OrderPlacedEmailTemplate } from './email-templates/order-placed';
import { ResetPasswordEmailTemplate } from './email-templates/reset-password';
import { InviteAdminEmailTemplate } from './email-templates/invite-admin';

type ModuleOptions = {
  apiKey: string;
  fromEmail: string;
  replyToEmail: string;
  toEmail: string;
  enableEmails: string | boolean; // Allow both string and boolean
};

export enum ResendNotificationTemplates {
  ORDER_PLACED = 'order-placed',
  RESET_PASSWORD = 'reset-password',
  INVITE_ADMIN = 'invite-admin',
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  private resend: Resend;
  private options: ModuleOptions;

  static identifier = 'resend-notification';

  constructor(container, options: ModuleOptions) {
    super();
    validateModuleOptions(options, 'resendNotificationProvider');

    this.resend = new Resend(options.apiKey);
    this.options = options;
  }

  private async sendMail(subject: string, body: any, toEmail?: string) {
    const isEnabled = typeof this.options.enableEmails === "boolean"
      ? this.options.enableEmails
      : String(this.options.enableEmails).toLowerCase() === "true";

    if (!isEnabled) {
      console.log("Emails are disabled. Enable them by setting enableEmails to true.");
      return {};
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.options.fromEmail,
        replyTo: this.options.replyToEmail,
        to: [toEmail || this.options.toEmail],
        subject: subject,
        react: body,
      });

      if (error) {
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message);
      }

      return data!;
    } catch (error) {
      console.error(`Failed to send email to ${toEmail || this.options.toEmail} with subject: ${subject}`, error);
      throw error;
    }
  }

  private async sendOrderPlacedMail(notification: ProviderSendNotificationDTO) {
    const orderData = { order: notification?.data };
    const dynamicSubject = notification?.data?.subject as string;

    return await this.sendMail(
      dynamicSubject,
      OrderPlacedEmailTemplate({ data: orderData }),
      notification.to
    );
  }

  private async sendResetPasswordMail(notification: ProviderSendNotificationDTO) {
    const url = notification?.data?.url as string;
    const dynamicSubject = notification?.data?.subject as string;

    return await this.sendMail(
      dynamicSubject,
      ResetPasswordEmailTemplate({ url }),
      notification.to
    );
  }

  private async sendInviteAdminMail(notification: ProviderSendNotificationDTO) {
    return await this.sendMail(
      notification.data.subject || 'Admin Team Invitation',
      InviteAdminEmailTemplate({
        token: notification.data.token,
        user: notification.data.user
      }),
      notification.to
    );
  }

  async send(notification: ProviderSendNotificationDTO) {
    console.log('Sending notification:', notification.template);
    
    switch (notification.template) {
      case ResendNotificationTemplates.ORDER_PLACED:
        return await this.sendOrderPlacedMail(notification);

      case ResendNotificationTemplates.RESET_PASSWORD:
        return await this.sendResetPasswordMail(notification);

      case ResendNotificationTemplates.INVITE_ADMIN:
        return await this.sendInviteAdminMail(notification);
    }

    return {};
  }

  async sendNotification(
    event: string,
    data: ProviderSendNotificationDTO,
    attachmentGenerator: unknown
  ): Promise<{ to: string; status: string; data: Record<string, unknown> }> {
    const result = await this.send(data);
    return {
      to: data.to,
      status: "done",
      data: result,
    };
  }
}

export default ResendNotificationProviderService;
