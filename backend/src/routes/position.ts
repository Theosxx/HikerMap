
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

  try {
    const position = await prisma.position.upsert({
      where: {
        deviceId_counter: {
          deviceId: "gateway-1",
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
      },
      create: {
        deviceId: "gateway-1",
        ...data,
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

// GET /api/positions/latest
router.get("/latest", async (_req: Request, res: Response) => {
  try {
    const position = await prisma.position.findFirst({
      where: { deviceId: "gateway-1" },
      orderBy: { receivedAt: "desc" },
    });

    if (!position) {
      return res.status(404).json({
        message: "Belum ada data posisi",
      });
    }

    return res.json({
      message: "Posisi terbaru berhasil diambil",
      data: position,
    });
  } catch (error) {
    console.error("Gagal mengambil posisi:", error);

    return res.status(500).json({
      message: "Gagal mengambil posisi dari database",
    });
  }
});

export default router;
