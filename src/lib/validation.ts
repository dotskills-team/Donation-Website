import { z } from "zod";

// export function normalizeMobile(v: string) {
//   const s = v.replace(/[\s\-()]/g, "");
//   if (s.startsWith("+880")) return "0" + s.slice(4);
//   if (s.startsWith("880")) return "0" + s.slice(3);
//   return s;
// }
// export const MOBILE_RE = /^01[3-9]\d{8}$/;

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
// const mobile = z
//   .string()
//   .trim()
//   .transform(normalizeMobile)
//   .refine((v) => MOBILE_RE.test(v), "Enter a valid Bangladeshi mobile number (e.g. 01712345678)");
export function normalizeMobile(v: string) {
  const s = v.replace(/[\s\-()]/g, "");
  if (s.startsWith("+880")) return "0" + s.slice(4);
  if (s.startsWith("880")) return "0" + s.slice(3);
  return s;
}
export const MOBILE_RE = /^\d{11}$/;

const mobile = z
  .string()
  .trim()
  .transform(normalizeMobile)
  .refine((v) => MOBILE_RE.test(v), "মোবাইল নম্বর ঠিক ১১ ডিজিটের হতে হবে");

const amount = z.coerce
  .number({ error: "Enter a valid amount" })
  .positive("Amount must be greater than 0")
  .max(100_000_000, "Amount is too large")
  .transform((n) => Math.round(n * 100) / 100);
const method = z.enum(["CASH", "BKASH", "NAGAD", "BANK", "OTHER"], { error: "Choose a collection method" });
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));
const name = z.string().trim().min(2, "Name is too short").max(80, "Name is too long");
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
// const password = z
//   .string()
//   .min(8, "Use at least 8 characters")
//   .max(100)
//   .regex(/[A-Za-z]/, "Include at least one letter")
//   .regex(/\d/, "Include at least one number");
const password = z
  .string()
  .min(4, "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে")
  .max(100, "পাসওয়ার্ড অনেক বড়");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(100),
});

const notFuture = (d: Date | undefined) => !d || d.getTime() <= Date.now() + 86_400_000;

export const donationCreateSchema = z.object({
  donorName: name,
  donorMobile: mobile,
  donorEmail: z.string().trim().toLowerCase().email("Invalid email").optional().or(z.literal("")).transform((v) => v || undefined),
  amount,
  collectionMethod: method,
  transactionId: optionalText(80),
  donationDate: z.coerce.date().optional().refine(notFuture, "Date cannot be in the future"),
  note: optionalText(500),
  anonymous: z.boolean().optional().default(false),
  clientKey: z.string().min(8).max(80).optional(),
  requestId: objectId.optional(),
});
export type DonationCreateInput = z.infer<typeof donationCreateSchema>;

export const donationUpdateSchema = z
  .object({
    amount: amount.optional(),
    collectionMethod: method.optional(),
    transactionId: optionalText(80),
    donationDate: z.coerce.date().optional().refine(notFuture, "Date cannot be in the future"),
    note: optionalText(500),
    anonymous: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Nothing to update");
export type DonationUpdateInput = z.infer<typeof donationUpdateSchema>;

export const cancelSchema = z.object({ reason: optionalText(300) });

export const donationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  q: z.string().trim().max(80).optional(),
  from: ymd.optional(),
  to: ymd.optional(),
  moderatorId: objectId.optional(),
  method: method.optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
});
export type DonationQuery = z.infer<typeof donationQuerySchema>;

export const requestCreateSchema = z.object({
  name,
  mobile,
  amount,
  note: optionalText(500),
});

export const rangeSchema = z.object({
  range: z.enum(["today", "7d", "month", "custom", "all"]).default("all"),
  from: ymd.optional(),
  to: ymd.optional(),
});

export const customReportSchema = z.object({
  from: ymd.optional(),
  to: ymd.optional(),
  moderatorId: objectId.optional(),
  method: method.optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).default("CONFIRMED"),
});

export const moderatorCreateSchema = z.object({
  name,
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  mobile,
  password,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const moderatorUpdateSchema = z
  .object({
    name: name.optional(),
    email: z.string().trim().toLowerCase().email("Enter a valid email").optional(),
    mobile: mobile.optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Nothing to update");

export const passwordResetSchema = z.object({ password });

const campaignFields = {
  title: z.string().trim().min(3, "Title is too short").max(160),
  description: z.string().trim().max(4000),
  targetAmount: z.coerce.number().positive("Target must be greater than 0").max(1_000_000_000),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CLOSED"]),
  startDate: z.coerce.date().optional().or(z.literal("").transform(() => undefined)),
  endDate: z.coerce.date().optional().or(z.literal("").transform(() => undefined)),
};
export const campaignSchema = z.object({
  ...campaignFields,
  description: campaignFields.description.default(""),
  status: campaignFields.status.default("DRAFT"),
});
// Explicit (no defaults) so a PATCH can never silently reset omitted fields.
export const campaignUpdateSchema = z.object(campaignFields).partial();

export const donorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  q: z.string().trim().max(80).optional(),
});

export const contactSchema = z.object({
  phone: z.string().trim().max(40).default(""),
  email: z.string().trim().max(120).default(""),
  address: z.string().trim().max(300).default(""),
  facebook: z.string().trim().max(200).default(""),
});
