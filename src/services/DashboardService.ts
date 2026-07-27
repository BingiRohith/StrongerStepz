import { WorkshopRepository } from "@/repositories/WorkshopRepository";
import { RegistrationRepository } from "@/repositories/RegistrationRepository";
import type { WorkshopDocument } from "@/models/Workshop";

export interface DashboardSummary {
  totalWorkshops: number;
  activeWorkshop: WorkshopDocument | null;
  totalRegistrations: number;
  pendingPayments: number;
  /** null when the active workshop has no registrationLimit (unlimited seats), or there's no active workshop. */
  remainingSeats: number | null;
}

/** Aggregates across Workshop + Registration for the admin dashboard tiles — doesn't belong to either single-entity service. */
export class DashboardService {
  constructor(
    protected readonly workshopRepository: WorkshopRepository = new WorkshopRepository(),
    protected readonly registrationRepository: RegistrationRepository = new RegistrationRepository()
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const [totalWorkshops, activeWorkshop, totalRegistrations, pendingPayments] = await Promise.all([
      this.workshopRepository.count(),
      this.workshopRepository.findActive(),
      this.registrationRepository.count(),
      this.registrationRepository.count({ status: "pending_payment" }),
    ]);

    let remainingSeats: number | null = null;
    if (activeWorkshop && activeWorkshop.registrationLimit != null) {
      const registeredForActive = await this.registrationRepository.countByWorkshop(activeWorkshop._id.toString());
      remainingSeats = Math.max(activeWorkshop.registrationLimit - registeredForActive, 0);
    }

    return { totalWorkshops, activeWorkshop, totalRegistrations, pendingPayments, remainingSeats };
  }
}
