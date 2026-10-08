import { connectDB } from "@/lib/mongodb";
import { Setting } from "@/models/Setting";

export interface Contact {
  phone: string;
  email: string;
  address: string;
  facebook: string;
}
const EMPTY: Contact = { phone: "", email: "", address: "", facebook: "" };

export async function getContact(): Promise<Contact> {
  await connectDB();
  const s = await Setting.findOne({ key: "contact" }).lean<{ value: Partial<Contact> } | null>();
  return { ...EMPTY, ...(s?.value ?? {}) };
}

export async function setContact(c: Contact) {
  await connectDB();
  await Setting.updateOne({ key: "contact" }, { value: c }, { upsert: true });
  return c;
}
