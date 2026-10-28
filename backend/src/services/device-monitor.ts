
import { notifyAdmin } from "../lib/onesignal";
import { prisma } from "../lib/prisma";

const DEVICE_ID = "gateway-1";
const TIMEOUT_MS = 120_000;
const CHECK_INTERVAL_MS = 15_000;

let checking = false;

async function checkDeviceStatus() {
  // Hindari pemeriksaan yang tumpang tindih.
  if (checking) return;
  checking = true;

  try {
    const latest = await prisma.position.findFirst({
      where: { deviceId: DEVICE_ID },
      orderBy: { receivedAt: "desc" },
    });

    // Jangan menyatakan offline sebelum pernah ada paket.
    if (!latest) return;

    const state = await prisma.deviceMonitorState.findUnique({
      where: { deviceId: DEVICE_ID },
    });

    const elapsed = Date.now() - latest.receivedAt.getTime();
    const isCurrentlyOffline = elapsed >= TIMEOUT_MS;

    if (isCurrentlyOffline && !state?.isOffline) {
      await notifyAdmin(
        "Peringatan HikerMap",
        `Node ${DEVICE_ID} tidak terdeteksi selama 5 menit. Periksa koneksi LoRa dan gateway.`
      );

      await prisma.deviceMonitorState.upsert({
        where: { deviceId: DEVICE_ID },
        create: { deviceId: DEVICE_ID, isOffline: true },
        update: { isOffline: true },
      });

      console.log(`[MONITOR] ${DEVICE_ID} dinyatakan offline`);
    }

    if (!isCurrentlyOffline && state?.isOffline) {
      await notifyAdmin(
        "Koneksi HikerMap Pulih",
        `Node ${DEVICE_ID} kembali terdeteksi. Paket posisi sudah diterima kembali.`
      );

      await prisma.deviceMonitorState.update({
        where: { deviceId: DEVICE_ID },
        data: { isOffline: false },
      });

      console.log(`[MONITOR] ${DEVICE_ID} kembali online`);
    }
  } catch (error) {
    console.error("[MONITOR] Gagal memeriksa status node:", error);
  } finally {
    checking = false;
  }
}

export function startDeviceMonitor() {
  // Pemeriksaan pertama langsung dijalankan.
  void checkDeviceStatus();

  // Pemeriksaan berikutnya setiap 15 detik.
  setInterval(() => {
    void checkDeviceStatus();
  }, CHECK_INTERVAL_MS);

  console.log("[MONITOR] Pemantauan node aktif; timeout 300 detik");
}
