import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private testAccount: nodemailer.TestAccount | null = null;

  constructor(private readonly config: ConfigService) {}

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    if (this.config.get<string>('NODE_ENV') === 'production') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.config.get<string>('MAIL_USER'),
          clientId: this.config.get<string>('MAIL_OAUTH_CLIENT_ID'),
          clientSecret: this.config.get<string>('MAIL_OAUTH_CLIENT_SECRET'),
          refreshToken: this.config.get<string>('MAIL_OAUTH_REFRESH_TOKEN'),
        },
      });
    } else {
      this.testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass,
        },
      });
    }

    return this.transporter;
  }

  async sendPasswordReset(to: string, resetLink: string): Promise<void> {
    const transport = await this.getTransporter();

    const info = await transport.sendMail({
      from: `"LightWeight" <${this.config.get<string>('MAIL_USER') ?? this.testAccount?.user}>`,
      to,
      subject: 'Recuperación de contraseña — LightWeight',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Restablecer contraseña</h2>
          <p>Haz clic en el enlace de abajo para restablecer tu contraseña. El enlace expira en 30 minutos.</p>
          <p><a href="${resetLink}" style="background:#f97316;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Restablecer contraseña</a></p>
          <p style="color:#888;font-size:12px;">Si no solicitaste este email, ignóralo.</p>
        </div>
      `,
    });

    if (this.config.get<string>('NODE_ENV') !== 'production') {
      console.log(
        '[MailService] Preview URL:',
        nodemailer.getTestMessageUrl(info),
      );
    }
  }
}
