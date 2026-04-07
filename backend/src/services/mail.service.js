class MailService {
  constructor({ nodemailer, ejs, path, MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, logger }) {
    this.MAIL_USER = MAIL_USER;
    this.logger = logger;
    this.ejs = ejs;
    this.path = path;

    this.transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: MAIL_PORT === 465,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });
  }

  async sendOtpEmail(to, otp, action = "Xác thực tài khoản") {
    let actionText = action;
    if (action === "CHANGE_PASSWORD") actionText = "Đổi mật khẩu";
    if (action === "UPDATE_EMAIL") actionText = "Cập nhật Email mới";

    const templatePath = this.path.join(__dirname, "../templates/otp-email.ejs");

    try {
      const htmlContent = await this.ejs.renderFile(templatePath, {
        otp,
        actionText,
      });

      const mailOptions = {
        from: `"ToDoList App" <${this.MAIL_USER}>`,
        to,
        subject: `Mã OTP: ${actionText}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.info(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendResetPasswordEmail(to, otp, resetUrl) {
    const mailOptions = {
      from: `"ToDoList App" <${this.MAIL_USER}>`,
      to,
      subject: `Khôi phục mật khẩu tài khoản của bạn`,
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; text-align: center; border: 1px solid #d0d7de; border-radius: 8px; background-color: #ffffff;">
        <h1 style="font-size: 22px; font-weight: 600; color: #1f2328; margin-bottom: 16px;">Khôi phục mật khẩu</h1>

        <p style="font-size: 14px; color: #636c76; line-height: 1.6; margin-bottom: 24px;">
          Xin chào, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
          Vui lòng nhấn vào nút bên dưới để tiến hành đổi mật khẩu. Mã OTP của bạn là: <strong>${otp}</strong>.
        </p>

        <div style="margin-bottom: 32px;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
            Đặt lại mật khẩu ngay
          </a>
        </div>

        <p style="font-size: 12px; color: #8c959f; line-height: 1.5;">
          Bạn cũng có thể sao chép và dán đường dẫn này vào trình duyệt:<br/>
          <a href="${resetUrl}" style="color: #0969da; text-decoration: none; word-break: break-all;">${resetUrl}</a>
        </p>

        <div style="border-top: 1px solid #d0d7de; padding-top: 24px; margin-top: 32px; color: #636c76; font-size: 12px;">
          <p style="margin: 0;">Link này có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      </div>
    `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.info(`Reset Password Link sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send Reset Password Link to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendProjectInvitationEmail(to, projectName, inviterName, projectUrl, projectColor = "#4f46e5") {
    const mailOptions = {
      from: `"ToDoList" <${this.MAIL_USER}>`,
      to,
      subject: `Bạn được mời tham gia dự án: ${projectName}`,
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; text-align: center; border: 1px solid #d0d7de; border-radius: 6px; background-color: #ffffff;">
        <div style="margin-bottom: 24px;">
           <img src="https://img.icons8.com/ios-filled/100/${projectColor.replace(
             "#",
             ""
           )}/filled-message.png" width="48" height="48" style="border-radius: 12px;" />
        </div>

        <h1 style="font-size: 20px; font-weight: 600; color: #1f2328; margin-bottom: 8px; margin-top: 0;">
          ${inviterName} mời bạn tham gia cộng tác
        </h1>

        <p style="font-size: 14px; color: #636c76; line-height: 1.5; margin-bottom: 32px;">
          Bạn vừa được mời tham gia vào dự án <strong style="color: #1f2328;">${projectName}</strong> trên hệ thống ToDoList. Hãy tham gia để bắt đầu làm việc cùng nhóm.
        </p>

        <a href="${projectUrl}" style="background-color: ${projectColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block; margin-bottom: 32px;">
          Chấp nhận lời mời
        </a>

        <div style="border-top: 1px solid #d0d7de; padding-top: 24px; color: #636c76; font-size: 12px; text-align: left;">
          <p style="margin: 0 0 4px 0;">Đây là lời mời tham gia dự án từ ToDoList.</p>
          <p style="margin: 0;">Nếu bạn không mong muốn tham gia dự án này, bạn có thể bỏ qua email này.</p>
        </div>
      </div>
    `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.info(`Project invitation email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send project invitation email to ${to}: ${error.message}`);
    }
  }

  async sendTaskAssignmentEmail(to, taskName, projectName, assignerName, projectUrl) {
    const mailOptions = {
      from: `"ToDoList App" <${this.MAIL_USER}>`,
      to,
      subject: `Nhiệm vụ mới: ${taskName}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background-color: #f9fafb; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827; margin-top: 0;">Bạn có nhiệm vụ mới</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Chào bạn,<br/>
          <strong>${assignerName || "Một thành viên"}</strong> vừa giao cho bạn một công việc mới trong dự án <strong>${projectName}</strong>.
        </p>
        <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 16px;">${taskName}</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Dự án: ${projectName}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${projectUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Mở Bảng Công Việc
          </a>
        </div>
      </div>
    `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.info(`Task assignment email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send task assignment email to ${to}: ${error.message}`);
    }
  }
}

module.exports = MailService;
