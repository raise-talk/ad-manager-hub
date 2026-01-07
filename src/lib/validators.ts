import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const clientSchema = z.object({
  type: z.enum(["BROKER", "REAL_ESTATE", "OTHER"]),
  name: z.string().min(2),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  monthlyFee: z.number().int().nonnegative(),
  dueDay: z.number().int().min(1).max(31).optional(),
  lastPaymentAt: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  amount: z.number().int().nonnegative(),
  paidAt: z.string().datetime().optional(),
});

export const goalSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  targetClients: z.number().int().nonnegative(),
  targetRevenue: z.number().int().nonnegative(),
});

export const alertConfigSchema = z.object({
  budgetLowThreshold: z.number().int().nonnegative(),
  enabled: z.boolean(),
});

export const adAccountLinkSchema = z.object({
  adAccountIds: z.array(z.string()).min(1),
  primaryAdAccountId: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  profileImage: z
    .string()
    .url()
    .or(z.string().startsWith("data:image/"))
    .optional(),
});

export const preferencesSchema = z.object({
  timezone: z.string().min(1),
  currency: z.string().min(1),
});

export const businessSchema = z.object({
  name: z.string().min(1),
  logo: z
    .string()
    .url()
    .or(z.string().startsWith("data:image/"))
    .optional(),
});
