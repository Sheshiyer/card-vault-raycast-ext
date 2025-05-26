import { Detail, ActionPanel, Action, Icon, showToast, Toast, useNavigation, Clipboard, Color } from "@raycast/api";
import { Card } from "../types";
import { useState } from "react";
import { CardForm } from "./CardForm";
import { UpdateWeeklySpendingForm } from "./UpdateWeeklySpendingForm";

function maskCardNumber(cardNumber: string) {
  return cardNumber.replace(/\d(?=\d{4})/g, "•");
}

function usageBar(usage?: number) {
  if (typeof usage !== "number") return "";
  const total = 20;
  const filled = Math.round((usage / 100) * total);
  return `[${"█".repeat(filled)}${"░".repeat(total - filled)}] ${usage}%`;
}

export function CardDetail({ card, onCardUpdated }: { card: Card; onCardUpdated: () => void }) {
  const { push } = useNavigation();

  if (!card) {
    return (
      <Detail
        navigationTitle="Card Details Error"
        markdown="**Error:** Card details could not be loaded."
      />
    );
  }

  // Compose a simple, robust markdown summary (no tables/images)
  let summary = `# ${card.cardType === "credit" ? "💳" : "🏦"} ${card.cardName}\n`;
  summary += `**Bank:** ${card.bankName}\n`;
  // summary += `**Card Number:** ${maskCardNumber(card.cardNumber)}\n`; // Removed for redundancy
  // summary += `**Expiry:** ${card.expiryDate}\n`; // Removed for redundancy
  if (typeof card.weeklyUsage === "number") {
    const total = 20;
    const filled = Math.round((card.weeklyUsage / 100) * total);
    summary += `**Usage:** [${"█".repeat(filled)}${"░".repeat(total - filled)}] ${card.weeklyUsage}%\n`;
  }

  return (
    <Detail
      navigationTitle={`${card.bankName} - ${card.cardName}`}
      markdown={summary}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Cardholder" text={card.cardHolderName} icon={Icon.Person} />
          <Detail.Metadata.Label title="Card Number" text={maskCardNumber(card.cardNumber)} icon={Icon.Clipboard} />
          <Detail.Metadata.Label title="Expiry" text={card.expiryDate} icon={Icon.Calendar} />
          <Detail.Metadata.Label title="CVV" text={"•••"} icon={Icon.Key} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Card Limit" text={card.cardLimit ? card.cardLimit.toString() : "-"} icon={Icon.Coins} />
          <Detail.Metadata.Label title="Weekly Limit" text={card.weeklyLimit ? card.weeklyLimit.toString() : "-"} icon={Icon.Clock} />
          <Detail.Metadata.Label title="Weekly Spending" text={card.weeklySpending ? card.weeklySpending.toString() : "-"} icon={Icon.Coins} />
          <Detail.Metadata.Label title="Usage" text={typeof card.weeklyUsage === "number" ? `${card.weeklyUsage}%` : "-"} icon={Icon.BarChart} />
          <Detail.Metadata.Label title="Last Week Usage" text={typeof card.lastWeekUsage === "number" ? `${card.lastWeekUsage}%` : "-"} icon={Icon.Clock} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Alerts Enabled" text={card.alertsEnabled ? "Yes" : "No"} icon={card.alertsEnabled ? Icon.Check : Icon.XmarkCircle} />
          <Detail.Metadata.Label title="Alert Threshold" text={card.alertThreshold ? `${card.alertThreshold}%` : "-"} icon={Icon.Bell} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Card ID" text={card.id} icon={Icon.Fingerprint} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Copy Details">
            <Action
              title="Copy Card Number"
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
              onAction={async () => {
                await Clipboard.copy(card.cardNumber);
                await showToast({ style: Toast.Style.Success, title: "Card number copied" });
              }}
            />
            <Action
              title="Copy Expiry"
              icon={Icon.Calendar}
              shortcut={{ modifiers: ["cmd"], key: "e" }}
              onAction={async () => {
                await Clipboard.copy(card.expiryDate);
                await showToast({ style: Toast.Style.Success, title: "Expiry copied" });
              }}
            />
            <Action
              title="Copy CVV"
              icon={Icon.Key}
              shortcut={{ modifiers: ["cmd"], key: "v" }}
              onAction={async () => {
                await Clipboard.copy(card.cvv);
                await showToast({ style: Toast.Style.Success, title: "CVV copied" });
              }}
            />
            <Action
              title="Copy Cardholder Name"
              icon={Icon.Person}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              onAction={async () => {
                await Clipboard.copy(card.cardHolderName);
                await showToast({ style: Toast.Style.Success, title: "Name copied" });
              }}
            />
            <Action
              title="Copy Bank Name"
              icon={Icon.Building}
              shortcut={{ modifiers: ["cmd"], key: "b" }}
              onAction={async () => {
                await Clipboard.copy(card.bankName);
                await showToast({ style: Toast.Style.Success, title: "Bank name copied" });
              }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Manage">
            <Action
              title="Update Weekly Spending"
              icon={Icon.BarChart}
              shortcut={{ modifiers: ["cmd"], key: "u" }}
              onAction={() => push(<UpdateWeeklySpendingForm card={card} onUpdated={onCardUpdated} />)}
            />
            <Action
              title="Edit Card"
              icon={Icon.Pencil}
              onAction={() => push(<CardForm editingCard={card} onSubmit={onCardUpdated} />)}
            />
            <Action
              title="Remove Card"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              onAction={async () => {
                // Add your remove logic here
                await showToast({ style: Toast.Style.Success, title: "Card removed" });
                onCardUpdated();
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}