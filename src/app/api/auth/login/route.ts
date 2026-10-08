import { route, ok, parseBody } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { HttpError } from "@/lib/errors";
import { User } from "@/models/User";
import { recordAudit } from "@/services/audit.service";

let dummy: Promise<string> | undefined;

export const POST = route(async (req) => {
  const ip = clientIp(req);
  const body = await parseBody(req, loginSchema);
  rateLimit(`login-ip:${ip}`, 40, 15 * 60_000);
  rateLimit(`login:${ip}:${body.email}`, 8, 15 * 60_000);

  await connectDB();
  const user = await User.findOne({ email: body.email }).select("+passwordHash name email role status");
  // Always run a bcrypt compare so response time does not reveal whether the email exists.
  const hash = user?.passwordHash ?? (await (dummy ??= hashPassword("not-a-real-password")));
  const valid = await verifyPassword(body.password, hash);
  if (!user || !valid) throw new HttpError(401, "Incorrect email or password");
  if (user.status !== "ACTIVE") throw new HttpError(403, "This account is inactive. Contact an administrator.");

  await startSession(String(user._id));
  await recordAudit({ userId: String(user._id), action: "LOGIN", entity: "User", entityId: String(user._id), metadata: { ip } });
  return ok({ name: user.name, role: user.role });
});
