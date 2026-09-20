// src/utils/notificationService.js

/**
 * -------------------------------------------------------------
 * NOTIFICATION SERVICE (Telegram & EmailJS)
 * -------------------------------------------------------------
 */

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8680333203:AAH1WpSrp6BMsisr1-65GRcSsImDomygWzg';
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '8881557500';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_irrebil';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_3yquzdn';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'xtYbcnlzSnVzNXGB';

/**
 * Send an instant Telegram message to the Admin
 */
export const notifyAdminTelegram = async (message) => {
  if (!TELEGRAM_BOT_TOKEN) {
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
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};

/**
 * Send an email using EmailJS to either the Admin or the Customer
 */
export const sendEmailNotification = async (toEmail, subject, htmlMessage) => {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
    console.warn('EmailJS credentials missing. Skipping email notification to:', toEmail);
    return;
  }

  try {
    const data = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        to_name: toEmail ? toEmail.split('@')[0] : 'Valued Client',
        email: toEmail,
        user_email: toEmail,
        recipient: toEmail,
        subject: subject,
        title: subject,
        message: htmlMessage,
        html_message: htmlMessage,
        content: htmlMessage
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
      const errText = await response.text();
      console.error(`EmailJS error (${response.status}) sending to ${toEmail}:`, errText);
    } else {
      console.log(`EmailJS successfully delivered email to: ${toEmail}`);
    }
  } catch (error) {
    console.error('Network error sending EmailJS notification:', error);
  }
};

/**
 * Convenience wrappers for specific application events
 */

export const triggerNewBookingAlert = async (bookingRecord) => {
  const telegramMsg = `[DISPATCH ALERT] <b>NEW BOOKING REQUEST</b>\n\n<b>Ref:</b> ${bookingRecord.bookingRef}\n<b>Passenger:</b> ${bookingRecord.personal?.name || 'Client'}\n<b>Phone:</b> ${bookingRecord.personal?.phone || 'N/A'}\n<b>Email:</b> ${bookingRecord.personal?.email || 'N/A'}\n<b>Vehicle:</b> ${bookingRecord.vehicle || 'Chauffeur Vehicle'}\n<b>Pickup:</b> ${bookingRecord.logistics?.pickup || 'Pickup'}\n<b>Date:</b> ${bookingRecord.logistics?.date || ''}\n\n<i>Login to Admin Command Center to approve!</i>`;
  await notifyAdminTelegram(telegramMsg);

  // Email to Admin
  await sendEmailNotification(
    'reachchauffeur@gmail.com',
    `New Booking Request: ${bookingRecord.bookingRef}`,
    telegramMsg.replace(/\n/g, '<br>')
  );
};

export const triggerPaymentReceivedAlert = async (bookingRef, customerName) => {
  const msg = `[PAYMENT] <b>PAYMENT CONFIRMATION RECEIVED</b>\n\n<b>Ref:</b> ${bookingRef}\n<b>Passenger:</b> ${customerName}\n\n<i>Passenger marked payment complete. Please verify in Admin Panel!</i>`;
  await notifyAdminTelegram(msg);

  await sendEmailNotification(
    'reachchauffeur@gmail.com',
    `Payment Confirmation Received: ${bookingRef}`,
    msg.replace(/\n/g, '<br>')
  );
};

export const triggerAdminApprovalAlert = async (customerEmail, bookingRef) => {
  const msg = `Your booking (Ref: <b>${bookingRef}</b>) has been approved by the Reach Chauffeur Dispatch Center.<br><br>Please proceed to the live tracking page to review your itinerary and finalize payment.`;
  await sendEmailNotification(customerEmail, 'Reach Chauffeur - Booking Approved', msg);

  // Notify Admin on Telegram as well
  await notifyAdminTelegram(`[APPROVED] Booking <b>${bookingRef}</b> has been approved. Awaiting client payment confirmation.`);
};

export const triggerChauffeurDispatchedAlert = async (customerEmail, bookingRef, driverName, vehicleName) => {
  const msg = `Your Chauffeur <b>${driverName}</b> has been officially dispatched with your <b>${vehicleName}</b> for booking <b>${bookingRef}</b>.<br><br>You can track them live on the tracking portal!`;
  await sendEmailNotification(customerEmail, 'Reach Chauffeur - Driver Dispatched', msg);

  // Notify Admin on Telegram as well
  await notifyAdminTelegram(`[DISPATCH CONFIRMED] Chauffeur <b>${driverName}</b> is now en route with <b>${vehicleName}</b> for booking <b>${bookingRef}</b>.`);
};

export const triggerRideEndedAlert = async (bookingRef, customerEmail) => {
  const adminMsg = `[STATUS] <b>RIDE COMPLETED</b>\n\n<b>Ref:</b> ${bookingRef} has successfully completed their trip.`;
  await notifyAdminTelegram(adminMsg);

  if (customerEmail) {
    const customerMsg = `Your ride (Ref: <b>${bookingRef}</b>) has officially concluded. Thank you for choosing Reach Chauffeur.`;
    await sendEmailNotification(customerEmail, 'Reach Chauffeur - Ride Completed', customerMsg);
  }
};

export const triggerExtensionRequestAlert = async (bookingRef, details) => {
  const msg = `[MODIFICATION] <b>EXTENSION REQUESTED</b>\n\n<b>Ref:</b> ${bookingRef}\n<b>Details:</b> ${details}\n\n<i>Passenger wishes to extend their booking duration.</i>`;
  await notifyAdminTelegram(msg);
};
