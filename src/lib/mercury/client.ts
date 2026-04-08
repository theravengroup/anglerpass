import "server-only";

/**
 * Mercury Banking API client.
 *
 * Handles authentication, pagination, and rate-limit awareness.
 * Mercury rate limit: 2,000 requests per 5 minutes.
 *
 * Docs: https://docs.mercury.com/reference
 */

const MERCURY_BASE_URL = "https://api.mercury.com/api/v1";

function getApiKey(): string {
  const key = process.env.MERCURY_API_KEY;
  if (!key) throw new Error("Missing MERCURY_API_KEY environment variable");
  return key;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ─── Types ──────────────────────────────────────────────────────────

export interface MercuryAccount {
  id: string;
  name: string;
  accountNumber: string;
  routingNumber: string;
  type: "checking" | "savings" | "treasury";
  currentBalance: number;
  availableBalance: number;
  status: string;
}

export interface MercuryTransaction {
  id: string;
  accountId: string;
  amount: number;
  status: "pending" | "sent" | "cancelled" | "failed" | "reversed";
  counterpartyName: string | null;
  bankDescription: string | null;
  externalMemo: string | null;
  note: string | null;
  createdAt: string;
  postedAt: string | null;
  merchantCategoryCode: string | null;
}

interface MercuryPaginatedResponse<T> {
  total: number;
  transactions?: T[];
  accounts?: T[];
}

// ─── Error Handling ─────────────────────────────────────────────────

export class MercuryApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string
  ) {
    super(`Mercury API error ${status}: ${statusText}`);
    this.name = "MercuryApiError";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

async function mercuryFetch<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${MERCURY_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new MercuryApiError(res.status, res.statusText, body);
  }

  return res.json() as Promise<T>;
}

// ─── Accounts ───────────────────────────────────────────────────────

/** List all Mercury accounts. */
export async function listAccounts(): Promise<MercuryAccount[]> {
  const data = await mercuryFetch<{ accounts: MercuryAccount[] }>(
    "/accounts"
  );
  return data.accounts ?? [];
}

/** Get a single Mercury account by ID. */
export async function getAccount(
  accountId: string
): Promise<MercuryAccount> {
  return mercuryFetch<MercuryAccount>(`/account/${accountId}`);
}

// ─── Transactions ───────────────────────────────────────────────────

export interface ListTransactionsParams {
  accountId: string;
  /** ISO 8601 date (YYYY-MM-DD) — inclusive start. */
  start?: string;
  /** ISO 8601 date (YYYY-MM-DD) — inclusive end. */
  end?: string;
  /** Number of results per page (max 500). */
  limit?: number;
  /** Pagination offset. */
  offset?: number;
  /** Filter by status. */
  status?: "pending" | "sent" | "cancelled" | "failed";
  /** Search term. */
  search?: string;
}

/** List transactions for an account with pagination. */
export async function listTransactions(
  opts: ListTransactionsParams
): Promise<{ transactions: MercuryTransaction[]; total: number }> {
  const params: Record<string, string> = {};
  if (opts.start) params.start = opts.start;
  if (opts.end) params.end = opts.end;
  if (opts.limit) params.limit = String(opts.limit);
  if (opts.offset) params.offset = String(opts.offset);
  if (opts.status) params.status = opts.status;
  if (opts.search) params.search = opts.search;

  const data = await mercuryFetch<MercuryPaginatedResponse<MercuryTransaction>>(
    `/account/${opts.accountId}/transactions`,
    params
  );

  return {
    transactions: data.transactions ?? [],
    total: data.total ?? 0,
  };
}

/** Fetch all transactions (auto-paginate). Respects rate limits by batching 500 at a time. */
export async function listAllTransactions(
  opts: Omit<ListTransactionsParams, "limit" | "offset">
): Promise<MercuryTransaction[]> {
  const pageSize = 500;
  let offset = 0;
  const all: MercuryTransaction[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { transactions, total } = await listTransactions({
      ...opts,
      limit: pageSize,
      offset,
    });
    all.push(...transactions);
    offset += pageSize;
    if (offset >= total || transactions.length < pageSize) break;
  }

  return all;
}

/** Get a single transaction by ID. */
export async function getTransaction(
  accountId: string,
  transactionId: string
): Promise<MercuryTransaction> {
  return mercuryFetch<MercuryTransaction>(
    `/account/${accountId}/transaction/${transactionId}`
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Check if a Mercury transaction looks like a Stripe deposit. */
export function isStripeDeposit(txn: MercuryTransaction): boolean {
  const cp = (txn.counterpartyName ?? "").toUpperCase();
  const desc = (txn.bankDescription ?? "").toUpperCase();
  return (
    cp.includes("STRIPE") ||
    desc.includes("STRIPE") ||
    desc.includes("STRIPE PAYMENTS")
  );
}

/** Format Mercury amount (cents in some endpoints, dollars in others). */
export function toDecimal(amount: number): number {
  // Mercury API returns amounts in dollars (not cents)
  return Math.round(amount * 100) / 100;
}
