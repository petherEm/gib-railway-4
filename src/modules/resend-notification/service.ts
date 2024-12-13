import { ProviderSendNotificationDTO } from '@medusajs/types';
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/utils';

import { Resend } from 'resend';

import { validateModuleOptions } from '../../utils/validate-module-options';
import { OrderPlacedEmailTemplate } from './email-templates/order-placed';
import { ResetPasswordEmailTemplate } from './email-templates/reset-password';

type ModuleOptions = {
  apiKey: string;
  fromEmail: string;
  replyToEmail: string;
  toEmail: string;
  enableEmails: string | boolean; // Allow both string and boolean
};

export enum ResendNotificationTemplates {
  ORDER_PLACED = 'order-placed',
  RESET_PASSWORD = 'reset-password'
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

    // Add explicit log for initialization
    // console.log('ResendNotificationProviderService initialized with options:', {
    //   fromEmail: options.fromEmail,
    //   enableEmails: options.enableEmails
    // });
  }

  // Send mail
  private async sendMail(subject: string, body: any, toEmail?: string) {
    try {
      // Log the input parameters
      console.log('Attempting to send email with:', {
        enabled: this.options.enableEmails,
        to: toEmail || this.options.toEmail,
        subject,
        fromEmail: this.options.fromEmail
      });

      const isEnabled = String(this.options.enableEmails).toLowerCase() === 'true';
      
      if (!isEnabled) {
        console.log('Emails are disabled. Enable them by setting enableEmails to "true"');
        return {};
      }

      const { data, error } = await this.resend.emails.send({
        from: this.options.fromEmail,
        replyTo: this.options.replyToEmail,
        to: [toEmail ? toEmail : this.options.toEmail],
        subject: subject,
        react: body
      });

      // Log the response
      // console.log('Resend API response:', { data, error });

      if (error) {
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message);
      }

      return data!;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Send order placed mail
  private async sendOrderPlacedMail(notification: ProviderSendNotificationDTO) {
    const orderData = { order: notification?.data };
    const dynamicSubject = notification?.data?.subject as string;

    return await this.sendMail(
      dynamicSubject,
      OrderPlacedEmailTemplate({ data: orderData }),
      notification.to
    );
  }

    // Send reset password mail
  private async sendResetPasswordMail(notification: ProviderSendNotificationDTO) {
    const url = notification?.data?.url as string;
    const dynamicSubject = notification?.data?.subject as string;

    return await this.sendMail(
      dynamicSubject,
      ResetPasswordEmailTemplate({url}),
      notification.to
    );
  }

  async send(notification: ProviderSendNotificationDTO) {
    switch (notification.template) {
      case ResendNotificationTemplates.ORDER_PLACED.toString():
        return await this.sendOrderPlacedMail(notification);

       case ResendNotificationTemplates.RESET_PASSWORD.toString():
        return await this.sendResetPasswordMail(notification);
    }

    return {};
  }

}

export default ResendNotificationProviderService;
