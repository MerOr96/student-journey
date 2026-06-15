import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';

function generateReferralCode(): string {
  return randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
}

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-me';

// ─── Validation Schemas ─────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  velayat: z.string().optional(),
  language: z.enum(['RU', 'TK', 'ru', 'tk']).transform(v => v.toUpperCase() as 'RU' | 'TK').default('RU'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Helpers ────────────────────────────────────────────────────
function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

function formatUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    velayat: user.velayat,
    role: user.role === 'ADMIN' ? 'admin' : 'user',
    appRole: user.appRole === 'STUDENT' ? 'student' : 'applicant',
    applicationStatus: user.applicationStatus || 'NEW',
    language: user.language.toLowerCase(),
    crmApplicantId: user.crmApplicantId ?? null,
    crmStudentId: user.crmStudentId ?? null,
    chosenFacultyName: user.chosenFacultyName ?? null,
    chosenSpecialtyName: user.chosenSpecialtyName ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// ─── POST /register ─────────────────────────────────────────────
router.post('/register', async (req, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { email, password, fullName, phone, birthDate, velayat, language } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        success: false,
        data: null,
        message: 'User with this email already exists',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user, player profile, and application in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          phone,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          velayat,
          language: language as any,
          role: 'USER',
        },
      });

      await tx.playerProfile.create({
        data: {
          userId: newUser.id,
          xp: 0,
          level: 'beginner',
          referralCode: generateReferralCode(),
        },
      });

      return newUser;
    });

    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({
      success: true,
      data: {
        ...tokens,
        user: formatUser(user),
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, data: null, message: 'Registration failed' });
  }
});

// ─── POST /internal/bulk-register ─────────────────────────────
const internalRegisterSchema = z.object({
  users: z.array(z.object({
    email: z.string(),
    password: z.string(),
    fullName: z.string(),
    crmStudentId: z.number().optional(),
    appRole: z.enum(['APPLICANT', 'STUDENT']).default('STUDENT')
  }))
});

router.post('/internal/bulk-register', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = internalRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid payload' });
      return;
    }

    const createdUsers = [];
    for (const u of parsed.data.users) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) continue; // Skip existing

      const passwordHash = await bcrypt.hash(u.password, 12);
      const newUser = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: u.email,
            passwordHash,
            fullName: u.fullName,
            role: 'USER',
            appRole: u.appRole,
            crmStudentId: u.crmStudentId,
          },
        });
        await tx.playerProfile.create({
          data: {
            userId: created.id,
            xp: 0,
            level: 'beginner',
            referralCode: generateReferralCode(),
          },
        });
        return created;
      });
      createdUsers.push(newUser.email);
    }

    res.status(200).json({ success: true, createdCount: createdUsers.length, createdUsers });
  } catch (error) {
    console.error('Bulk register error:', error);
    res.status(500).json({ success: false, message: 'Bulk registration failed' });
  }
});

// ─── POST /login ────────────────────────────────────────────────
router.post('/login', async (req, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, data: null, message: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ success: false, data: null, message: 'Invalid credentials' });
      return;
    }

    const tokens = generateTokens(user.id, user.role);

    res.json({
      success: true,
      data: {
        ...tokens,
        user: formatUser(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, data: null, message: 'Login failed' });
  }
});

// ─── POST /refresh ──────────────────────────────────────────────
router.post('/refresh', async (req, res: Response) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Refresh token is required',
      });
      return;
    }

    const { refreshToken } = parsed.data;

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
      role: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    res.status(401).json({ success: false, data: null, message: 'Invalid refresh token' });
  }
});

// ─── GET /me ────────────────────────────────────────────────────
const DJANGO_CRM_URL = process.env.DJANGO_CRM_URL || 'http://localhost:8000';

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    // Если абитуриент уже передан в Django — проверяем, не зачислили ли его там в студенты
    if (user.appRole === 'APPLICANT' && user.crmApplicantId) {
      try {
        const fetchPromise = fetch(
          `${DJANGO_CRM_URL}/api/status/?email=${encodeURIComponent(user.email)}`,
        );
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));

        const crmRes = await Promise.race([fetchPromise, timeoutPromise]);

        if (crmRes && 'ok' in crmRes && crmRes.ok) {
          const crmData = (await crmRes.json()) as { is_converted?: boolean; student_id?: number; status?: string };
          if (crmData.status) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                applicationStatus: crmData.status.toUpperCase(),
                appRole: crmData.is_converted ? 'STUDENT' : 'APPLICANT',
                ...(crmData.student_id ? { crmStudentId: crmData.student_id } : {}),
              },
            });
          } else if (crmData.is_converted) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                appRole: 'STUDENT',
                ...(crmData.student_id ? { crmStudentId: crmData.student_id } : {}),
              },
            });
          }
        }
      } catch {
        // Django недоступен — не блокируем ответ, отдаём что есть
      }
    }

    res.json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get user' });
  }
});

// ─── POST /logout ──────────────────────────────────────────────
router.post('/logout', authenticate, async (_req: AuthRequest, res: Response) => {
  // With JWT, server-side invalidation requires a blacklist.
  // For now, we signal the client to drop its tokens.
  res.json({
    success: true,
    data: null,
    message: 'Logged out successfully',
  });
});

export default router;
