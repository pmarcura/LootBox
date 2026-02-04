import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeCheckDigit } from "../checksum";
import { redeemAction } from "./redeem";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
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

  it("maps RPC error code_not_found to friendly message", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: "code_not_found" } });
    const formData = new FormData();
    formData.set("code", validCode());
    const result = await redeemAction({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.message).toBe("Código não encontrado.");
  });
});
