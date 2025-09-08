import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { Card, CardFormData, BankLogos } from "../types";
import { addCard, editCard } from "../utils";
import bankLogosData from "../bank-logos.json";

const bankLogos = bankLogosData as BankLogos;

export function CardForm({ onSubmit, editingCard }: { onSubmit: () => void; editingCard?: Card }) {
  const [cardType, setCardType] = useState<"credit" | "debit">(editingCard?.cardType || "credit");
  const bankOptions = Object.keys(bankLogos.banks).sort();

  async function handleSubmit(values: CardFormData) {
    try {
      // Parse numeric fields
      const formData: CardFormData = {
        ...values,
        cardLimit: values.cardLimit ? Number(values.cardLimit) : undefined,
        weeklySpending: values.weeklySpending ? Number(values.weeklySpending) : undefined,
        weeklyLimit: values.weeklyLimit ? Number(values.weeklyLimit) : undefined,
        weeklyUsage: values.weeklyUsage ? Number(values.weeklyUsage) : undefined,
        lastWeekUsage: values.lastWeekUsage ? Number(values.lastWeekUsage) : undefined,
        alertThreshold: values.alertThreshold ? Number(values.alertThreshold) : undefined,
      };

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
      <Form.Dropdown id="bankName" title="Bank Name" defaultValue={editingCard?.bankName || bankOptions[0]}>
        {bankOptions.map((bank) => (
          <Form.Dropdown.Item key={bank} value={bank} title={bankLogos.banks[bank].name} />
        ))}
      </Form.Dropdown>
      <Form.TextField id="cardName" title="Card Name" placeholder="e.g. Millenia Credit" defaultValue={editingCard?.cardName} />
      <Form.TextField id="cardHolderName" title="Holder Name" placeholder="Name on card" defaultValue={editingCard?.cardHolderName} />
      <Form.TextField id="cardNumber" title="Card Number" placeholder="16-digit card number" defaultValue={editingCard?.cardNumber} />
      <Form.TextField id="expiryDate" title="Expiry Date (MM/YY)" placeholder="MM/YY" defaultValue={editingCard?.expiryDate} />
      <Form.TextField id="cvv" title="CVV" placeholder="3-digit CVV" defaultValue={editingCard?.cvv} />
      <Form.Dropdown id="cardType" title="Card Type" defaultValue={editingCard?.cardType || "credit"} onChange={(value) => setCardType(value as "credit" | "debit")}>
        <Form.Dropdown.Item value="credit" title="Credit Card" />
        <Form.Dropdown.Item value="debit" title="Debit Card" />
      </Form.Dropdown>
      {cardType === "credit" && (
        <Form.TextField id="cardLimit" title="Card Limit" placeholder="e.g. 100000" defaultValue={editingCard?.cardLimit?.toString()} />
      )}
      <Form.Separator />

      <Form.Description text="Spending & Usage" />
      <Form.TextField id="weeklySpending" title="Weekly Spending" placeholder="e.g. 5000" defaultValue={editingCard?.weeklySpending?.toString()} />
      <Form.TextField id="weeklyLimit" title="Weekly Limit" placeholder="e.g. 10000" defaultValue={editingCard?.weeklyLimit?.toString()} />
      <Form.TextField id="weeklyUsage" title="Weekly Usage (%)" placeholder="e.g. 30" defaultValue={editingCard?.weeklyUsage?.toString()} />
      <Form.TextField id="lastWeekUsage" title="Last Week Usage (%)" placeholder="e.g. 25" defaultValue={editingCard?.lastWeekUsage?.toString()} />
      <Form.Separator />

      <Form.Description text="Alerts" />
      <Form.Checkbox id="alertsEnabled" label="Enable Alerts" defaultValue={editingCard?.alertsEnabled ?? false} />
      <Form.TextField id="alertThreshold" title="Alert Threshold (%)" placeholder="e.g. 80" defaultValue={editingCard?.alertThreshold?.toString()} />
    </Form>
  );
}