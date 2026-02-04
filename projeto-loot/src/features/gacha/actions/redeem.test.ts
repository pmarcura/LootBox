import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeCheckDigit } from "../checksum";
import { redeemAction } from "./redeem";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/db", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/db")>();
  return {
    ...mod,
    getDbWithAuth: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: () => null,
  }),
}));

const mockSupabase = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
};

function validCode(): string {
  const data = "ABCDEFGHJKM";
  return data + computeCheckDigit(data);
}

describe("redeemAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const server = await import("@/lib/supabase/server");
    vi.mocked(server.createSupabaseServerClient).mockResolvedValue(mockSupabase as never);
    const { getDbWithAuth } = await import("@/lib/db");
    vi.mocked(getDbWithAuth).mockImplementation(async () => {
      const supabase = await import("@/lib/supabase/server").then((m) =>
        m.createSupabaseServerClient()
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");
      return {
        db: { transaction: async () => ({}) } as never,
        userId: user.id,
      };
    });
  });

  it("returns error when code fails validation (Zod)", async () => {
    const formData = new FormData();
    formData.set("code", "tooshort");
    const result = await redeemAction({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    expect("message" in result && result.message).toBeTruthy();
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("returns error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const formData = new FormData();
    formData.set("code", validCode());
    const result = await redeemAction({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.message).toBe("Faça login para resgatar.");
  });

  it("maps code_not_found error to friendly message", async () => {
    const { getDbWithAuth } = await import("@/lib/db");
    // Simula falha na transação (ex.: código não existe) para exercitar mapErrorToMessage
    vi.mocked(getDbWithAuth).mockResolvedValueOnce({
      db: {
        transaction: vi.fn().mockRejectedValue(new Error("code_not_found")),
      } as never,
      userId: "user-1",
    });
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const formData = new FormData();
    formData.set("code", validCode());
    const result = await redeemAction({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.message).toBe("Código não encontrado.");
  });
});
