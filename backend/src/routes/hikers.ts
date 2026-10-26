
import { Router, type NextFunction, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const hikerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(20),
  gender: z.enum(["MALE", "FEMALE"]),
  emergencyContact: z.string().trim().min(1).max(20),
  status: z.enum(["aktif", "selesai", "nonaktif"]).default("aktif"),
});

function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return res.status(401).json({
      message: "Token autentikasi tidak tersedia",
    });
  }

  try {
    const payload = jwt.verify(token, secret, {
      issuer: "hikermap-api",
      audience: "hikermap-mobile",
    }) as JwtPayload;

    if (!payload.sub || !Number.isInteger(Number(payload.sub))) {
      return res.status(401).json({
        message: "Token tidak valid",
      });
    }

    next();
  } catch {
    return res.status(401).json({
      message: "Token tidak valid atau sudah kedaluwarsa",
    });
  }
}

// GET /api/hikers
router.get("/", authenticate, async (_req, res, next) => {
  try {
    const hikers = await prisma.hiker.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      message: "Daftar pendaki berhasil diambil",
      data: hikers,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/hikers
router.post("/", authenticate, async (req, res, next) => {
  try {
    const parsed = hikerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Data pendaki tidak valid",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const hiker = await prisma.hiker.create({
      data: parsed.data,
    });

    return res.status(201).json({
      message: "Pendaki berhasil ditambahkan",
      data: hiker,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        message: "Nama atau alamat pendaki sudah terdaftar",
      });
    }

    next(error);
  }
});

export default router;
