import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { Card } from "../types";
import { calculateUtilization, updateBalanceFromRemaining, formatCurrency } from "../utils";
import { upsertFromCard } from "../cloudflare";

export function QuickUpdateBalanceForm({ card, onUpdated }: { card: Card; onUpdated: () => void }) {
  const { pop } = useNavigation();
  const [availableCredit, setAvailableCredit] = useState("");
  const [amountToPay, setAmountToPay] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isLoading, setIsLoading] = useState(false);

  function formatIndianNumber(raw: string): string {
    const digits = (raw || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length <= 3) return digits;
    const last3 = digits.slice(-3);
    let rest = digits.slice(0, -3);
    let out = "";
    while (rest.length > 2) {
      out = "," + rest.slice(-2) + out;
      rest = rest.slice(0, -2);
    }
    if (rest.length) out = rest + out;
    return (out ? out + "," : "") + last3;
  }

  function unformatNumber(raw: string): string {
    return (raw || "").replace(/[^0-9]/g, "");
  }

  const totalLimit = Number(card.totalLimit || 0);
  const avail = Number(unformatNumber(availableCredit) || 0);
  const outstanding = totalLimit > 0 ? Math.max(0, totalLimit - Math.max(0, avail)) : 0;
  const pct = calculateUtilization(totalLimit, outstanding);

  function validate(): boolean {
    const next: Record<string, string | undefined> = {};
    if (!card.totalLimit || card.totalLimit <= 0) next.availableCredit = "Card missing maximum credit limit";
    const availVal = Number(unformatNumber(availableCredit));
    if (availableCredit === "" || isNaN(availVal) || availVal < 0) next.availableCredit = "Enter available credit";
    if (availVal > (card.totalLimit || 0)) next.availableCredit = "Cannot exceed maximum credit limit";
    if (availVal > Number.MAX_SAFE_INTEGER) next.availableCredit = "Value is too large";
    const pay = Number(unformatNumber(amountToPay));
    if (amountToPay !== "" && (isNaN(pay) || pay < 0)) next.amountToPay = "Invalid amount to pay";
    if (pay > Number.MAX_SAFE_INTEGER) next.amountToPay = "Value is too large";
    setErrors(next);
    return Object.values(next).every((v) => v === undefined);
  }

  async function handleSubmit() {
    try {
      if (!validate()) {
        await showToast({ style: Toast.Style.Failure, title: "Fix input errors" });
        return;
      }
      setIsLoading(true);
      await updateBalanceFromRemaining(
        card.id,
        Number(unformatNumber(availableCredit)),
        Number(unformatNumber(amountToPay) || 0)
      );
      // Push update to Cloudflare Worker (best-effort)
      try { await upsertFromCard(card); } catch {}
      await showToast({ style: Toast.Style.Success, title: "Balance updated" });
      onUpdated();
      pop();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "Update failed", message: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Manual Balance Update"
      actions={
        <ActionPanel>
          <Action title="Update" onAction={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text={`${card.bankName} - ${card.cardName}`} />
      {card.totalLimit && (
        <Form.Description text={`Maximum Credit Limit: ${formatCurrency(Number(card.totalLimit))}`} />
      )}
      <Form.TextField
        id="availableCredit"
        title="Available Credit"
        placeholder="e.g. 75,000"
        value={availableCredit}
        onChange={(value) => setAvailableCredit(formatIndianNumber(value))}
        error={errors.availableCredit}
      />
      <Form.Description text="Indian numbering (lakh/crore). Commas are ignored on save. Negative values are not allowed." />
      <Form.TextField
        id="amountToPay"
        title="Amount to Pay"
        placeholder="e.g. 5,000"
        value={amountToPay}
        onChange={(value) => setAmountToPay(formatIndianNumber(value))}
        error={errors.amountToPay}
      />
      <Form.Description text="Indian numbering format. Commas are ignored on save. Negative values are not allowed." />
      <Form.Separator />
      <Form.Description text={`Outstanding Balance: ${formatCurrency(outstanding)}`} />
      <Form.Description text={`Available Credit: ${formatCurrency(Math.max(0, totalLimit - outstanding))}`} />
      <Form.Description text={`Credit Utilization: ${pct}%`} />
      <Form.Description text={`Note: Smart EMI cases may adjust available credit.`} />
    </Form>
  );
}

