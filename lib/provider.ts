export type ProviderProfile = {
  id: string;
  fullName: string;
  email: string;
  providerDetails: {
    id: string;
    serviceType: string;
    serviceArea: string;
    basePrice: number;
  } | null;
};

export type ServiceOffering = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
};

export type ProviderSlot = {
  id: string;
  serviceId: string | null;
  startsAt: string;
  endsAt: string;
  status: "available" | "held" | "booked" | "unavailable";
};

export type ProviderRescheduleRequest = {
  id: string;
  bookingId: string;
  customerUserId: string;
  serviceId: string;
  oldStartsAt: string;
  startsAt: string;
  endsAt: string;
  quotedPrice: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type ProviderBooking = {
  id: string;
  customerUserId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: "held" | "confirmed" | "rejected" | "cancelled" | "expired";
  holdExpiresAt: string | null;
  createdAt: string;
};

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
