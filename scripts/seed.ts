import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { Campaign } from "@/models/Campaign";
import { Donor } from "@/models/Donor";
import { Donation } from "@/models/Donation";
import { DonationRequest } from "@/models/DonationRequest";
import { AuditLog } from "@/models/AuditLog";
import { Setting } from "@/models/Setting";
import mongoose from "mongoose";

async function main() {
  await connectDB();
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@12345";

  if (!(await User.findOne({ email }))) {
    await User.create({ name: "Administrator", email, mobile: "01700000000", passwordHash: await bcrypt.hash(password, 12), role: "ADMIN", status: "ACTIVE" });
    console.log(`Created admin ${email}`);
  } else {
    console.log("Admin already exists, skipped");
  }

  if (!(await Campaign.findOne({ status: "ACTIVE" }))) {
    await Campaign.create({
      title: "আমাদের লক্ষ্য পূরণে আপনার সহযোগিতা করুন",
      description: "এই campaign-এর বিস্তারিত এখানে লিখুন। Admin dashboard থেকে এটি পরিবর্তন করা যাবে।",
      targetAmount: 500000,
      status: "ACTIVE",
      startDate: new Date(),
    });
    console.log("Created sample active campaign");
  }

  await Promise.all([User, Campaign, Donor, Donation, DonationRequest, AuditLog, Setting].map((m) => m.syncIndexes()));
  console.log("Indexes synced");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
