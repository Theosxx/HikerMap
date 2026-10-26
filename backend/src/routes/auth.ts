
import bcrypt from "bcryptjs";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  username: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(100),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(72),
});

function createToken(userId: number) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET belum dikonfigurasi");
  }

  return jwt.sign({ sub: String(userId) }, secret, {
    expiresIn: "1h",
    issuer: "hikermap-api",
    audience: "hikermap-mobile",
  });
}

// REGISTER
router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Data registrasi tidak valid",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { username, email, password } = parsed.data;

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password maksimal 72 byte",
      });
    }

    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          { email: email.toLowerCase() },
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username atau email sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: {
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Registrasi berhasil",
      user,
    });
  } catch (error: any) {
    // Menangani kemungkinan dua registrasi bersamaan
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "Username atau email sudah digunakan",
      });
    }

    next(error);
  }
});

// LOGIN
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Username/email dan password wajib diisi",
      });
    }

    const { identifier, password } = parsed.data;

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(401).json({
        message: "Kredensial tidak valid",
      });
    }

    const normalized = identifier.toLowerCase();

    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: normalized },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Kredensial tidak valid",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Kredensial tidak valid",
      });
    }

    const token = createToken(user.id);

    return res.status(200).json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
