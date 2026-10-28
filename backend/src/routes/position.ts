
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
    // Simpan atau perbarui data posisi.
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

    // Tandai perangkat aktif karena paket baru telah diterima.
    await prisma.deviceMonitorState.upsert({
      where: {
        deviceId,
      },
      update: {
        isOffline: false,
      },
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

export default router;
