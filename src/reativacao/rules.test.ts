import {
  calculateBlockedDays,
  classifyBlockedCustomer,
  hasConfirmedPayment,
  hasOpenInvoice,
  isLoginBlocked,
  nextFunnelState,
} from "./rules";

describe("reativacao rules", () => {
  it("calcula dias bloqueados", () => {
    expect(calculateBlockedDays("2026-09-02", new Date("2026-09-19T12:00:00Z"))).toBe(17);
  });

  it("classifica faixas de bloqueio", () => {
    expect(classifyBlockedCustomer(3)).toBe("LESS_THAN_7_DAYS");
    expect(classifyBlockedCustomer(10)).toBe("BETWEEN_7_AND_15_DAYS");
    expect(classifyBlockedCustomer(17)).toBe("MORE_THAN_15_DAYS");
    expect(classifyBlockedCustomer(null)).toBe("UNKNOWN");
  });

  it("detecta login bloqueado e faturas", () => {
    expect(isLoginBlocked({ status: "B" } as any)).toBe(true);
    expect(hasOpenInvoice([{ status: "A" } as any])).toBe(true);
    expect(hasConfirmedPayment([{ status: "P" } as any])).toBe(true);
  });

  it("prioriza handoff humano no funil", () => {
    expect(nextFunnelState({ blocked: true, openInvoice: true, paymentConfirmed: false, requiresHuman: true })).toBe(
      "HUMAN_ATTENDANCE"
    );
  });
});
