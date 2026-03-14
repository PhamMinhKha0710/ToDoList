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

/**
 * Gửi thông báo mời tham gia dự án
 * @param {string} to - Email người nhận
 * @param {string} projectName - Tên dự án
 * @param {string} inviterName - Tên người mời
 * @param {string} projectUrl - Link đến dự án
 */
const sendProjectInvitationEmail = async (to, projectName, inviterName, projectUrl) => {
  const mailOptions = {
    from: `"ToDoList App" <${MAIL_USER}>`,
    to,
    subject: `Bạn được mời tham gia dự án: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background-color: #f9fafb; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827; margin-top: 0;">Lời mời tham gia dự án</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Chào bạn,<br/>
          <strong>${inviterName || 'Một thành viên'}</strong> vừa mời bạn tham gia dự án <strong style="color: #4f46e5;">${projectName}</strong> trên ToDoList.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${projectUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Xem Dự Án
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          Hãy nhấn vào nút trên để truy cập dự án và bắt đầu làm việc cùng nhóm nhé!
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Project invitation email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send project invitation email to ${to}: ${error.message}`);
  }
};

/**
 * Gửi thông báo được phân công việc
 * @param {string} to - Email người nhận
 * @param {string} taskName - Tên task
 * @param {string} projectName - Tên dự án
 * @param {string} assignerName - Tên người giao việc
 * @param {string} projectUrl - Link đến dự án chứa task
 */
const sendTaskAssignmentEmail = async (to, taskName, projectName, assignerName, projectUrl) => {
  const mailOptions = {
    from: `"ToDoList App" <${MAIL_USER}>`,
    to,
    subject: `Nhiệm vụ mới: ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background-color: #f9fafb; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827; margin-top: 0;">Bạn có nhiệm vụ mới</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Chào bạn,<br/>
          <strong>${assignerName || 'Một thành viên'}</strong> vừa giao cho bạn một công việc mới trong dự án <strong>${projectName}</strong>.
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
    await transporter.sendMail(mailOptions);
    logger.info(`Task assignment email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send task assignment email to ${to}: ${error.message}`);
  }
};

module.exports = { 
  sendOtpEmail,
  sendProjectInvitationEmail,
  sendTaskAssignmentEmail
};
