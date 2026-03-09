const nodemailer = require('nodemailer');
const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = require('../config/env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_PORT === 465,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

/**
 * Gửi OTP reset mật khẩu qua email
 * @param {string} to - Email người nhận
 * @param {string} otp - Mã OTP 6 số
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"ToDoList App" <${MAIL_USER}>`,
    to,
    subject: 'Mã OTP đặt lại mật khẩu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0733fa;">Đặt lại mật khẩu</h2>
        <p>Mã OTP của bạn là:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0733fa; padding: 16px 0;">
          ${otp}
        </div>
        <p style="color: #888;">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
        <p style="color: #aaa; font-size: 12px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send OTP email to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = { sendOtpEmail };
