import { describe, it, expect, vi, beforeEach } from "vitest";
import { fuseCardAction } from "./fuse";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockSupabase = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
};

describe("fuseCardAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const server = await import("@/lib/supabase/server");
    vi.mocked(server.createSupabaseServerClient).mockResolvedValue(mockSupabase as never);
  });

  it("returns error when form data is invalid (missing ids)", async () => {
    const formData = new FormData();
    const result = await fuseCardAction({ status: "idle" }, formData);
    expect(result).toEqual({ status: "error", message: "Selecione 1 vessel e 1 strain." });
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("returns error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const formData = new FormData();
    formData.set("vesselInventoryId", "00000000-0000-4000-a000-000000000001");
    formData.set("userStrainId", "00000000-0000-4000-a000-000000000002");
    const result = await fuseCardAction({ status: "idle" }, formData);
    expect(result).toEqual({ status: "error", message: "Faça login para fundir." });
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("maps RPC errors to friendly messages", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: "vessel_not_found_or_used" } });
    const formData = new FormData();
    formData.set("vesselInventoryId", "00000000-0000-4000-a000-000000000001");
    formData.set("userStrainId", "00000000-0000-4000-a000-000000000002");

    const result = await fuseCardAction({ status: "idle" }, formData);
    expect(result).toEqual({
      status: "error",
      message: "Vessel não encontrado ou já usado em fusão.",
    });
  });

  it("returns success when RPC returns valid row", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValue({
      data: [
        {
          token_id: "abc123",
          final_hp: 10,
          final_atk: 5,
          mana_cost: 3,
          keyword: "OVERCLOCK",
        },
      ],
      error: null,
    });
    const formData = new FormData();
    formData.set("vesselInventoryId", "00000000-0000-4000-a000-000000000001");
    formData.set("userStrainId", "00000000-0000-4000-a000-000000000002");

    const result = await fuseCardAction({ status: "idle" }, formData);
    expect(result).toEqual({
      status: "success",
      tokenId: "abc123",
      finalHp: 10,
      finalAtk: 5,
      manaCost: 3,
      keyword: "OVERCLOCK",
    });
  });
});
