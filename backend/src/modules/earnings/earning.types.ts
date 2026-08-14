export interface RevenueQuery { from: string; to: string; fromDate: Date; toExclusive: Date; status?: "PENDING" | "AVAILABLE" | "PAID" | "REVERSED"; page: number; limit: number }
