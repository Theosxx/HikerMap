
const APP_ID = process.env.ONESIGNAL_APP_ID;
const API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const ADMIN_EXTERNAL_ID = process.env.ONESIGNAL_ADMIN_EXTERNAL_ID;

export async function notifyAdmin(
  title: string,
  message: string
): Promise<void> {
  if (!APP_ID || !API_KEY || !ADMIN_EXTERNAL_ID) {
    throw new Error("Konfigurasi OneSignal belum lengkap");
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${API_KEY}`,
    },
    body: JSON.stringify({
      app_id: APP_ID,
      target_channel: "push",
      include_aliases: {
        external_id: [ADMIN_EXTERNAL_ID],
      },
      headings: { en: title, id: title },
      contents: { en: message, id: message },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("OneSignal gagal mengirim notifikasi:", result);
    throw new Error(`OneSignal HTTP ${response.status}`);
  }

  console.log("Notifikasi OneSignal berhasil diminta:", result);
}
