import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { Card, CardFormData } from "../types";

export function CardForm({ onSubmit, editingCard }: { onSubmit: () => void; editingCard?: Card }) {
  const [cardType, setCardType] = useState<"credit" | "debit">(editingCard?.cardType || "credit");

  async function handleSubmit(values: CardFormData) {
    // Add validation as needed
    await showToast({ style: Toast.Style.Success, title: editingCard ? "Card updated" : "Card added" });
    onSubmit();
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
      <Form.TextField id="bankName" title="Bank Name" placeholder="e.g. ICICI Bank" defaultValue={editingCard?.bankName} />
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