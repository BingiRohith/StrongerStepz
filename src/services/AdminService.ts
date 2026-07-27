import { AdminUserRepository } from "@/repositories/AdminUserRepository";
import type { AdminUserDocument } from "@/models/AdminUser";
import { signAdminToken } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ValidationError } from "@/errors/ValidationError";
import type { AdminLoginInput, CreateAdminUserInput } from "@/validators/admin.schema";

export interface AdminLoginResult {
  token: string;
  admin: { id: string; email: string; role: string };
}

/** Business-logic layer for admin accounts — credential verification, JWT issuing, account creation. */
export class AdminService {
  constructor(protected readonly repository: AdminUserRepository = new AdminUserRepository()) {}

  async login(input: AdminLoginInput): Promise<AdminLoginResult> {
    const admin = await this.repository.findByEmail(input.email);
    // Same message whether the email or password is wrong — don't help an attacker enumerate accounts.
    if (!admin || !(await verifyPassword(input.password, admin.passwordHash))) {
      throw new ValidationError("Invalid email or password");
    }

    await this.repository.updateById(admin._id.toString(), { lastLoginAt: new Date() });

    const token = await signAdminToken({ sub: admin._id.toString(), email: admin.email, role: admin.role });
    return { token, admin: { id: admin._id.toString(), email: admin.email, role: admin.role } };
  }

  async createAdminUser(input: CreateAdminUserInput): Promise<AdminUserDocument> {
    const passwordHash = await hashPassword(input.password);
    return this.repository.create({ email: input.email, passwordHash, role: input.role ?? "admin" });
  }
}
