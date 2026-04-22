import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { Card, CardFormData, BankLogos } from "../types";
import { addCard, editCard, validateCardNumber, validateExpiryDate, normalizeExpiry } from "../utils";
import bankLogosData from "../bank-logos.json";

const bankLogos = bankLogosData as BankLogos;

export function CardForm({ onSubmit, editingCard }: { onSubmit: () => void; editingCard?: Card }) {
  const [cardType, setCardType] = useState<"credit" | "debit">(editingCard?.cardType || "credit");
  const bankOptions = Object.keys(bankLogos.banks).sort();

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [cardNumberInput, setCardNumberInput] = useState<string>("");
  const [expiryInput, setExpiryInput] = useState<string>("");
  const [totalLimitInput, setTotalLimitInput] = useState<string>("");
  const [currentBalanceInput, setCurrentBalanceInput] = useState<string>("");
  const [pendingBalanceInput, setPendingBalanceInput] = useState<string>("");
  const [paymentDueAmountInput, setPaymentDueAmountInput] = useState<string>("");
  const [paymentDueDateInput, setPaymentDueDateInput] = useState<string>("");

  useEffect(() => {
    const initial = (editingCard?.cardNumber || "").replace(/\D/g, "").slice(0, 16);
    if (initial) {
      setCardNumberInput(initial.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
    }
    // initialize expiry value normalized to MM/YY when editing
    if (editingCard?.expiryDate) {
      const canonical = normalizeExpiry(editingCard.expiryDate);
      if (canonical) setExpiryInput(canonical);
    }
    // initialize numeric fields with Indian formatting when editing
    if (editingCard?.totalLimit != null) setTotalLimitInput(formatIndianNumber(String(editingCard.totalLimit)));
    if (editingCard?.currentBalance != null) setCurrentBalanceInput(formatIndianNumber(String(editingCard.currentBalance)));
    if (editingCard?.pendingBalance != null) setPendingBalanceInput(formatIndianNumber(String(editingCard.pendingBalance)));
    if (editingCard?.paymentDueAmount != null) setPaymentDueAmountInput(formatIndianNumber(String(editingCard.paymentDueAmount)));
    if (editingCard?.paymentDueDate) setPaymentDueDateInput(editingCard.paymentDueDate);
  }, [editingCard]);

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

  function validate(values: CardFormData): boolean {
    const nextErrors: Record<string, string | undefined> = {};
    if (!values.bankName) nextErrors.bankName = "Bank is required";
    if (!values.cardName) nextErrors.cardName = "Card name is required";
    if (!values.cardHolderName) nextErrors.cardHolderName = "Holder name is required";
    if (!values.cardNumber || !validateCardNumber(values.cardNumber)) nextErrors.cardNumber = "Enter a valid 16-digit number";
    // Accept various input formats and normalize to MM/YY
    const canonical = normalizeExpiry(values.expiryDate || "");
    if (!canonical || !validateExpiryDate(canonical)) nextErrors.expiryDate = "Use MM/YY (e.g., 06/28)";
    if (!values.cvv || !/^\d{3}$/.test(values.cvv)) nextErrors.cvv = "Enter a valid 3-digit CVV";
    if (values.cardType === "credit") {
      const limit = Number(unformatNumber(String(values.totalLimit || "")) || 0);
      if (!limit || limit <= 0) nextErrors.totalLimit = "Total limit is required";
    }
    if (values.alertThreshold != null) {
      const t = Number(values.alertThreshold);
      if (isNaN(t) || t < 0 || t > 100) nextErrors.alertThreshold = "0-100";
    }
    if (values.paymentDueDate) {
      const d = new Date(values.paymentDueDate);
      if (isNaN(d.getTime())) nextErrors.paymentDueDate = "Use YYYY-MM-DD";
    }
    if (values.paymentDueAmount != null) {
      const a = Number(values.paymentDueAmount);
      if (isNaN(a) || a < 0) nextErrors.paymentDueAmount = "Must be a non-negative number";
    }
    setErrors(nextErrors);
    return Object.values(nextErrors).every((v) => v === undefined);
  }

  async function handleSubmit(values: CardFormData) {
    try {
      const formData: CardFormData = {
        ...values,
        bankName: (values.bankName || "").trim(),
        cardName: (values.cardName || "").trim(),
        cardHolderName: (values.cardHolderName || "").trim(),
        cardNumber: (values.cardNumber || "").replace(/\s+/g, "").trim(),
        expiryDate: normalizeExpiry(values.expiryDate || "") || (values.expiryDate || "").trim(),
        cvv: (values.cvv || "").trim(),
        totalLimit: values.totalLimit ? Number(unformatNumber(String(values.totalLimit))) : undefined,
        currentBalance: values.currentBalance ? Number(unformatNumber(String(values.currentBalance))) : undefined,
        pendingBalance: values.pendingBalance ? Number(unformatNumber(String(values.pendingBalance))) : undefined,
        alertThreshold: values.alertThreshold ? Number(values.alertThreshold) : undefined,
        paymentDueDate: values.paymentDueDate ? (values.paymentDueDate as string).trim() : undefined,
        paymentDueAmount: values.paymentDueAmount ? Number(unformatNumber(String(values.paymentDueAmount))) : undefined,
      };

      if (!validate(formData)) {
        await showToast({ style: Toast.Style.Failure, title: "Please fix form errors" });
        return;
      }

      if (editingCard) {
        await editCard(editingCard.id, formData);
      } else {
        await addCard(formData);
      }

      await showToast({ style: Toast.Style.Success, title: editingCard ? "Card updated" : "Card added" });
      onSubmit();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to save card", message: String(error) });
    }
  }

  return (
    <Form
      navigationTitle={editingCard ? "Edit Card" : "Add Card"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={editingCard ? "Update Card" : "Add Card"} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Card Details" />
      <Form.Dropdown id="bankName" title="Bank Name" defaultValue={editingCard?.bankName || bankOptions[0]} error={errors.bankName}>
        {bankOptions.map((bank) => (
          <Form.Dropdown.Item key={bank} value={bank} title={bankLogos.banks[bank].name} />
        ))}
      </Form.Dropdown>
      <Form.TextField id="cardName" title="Card Name" placeholder="e.g. Millenia Credit" defaultValue={editingCard?.cardName} error={errors.cardName} />
      <Form.TextField id="cardHolderName" title="Holder Name" placeholder="Name on card" defaultValue={editingCard?.cardHolderName} error={errors.cardHolderName} />
      <Form.TextField
        id="cardNumber"
        title="Card Number"
        placeholder="#### #### #### ####"
        value={cardNumberInput}
        onChange={(value) => {
          const digits = value.replace(/\D/g, "");
          const truncated = digits.slice(0, 16);
          const formatted = truncated.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
          setCardNumberInput(formatted);
        }}
        error={errors.cardNumber}
      />
      <Form.Description text="Enter 16 digits; formatted in groups of 4. Spaces are ignored on save." />
      <Form.TextField
        id="expiryDate"
        title="Expiry Date (MM/YY)"
        placeholder="MM/YY"
        value={expiryInput}
        onChange={(value) => {
          const digits = value.replace(/\D/g, "");
          let v = digits.slice(0, 4);
          let display = v;
          let err: string | undefined;
          if (v.length >= 1 && v.length <= 2) {
            const monthNum = Number(v);
            if (v.length === 2 && (monthNum < 1 || monthNum > 12)) err = "Month must be 01-12";
          }
          if (v.length > 2) {
            const mm = v.slice(0, 2);
            const yy = v.slice(2);
            const monthNum = Number(mm);
            if (monthNum < 1 || monthNum > 12) err = "Month must be 01-12";
            display = `${mm}/${yy}`;
          }
          setExpiryInput(display);
          setErrors((prev) => ({ ...prev, expiryDate: err }));
        }}
        error={errors.expiryDate}
      />
      <Form.Description text="Format: MM/YY. A slash is inserted automatically; months 01–12 only." />
      <Form.TextField id="cvv" title="CVV" placeholder="3-digit CVV" error={errors.cvv} />
      <Form.Description text="CVV is used only at submission time and is never stored." />
      <Form.Dropdown id="cardType" title="Card Type" defaultValue={editingCard?.cardType || "credit"} onChange={(value) => setCardType(value as "credit" | "debit")}> 
        <Form.Dropdown.Item value="credit" title="Credit Card" />
        <Form.Dropdown.Item value="debit" title="Debit Card" />
      </Form.Dropdown>
      {cardType === "credit" && (
        <>
          <Form.TextField
            id="totalLimit"
            title="Total Credit Limit"
            placeholder="e.g. 1,00,000"
            value={totalLimitInput}
            onChange={(value) => setTotalLimitInput(formatIndianNumber(value))}
            error={errors.totalLimit}
          />
          <Form.Description text="Uses Indian numbering (lakh/crore). Example: 1,00,000. Commas are ignored on save." />
        </>
      )}
      {editingCard && (
        <>
          <Form.Separator />
          <Form.Description text="Balance Management" />
          <Form.TextField
            id="currentBalance"
            title="Current Balance"
            placeholder="e.g. 25,000"
            value={currentBalanceInput}
            onChange={(value) => setCurrentBalanceInput(formatIndianNumber(value))}
          />
          <Form.Description text="Indian numbering format. Example: 25,000. Commas are ignored on save." />
          <Form.TextField
            id="pendingBalance"
            title="Pending Balance"
            placeholder="e.g. 1,500"
            value={pendingBalanceInput}
            onChange={(value) => setPendingBalanceInput(formatIndianNumber(value))}
          />
          <Form.Description text="Indian numbering format. Example: 1,500. Commas are ignored on save." />
          <Form.Separator />
        </>
      )}

      <Form.Description text="Alerts" />
      <Form.Checkbox id="alertsEnabled" label="Enable Alerts" defaultValue={editingCard?.alertsEnabled ?? false} />
      <Form.TextField id="alertThreshold" title="Alert Threshold (%)" placeholder="e.g. 80" defaultValue={editingCard?.alertThreshold?.toString()} error={errors.alertThreshold} />

      <Form.Separator />
      <Form.Description text="Payments" />
      <Form.TextField
        id="paymentDueDate"
        title="Payment Due Date"
        placeholder="YYYY-MM-DD"
        value={paymentDueDateInput}
        onChange={setPaymentDueDateInput}
        error={errors.paymentDueDate}
      />
      <Form.Description text="Enter statement payment due date in YYYY-MM-DD format." />
      <Form.TextField
        id="paymentDueAmount"
        title="Payment Due Amount"
        placeholder="e.g. 5,000"
        value={paymentDueAmountInput}
        onChange={(value) => setPaymentDueAmountInput(formatIndianNumber(value))}
        error={errors.paymentDueAmount}
      />
      <Form.Description text="Indian numbering format. Example: 5,000. Commas are ignored on save." />
    </Form>
  );
}