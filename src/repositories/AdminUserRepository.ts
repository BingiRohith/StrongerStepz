import { AdminUser, type AdminUserDocument } from "@/models/AdminUser";
import { BaseRepository } from "@/repositories/BaseRepository";

export class AdminUserRepository extends BaseRepository<AdminUserDocument> {
  constructor() {
    super(AdminUser);
  }

  async findByEmail(email: string): Promise<AdminUserDocument | null> {
    return this.findOne({ email });
  }
}
