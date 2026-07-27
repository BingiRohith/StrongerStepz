import { Types } from "mongoose";
import { Registration, type RegistrationDocument } from "@/models/Registration";
import { BaseRepository } from "@/repositories/BaseRepository";

export class RegistrationRepository extends BaseRepository<RegistrationDocument> {
  constructor() {
    super(Registration);
  }

  async findByWorkshopAndEmail(workshopId: string, email: string): Promise<RegistrationDocument | null> {
    return this.findOne({ workshopId: new Types.ObjectId(workshopId), email });
  }

  /** Backs the "same mobile number can't register twice for the same workshop" rule. */
  async findByWorkshopAndPhone(workshopId: string, phone: string): Promise<RegistrationDocument | null> {
    return this.findOne({ workshopId: new Types.ObjectId(workshopId), phone });
  }

  async findByWorkshop(workshopId: string): Promise<RegistrationDocument[]> {
    return this.findMany({ workshopId: new Types.ObjectId(workshopId) });
  }

  /** Backs the workshop `registrationLimit` capacity check. */
  async countByWorkshop(workshopId: string): Promise<number> {
    return this.count({ workshopId: new Types.ObjectId(workshopId) });
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<RegistrationDocument | null> {
    return this.findOne({ registrationNumber });
  }
}
