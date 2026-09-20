// src/utils/notificationService.js
import emailjs from '@emailjs/browser';

/**
 * -------------------------------------------------------------
 * NOTIFICATION SERVICE (Telegram & EmailJS)
 * -------------------------------------------------------------
 */

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8680333203:AAH1WpSrp6BMsisr1-65GRcSsImDomygWzg';
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '8881557500';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_irrebil';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_3yquzdn';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'xtYbcnlzSnVzNXGBL';
const ADMIN_EMAIL = 'reachchauffeur@gmail.com';

// Initialize the official EmailJS browser client once
try {
  if (EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
} catch (e) {
  console.warn('EmailJS SDK init warning:', e);
}

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
 * Send an email using official @emailjs/browser SDK with REST API fallback
 */
export const sendEmailNotification = async (toEmail, subject, textOrHtmlMessage, extraParams = {}) => {
  if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
    console.warn('Invalid or missing recipient email for notification:', toEmail);
    return false;
  }

  if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
    console.warn('EmailJS credentials missing. Skipping email to:', toEmail);
    return false;
  }

  const cleanEmail = toEmail.trim();
  const recipientName = extraParams.name || extraParams.to_name || (cleanEmail.split('@')[0] || 'Valued Client');
  
  // Format plain text and HTML representations
  const plainText = typeof textOrHtmlMessage === 'string' 
    ? textOrHtmlMessage.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]+>/g, '')
    : String(textOrHtmlMessage);
  const htmlContent = typeof textOrHtmlMessage === 'string' 
    ? textOrHtmlMessage.replace(/\n/g, '<br>')
    : String(textOrHtmlMessage);

  const templateParams = {
    // Recipient address fields
    to_email: cleanEmail,
    email: cleanEmail,
    user_email: cleanEmail,
    customer_email: cleanEmail,
    client_email: cleanEmail,
    recipient: cleanEmail,
    to: cleanEmail,
    
    // Recipient name fields
    to_name: recipientName,
    name: recipientName,
    customer_name: recipientName,
    client_name: recipientName,

    // Header & Meta fields
    from_name: 'Reach Chauffeur Dispatch',
    reply_to: ADMIN_EMAIL,
    subject: subject,
    title: subject,

    // Body content fields
    message: plainText,
    html_message: htmlContent,
    content: plainText,
    details: plainText,

    // Merge any contextual parameters
    ...extraParams
  };

  // Attempt 1: Official @emailjs/browser SDK
  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log(`[EmailJS SDK] Email delivered to ${cleanEmail}:`, result.status, result.text);
    return true;
  } catch (sdkError) {
    console.warn(`[EmailJS SDK] Failed, attempting direct REST fallback:`, sdkError);
  }

  // Attempt 2: Direct REST API Fallback
  try {
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      publicKey: EMAILJS_PUBLIC_KEY,
      template_params: templateParams
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[EmailJS REST] Error (${response.status}) sending to ${cleanEmail}:`, errText);
      return false;
    } else {
      console.log(`[EmailJS REST] Successfully sent email to ${cleanEmail}`);
      return true;
    }
  } catch (fetchError) {
    console.error('Network error sending EmailJS notification:', fetchError);
    return false;
  }
};

/**
 * -------------------------------------------------------------
 * APPLICATION EVENT WRAPPERS (Dual Passenger & Admin Alerts)
 * -------------------------------------------------------------
 */

/**
 * Triggered when passenger submits a new ride request
 */
export const triggerNewBookingAlert = async (bookingRecord) => {
  const ref = bookingRecord.bookingRef || 'RC-BOOKING';
  const passengerEmail = bookingRecord.personal?.email || bookingRecord.email || '';
  const passengerName = bookingRecord.personal?.name || 'Client';
  const vehicle = bookingRecord.vehicle || 'Chauffeur Vehicle';
  const pickup = bookingRecord.logistics?.pickup || 'Pickup Location';
  const date = bookingRecord.logistics?.date || 'Scheduled Date';
  const cost = bookingRecord.totalCost ? `₦${Number(bookingRecord.totalCost).toLocaleString()}` : '';

  // 1. Instant Telegram to Admin
  const telegramMsg = `[DISPATCH ALERT] <b>NEW BOOKING REQUEST</b>\n\n<b>Ref:</b> ${ref}\n<b>Passenger:</b> ${passengerName}\n<b>Phone:</b> ${bookingRecord.personal?.phone || 'N/A'}\n<b>Email:</b> ${passengerEmail || 'N/A'}\n<b>Vehicle:</b> ${vehicle}\n<b>Pickup:</b> ${pickup}\n<b>Date:</b> ${date}\n<b>Tariff:</b> ${cost}\n\n<i>Login to Admin Command Center to approve!</i>`;
  await notifyAdminTelegram(telegramMsg);

  // 2. Email to Admin
  await sendEmailNotification(
    ADMIN_EMAIL,
    `New Booking Request: ${ref}`,
    `New booking request submitted by ${passengerName} (${passengerEmail}) for ${vehicle} on ${date}. Pickup: ${pickup}. Tariff: ${cost}. Please log into the Admin Command Center to approve.`,
    { bookingRef: ref, booking_ref: ref, to_name: 'Reach Admin' }
  );

  // 3. Email to Passenger
  if (passengerEmail) {
    const passengerMsg = `Dear ${passengerName},\n\nThank you for choosing Reach Chauffeur. We have received your booking request (${ref}) for our ${vehicle}.\n\nBooking Summary:\n- Reference: ${ref}\n- Vehicle: ${vehicle}\n- Pickup: ${pickup}\n- Date: ${date}\n- Tariff: ${cost}\n\nOur dispatch team is currently reviewing your schedule. You will receive an official approval email shortly with instructions to finalize your booking.\n\nWarm regards,\nReach Chauffeur Dispatch Desk`;
    await sendEmailNotification(
      passengerEmail,
      `Booking Request Received (${ref}) - Reach Chauffeur`,
      passengerMsg,
      { bookingRef: ref, booking_ref: ref, to_name: passengerName }
    );
  }
};

/**
 * Triggered when Admin approves a booking BEFORE payment
 */
export const triggerAdminApprovalAlert = async (customerEmail, bookingRef, bookingData = {}) => {
  const vehicle = bookingData.vehicle || 'Executive Chauffeur Vehicle';
  const pickup = bookingData.logistics?.pickup || 'Scheduled Pickup';
  const passengerName = bookingData.personal?.name || (customerEmail ? customerEmail.split('@')[0] : 'Valued Client');

  // 1. Email to Passenger
  if (customerEmail) {
    const passengerMsg = `Dear ${passengerName},\n\nGreat news! Your booking request (${bookingRef}) has been officially APPROVED by the Reach Chauffeur Dispatch Center.\n\nApproved Itinerary:\n- Booking Reference: ${bookingRef}\n- Vehicle: ${vehicle}\n- Route / Pickup: ${pickup}\n- Status: Approved - Awaiting Payment\n\nPlease visit our Live Tracking portal below to review your approved itinerary and complete your payment to secure your chauffeur:\nhttps://reach-chauffeur.web.app/tracking\n\nWarm regards,\nReach Chauffeur Dispatch Team`;
    await sendEmailNotification(
      customerEmail,
      `Booking Request Approved (${bookingRef}) - Reach Chauffeur`,
      passengerMsg,
      { bookingRef, booking_ref: bookingRef, to_name: passengerName }
    );
  }

  // 2. Email to Admin
  await sendEmailNotification(
    ADMIN_EMAIL,
    `[APPROVED] Booking ${bookingRef} Approved`,
    `Booking ${bookingRef} for ${customerEmail || 'Passenger'} has been approved. The passenger has been notified to complete payment.`,
    { bookingRef, booking_ref: bookingRef, to_name: 'Reach Admin' }
  );

  // 3. Telegram to Admin
  await notifyAdminTelegram(`[APPROVED] Booking <b>${bookingRef}</b> approved for <i>${customerEmail || 'Passenger'}</i>. Awaiting client payment.`);
};

/**
 * Triggered when Admin assigns a chauffeur and dispatches
 */
export const triggerChauffeurDispatchedAlert = async (customerEmail, bookingRef, driverName, driverPhone, vehicleName, licensePlate) => {
  const driverContact = driverPhone ? `(Contact: ${driverPhone})` : '';
  const vehiclePlate = licensePlate ? `[${licensePlate}]` : '';

  // 1. Email to Passenger
  if (customerEmail) {
    const passengerMsg = `Dear Client,\n\nYour executive chauffeur has been officially DISPATCHED for booking ${bookingRef}!\n\nDispatch Details:\n- Assigned Chauffeur: ${driverName} ${driverContact}\n- Executive Fleet Vehicle: ${vehicleName} ${vehiclePlate}\n- Status: Chauffeur En Route\n\nYou can track your vehicle's live GPS movement and arrival in real-time on our tracking portal:\nhttps://reach-chauffeur.web.app/tracking\n\nYour chauffeur is held to the highest standards of discretion and security. Have a pleasant journey.\n\nWarm regards,\nReach Chauffeur Dispatch Desk`;
    await sendEmailNotification(
      customerEmail,
      `Chauffeur Dispatched: Driver En Route (${bookingRef}) - Reach Chauffeur`,
      passengerMsg,
      { 
        bookingRef, 
        booking_ref: bookingRef, 
        driver_name: driverName, 
        vehicle_name: vehicleName,
        to_name: customerEmail.split('@')[0]
      }
    );
  }

  // 2. Email to Admin
  await sendEmailNotification(
    ADMIN_EMAIL,
    `[DISPATCH CONFIRMED] Chauffeur Dispatched for ${bookingRef}`,
    `Chauffeur ${driverName} ${driverContact} has been dispatched with ${vehicleName} ${vehiclePlate} for booking ${bookingRef} (${customerEmail || 'Passenger'}).`,
    { bookingRef, booking_ref: bookingRef, to_name: 'Reach Admin' }
  );

  // 3. Telegram to Admin
  await notifyAdminTelegram(`[DISPATCH CONFIRMED] Chauffeur <b>${driverName}</b> is now en route with <b>${vehicleName}</b> ${vehiclePlate} for booking <b>${bookingRef}</b>.`);
};

/**
 * Triggered when Passenger submits payment confirmation
 */
export const triggerPaymentReceivedAlert = async (bookingRef, customerName, customerEmail) => {
  const telegramMsg = `[PAYMENT] <b>PAYMENT CONFIRMATION RECEIVED</b>\n\n<b>Ref:</b> ${bookingRef}\n<b>Passenger:</b> ${customerName || 'Client'}\n<b>Email:</b> ${customerEmail || 'N/A'}\n\n<i>Passenger marked payment complete. Please verify in Admin Panel!</i>`;
  await notifyAdminTelegram(telegramMsg);

  // Email to Admin
  await sendEmailNotification(
    ADMIN_EMAIL,
    `Payment Confirmation Received: ${bookingRef}`,
    `Passenger ${customerName || 'Client'} (${customerEmail || 'N/A'}) has flagged payment as completed for booking ${bookingRef}. Please review transaction ledger and schedule dispatch in Admin Command Center.`,
    { bookingRef, booking_ref: bookingRef, to_name: 'Reach Admin' }
  );

  // Email to Passenger
  if (customerEmail) {
    await sendEmailNotification(
      customerEmail,
      `Payment Received Confirmation (${bookingRef}) - Reach Chauffeur`,
      `Dear ${customerName || 'Client'},\n\nWe have received your payment confirmation for booking ${bookingRef}. Our accounts department will verify the transaction and schedule your chauffeur dispatch.\n\nYou can check status anytime on our tracking portal:\nhttps://reach-chauffeur.web.app/tracking\n\nThank you,\nReach Chauffeur Dispatch Desk`,
      { bookingRef, booking_ref: bookingRef, to_name: customerName }
    );
  }
};

/**
 * Triggered when trip completes
 */
export const triggerRideEndedAlert = async (bookingRef, customerEmail) => {
  const adminMsg = `[STATUS] <b>RIDE COMPLETED</b>\n\n<b>Ref:</b> ${bookingRef} has successfully completed their trip.`;
  await notifyAdminTelegram(adminMsg);

  await sendEmailNotification(
    ADMIN_EMAIL,
    `[COMPLETED] Ride Concluded: ${bookingRef}`,
    `Ride ${bookingRef} has officially ended successfully.`,
    { bookingRef, booking_ref: bookingRef, to_name: 'Reach Admin' }
  );

  if (customerEmail) {
    const customerMsg = `Dear Client,\n\nYour ride (Ref: ${bookingRef}) has officially concluded. We hope you enjoyed your presidential journey with Reach Chauffeur.\n\nThank you for choosing Reach Chauffeur. We look forward to serving your executive transport needs again soon.\n\nWarm regards,\nReach Chauffeur Team`;
    await sendEmailNotification(
      customerEmail, 
      `Reach Chauffeur - Ride Completed (${bookingRef})`, 
      customerMsg,
      { bookingRef, booking_ref: bookingRef }
    );
  }
};

/**
 * Triggered when client requests itinerary duration extension
 */
export const triggerExtensionRequestAlert = async (bookingRef, details) => {
  const msg = `[MODIFICATION] <b>EXTENSION REQUESTED</b>\n\n<b>Ref:</b> ${bookingRef}\n<b>Details:</b> ${details}\n\n<i>Passenger wishes to extend their booking duration.</i>`;
  await notifyAdminTelegram(msg);

  await sendEmailNotification(
    ADMIN_EMAIL,
    `Extension Requested for ${bookingRef}`,
    `Passenger for booking ${bookingRef} has requested an itinerary extension:\n${details}`,
    { bookingRef, booking_ref: bookingRef, to_name: 'Reach Admin' }
  );
};

