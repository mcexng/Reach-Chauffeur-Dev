// src/utils/notificationService.js

/**
 * -------------------------------------------------------------
 * NOTIFICATION SERVICE (Telegram & EmailJS)
 * -------------------------------------------------------------
 * IMPORTANT: To make this work, the Admin MUST configure the keys below.
 */

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '8881557500';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_irrebil';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_3yquzdn';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'xtYbcnlzSnVzNXGB';

/**
 * Send an instant Telegram message to the Admin
 */
export const notifyAdminTelegram = async (message) => {
  if (TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN' || !TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram Bot Token not configured. Skipping admin notification.');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML', // Using HTML to allow bold and italic
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram message', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};

/**
 * Send an email using EmailJS to either the Admin or the Customer
 */
export const sendEmailNotification = async (toEmail, subject, htmlMessage) => {
  if (EMAILJS_SERVICE_ID === 'YOUR_EMAILJS_SERVICE_ID' || !EMAILJS_SERVICE_ID) {
    console.warn('EmailJS keys not configured. Skipping email notification to:', toEmail);
    return;
  }

  try {
    const data = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        subject: subject,
        message: htmlMessage, // Your EmailJS template MUST have {{{message}}} to render raw HTML or {{message}} for text
      }
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to send EmailJS email', await response.text());
    }
  } catch (error) {
    console.error('Error sending EmailJS notification:', error);
  }
};

/**
 * Convenience wrappers for specific application events
 */

export const triggerNewBookingAlert = async (bookingRecord) => {
  const telegramMsg = `[DISPATCH ALERT] <b>NEW BOOKING REQUEST</b>\n\n<b>Ref:</b> ${bookingRecord.bookingRef}\n<b>Passenger:</b> ${bookingRecord.personal?.name}\n<b>Phone:</b> ${bookingRecord.personal?.phone}\n<b>Email:</b> ${bookingRecord.personal?.email}\n<b>Vehicle:</b> ${bookingRecord.vehicle}\n<b>Pickup:</b> ${bookingRecord.logistics?.pickup}\n<b>Date:</b> ${bookingRecord.logistics?.date}\n\n<i>Login to Admin Command Center to approve!</i>`;
  await notifyAdminTelegram(telegramMsg);

  // Email to Admin
  await sendEmailNotification(
    'reachchauffeur@gmail.com',
    `New Booking Request: ${bookingRecord.bookingRef}`,
    telegramMsg.replace(/\n/g, '<br>')
  );
};

export const triggerPaymentReceivedAlert = async (bookingRef, customerName) => {
  const msg = `[PAYMENT] <b>PAYMENT CONFIRMATION RECEIVED</b>\n\n<b>Ref:</b> ${bookingRef}\n<b>Passenger:</b> ${customerName}\n\n<i>Passenger claims to have paid. Please verify in Admin Panel!</i>`;
  await notifyAdminTelegram(msg);
};

export const triggerAdminApprovalAlert = async (customerEmail, bookingRef) => {
  const msg = `Your booking (Ref: ${bookingRef}) has been approved by the Dispatch Center.<br><br>Please proceed to the live tracking page to finalize your payment.`;
  await sendEmailNotification(customerEmail, 'Reach Chauffeur - Booking Approved', msg);
};

export const triggerChauffeurDispatchedAlert = async (customerEmail, bookingRef, driverName, vehicleName) => {
  const msg = `Your Chauffeur <b>${driverName}</b> has been officially dispatched with your <b>${vehicleName}</b> for booking ${bookingRef}.<br><br>You can track them live on the tracking portal!`;
  await sendEmailNotification(customerEmail, 'Reach Chauffeur - Driver Dispatched', msg);
};

export const triggerRideEndedAlert = async (bookingRef, customerEmail) => {
  const adminMsg = `[STATUS] <b>RIDE COMPLETED</b>\n\n<b>Ref:</b> ${bookingRef} has successfully completed their trip.`;
  await notifyAdminTelegram(adminMsg);

  if (customerEmail) {
    const customerMsg = `Your ride (Ref: ${bookingRef}) has officially ended. Thank you for choosing Reach Chauffeur.`;
    await sendEmailNotification(customerEmail, 'Reach Chauffeur - Ride Completed', customerMsg);
  }
};

export const triggerExtensionRequestAlert = async (bookingRef, details) => {
  const msg = `[MODIFICATION] <b>EXTENSION REQUESTED</b>\n\n<b>Ref:</b> ${bookingRef}\n<b>Details:</b> ${details}\n\n<i>Passenger wishes to extend their booking duration.</i>`;
  await notifyAdminTelegram(msg);
};
