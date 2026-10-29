
import { Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const positionSchema = z.object({
  counter: z.number().int().nonnegative(),
  status: z.enum(["FIX", "NOFIX"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number(),
  satellites: z.number().int().nonnegative(),
  hdop: z.number().nonnegative(),
  rssi: z.number().int(),
  snr: z.number(),
});

// POST /api/positions
// Menerima dan menyimpan data GPS dan LoRa.
router.post("/", async (req: Request, res: Response) => {
  const parsed = positionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Format data posisi tidak valid",
      errors: parsed.error.flatten(),
    });
  }

  const data = parsed.data;
  const deviceId = "gateway-1";
  const receivedAt = new Date();

  try {
    const position = await prisma.position.upsert({
      where: {
        deviceId_counter: {
          deviceId,
          counter: data.counter,
        },
      },
      update: {
        status: data.status,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        satellites: data.satellites,
        hdop: data.hdop,
        rssi: data.rssi,
        snr: data.snr,
        receivedAt,
      },
      create: {
        deviceId,
        ...data,
        receivedAt,
      },
    });

    // Tandai perangkat aktif setelah paket diterima.
    await prisma.deviceMonitorState.upsert({
      where: { deviceId },
      update: { isOffline: false },
      create: {
        deviceId,
        isOffline: false,
      },
    });

    return res.status(200).json({
      message: "Posisi berhasil disimpan",
      data: position,
    });
  } catch (error) {
    console.error("Gagal menyimpan posisi:", error);

    return res.status(500).json({
      message: "Gagal menyimpan posisi ke database",
    });
  }
});

// GET /api/positions
// Mengambil riwayat maksimal 100 posisi.
router.get("/", async (_req: Request, res: Response) => {
  try {
    const positions = await prisma.position.findMany({
      where: {
        deviceId: "gateway-1",
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: 100,
    });

    return res.status(200).json({
      message: "Data posisi berhasil diambil",
      data: positions,
    });
  } catch (error) {
    console.error("Gagal mengambil riwayat posisi:", error);

    return res.status(500).json({
      message: "Gagal mengambil data posisi",
    });
  }
});

// GET /api/positions/latest
// Mengambil satu posisi terbaru.
router.get("/latest", async (_req: Request, res: Response) => {
  try {
    const position = await prisma.position.findFirst({
      where: {
        deviceId: "gateway-1",
      },
      orderBy: {
        receivedAt: "desc",
      },
    });

    if (!position) {
      return res.status(404).json({
        message: "Belum ada data posisi",
      });
    }

    return res.status(200).json({
      message: "Posisi terbaru berhasil diambil",
      data: position,
    });
  } catch (error) {
    console.error("Gagal mengambil posisi terbaru:", error);

    return res.status(500).json({
      message: "Gagal mengambil posisi dari database",
    });
  }
});

export default router;
