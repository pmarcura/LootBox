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
};

const mockTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  getDbWithAuth: vi.fn(),
  db: {},
}));

describe("fuseCardAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const server = await import("@/lib/supabase/server");
    vi.mocked(server.createSupabaseServerClient).mockResolvedValue(mockSupabase as never);
    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.getDbWithAuth).mockResolvedValue({
      db: { transaction: mockTransaction } as never,
      userId: "user-1",
    });
  });

  it("returns error when form data is invalid (missing ids)", async () => {
    const formData = new FormData();
    const result = await fuseCardAction({ status: "idle" }, formData);
    expect(result).toEqual({ status: "error", message: "Selecione 1 vessel e 1 strain." });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns error when user is not authenticated", async () => {
    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.getDbWithAuth).mockRejectedValue(new Error("not_authenticated"));
    const formData = new FormData();
    formData.set("vesselInventoryId", "00000000-0000-4000-a000-000000000001");
    formData.set("userStrainId", "00000000-0000-4000-a000-000000000002");
    const result = await fuseCardAction({ status: "idle" }, formData);
    expect(result).toEqual({ status: "error", message: "Faça login para fundir." });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("maps vessel_not_found_or_used to friendly message", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockTransaction.mockRejectedValue(new Error("vessel_not_found_or_used"));
    const formData = new FormData();
    formData.set("vesselInventoryId", "00000000-0000-4000-a000-000000000001");
    formData.set("userStrainId", "00000000-0000-4000-a000-000000000002");

    const result = await fuseCardAction({ status: "idle" }, formData);
    expect(result).toEqual({
      status: "error",
      message: "Monstro não encontrado ou já usado em fusão.",
    });
  });

  it("returns success when transaction returns card", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockTransaction.mockImplementation(
      async () => ({
        tokenId: "abc123",
        finalHp: 10,
        finalAtk: 5,
        manaCost: 3,
        keyword: "OVERCLOCK",
      }),
    );
    const formData = new FormData();
    formData.set("vesselInventoryId", "00000000-0000-4000-a000-000000000001");
    formData.set("userStrainId", "00000000-0000-4000-a000-000000000002");

    const result = await fuseCardAction({ status: "idle" }, formData);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.tokenId).toBe("abc123");
      expect(result.finalHp).toBe(10);
      expect(result.finalAtk).toBe(5);
      expect(result.manaCost).toBe(3);
      expect(result.keyword).toBe("OVERCLOCK");
    }
  });
});
