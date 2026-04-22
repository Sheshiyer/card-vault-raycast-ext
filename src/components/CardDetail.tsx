import { Detail, ActionPanel, Action, Icon, showToast, Toast, useNavigation, Clipboard, Color, confirmAlert } from "@raycast/api";
import { Card } from "../types";
import { removeCard, formatCurrency, calculateUtilization } from "../utils";
import { useState } from "react";
import { CardForm } from "./CardForm";
import { QuickUpdateBalanceForm } from "./QuickUpdateBalanceForm";

function maskCardNumber(cardNumber: string) {
  return cardNumber.replace(/\d(?=\d{4})/g, "•");
}

function usageBar(usage?: number) {
  if (typeof usage !== "number" || usage < 0 || usage > 100) return "";
  const total = 20;
  const filled = Math.max(0, Math.min(total, Math.round((usage / 100) * total)));
  const empty = Math.max(0, total - filled);
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${usage}%`;
}

export function CardDetail({ card, onCardUpdated }: { card: Card; onCardUpdated: () => void }) {
  const { push } = useNavigation();
  // SECURITY NOTE: Authentication is intentionally omitted in this internal build.
  // This view displays summary information and should not be exposed publicly.

  if (!card) {
    return (
      <Detail
        navigationTitle="Card Details Error"
        markdown="**Error:** Card details could not be loaded."
      />
    );
  }

  // Create a card-like visual representation
  let summary = `# ${card.cardType === "credit" ? "💳" : "🏦"} ${card.cardName}\n\n`;
  
  // Card visual representation
  summary += `\`\`\`\n`;
  summary += `┌─────────────────────────────────────┐\n`;
  summary += `│ ${card.bankName.padEnd(31)} │\n`;
  summary += `│                                     │\n`;
  summary += `│ ${maskCardNumber(card.cardNumber).padEnd(31)} │\n`;
  summary += `│                                     │\n`;
  summary += `│ ${card.cardHolderName.toUpperCase().padEnd(31)} │\n`;
  summary += `│ ${card.expiryDate.padEnd(31)} │\n`;
  summary += `└─────────────────────────────────────┘\n`;
  summary += `\`\`\`\n\n`;
  
  // Calculate balances and utilization for credit cards
  if (card.cardType === "credit" && card.totalLimit && card.totalLimit > 0) {
    // Ensure all values are properly converted to numbers
    const currentBalance = Number(card.currentBalance) || 0;
    const pendingBalance = Number(card.pendingBalance) || 0;
    const totalLimit = Number(card.totalLimit);
    
    // For credit cards, the "used" amount is current + pending balances
    // Outstanding Balance = posted + pending
    const outstandingBalance = currentBalance + pendingBalance;
    
    // Available balance calculation: Total Limit - Used Amount
    // Note: This doesn't account for EMI converted transactions which reduce available limit
    // Available Credit = Total Limit - Outstanding Balance
    const availableBalance = Math.max(0, totalLimit - outstandingBalance);
    
    // Usage percentage calculation
    const usagePercentage = calculateUtilization(totalLimit, outstandingBalance);
    
    // Create visual progress bar with proper bounds checking
    const total = 30;
    const filled = Math.max(0, Math.min(total, Math.round((usagePercentage / 100) * total)));
    const empty = Math.max(0, total - filled);
    
    // Color-coded progress bar
    const colorIndicator = usagePercentage <= 30 ? "🟢" : usagePercentage < 80 ? "🟡" : "🔴";
    const progressBar = "█".repeat(filled) + "░".repeat(empty);
    
    summary += `## 💰 Credit Utilization\n\n`;
    summary += `**Maximum Credit Limit:** ${formatCurrency(totalLimit)}\n`;
    summary += `**Outstanding Balance:** ${formatCurrency(outstandingBalance)}\n`;
    summary += `**Pending Balance:** ${formatCurrency(pendingBalance)}\n`;
    summary += `**Available Credit:** ${formatCurrency(availableBalance)}\n\n`;
    summary += `**Utilization:** ${colorIndicator} ${usagePercentage}%\n`;
    summary += `\`${progressBar}\`\n\n`;

    if (card.paymentDueDate || typeof card.paymentDueAmount === "number") {
      const dueDate = card.paymentDueDate ? new Date(card.paymentDueDate) : undefined;
      const dueDateStr = dueDate ? dueDate.toLocaleDateString() : "-";
      const amtStr = typeof card.paymentDueAmount === "number" ? formatCurrency(Number(card.paymentDueAmount)) : "-";
      const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;
      const alertLine = typeof daysLeft === "number" && daysLeft <= 7 ? `\n⚠️ **Payment due in ${daysLeft} day(s)**\n` : "\n";
      summary += `## 🧾 Upcoming Payment\n\n**Due Date:** ${dueDateStr}\n**Amount Due:** ${amtStr}${alertLine}`;
    }
    
    // Spending insights
    if (usagePercentage > 80) {
      summary += `⚠️ **High Utilization Alert:** You're using ${usagePercentage}% of your credit limit.\n\n`;
    } else if (usagePercentage > 30) {
      summary += `⚡ **Elevated Utilization:** You're using ${usagePercentage}% of your credit limit.\n\n`;
    } else {
      summary += `✅ **Healthy Utilization:** You're using ${usagePercentage}% of your credit limit.\n\n`;
    }
    
    // Note about EMI transactions
    if (card.availableBalance && card.availableBalance !== availableBalance) {
      summary += `ℹ️ **Note:** Available balance may differ due to EMI converted transactions or other adjustments.\n\n`;
    }
  } else if (card.cardType === "debit" && card.currentBalance) {
    summary += `## 💰 Account Balance\n\n`;
    summary += `**Available Balance:** ${formatCurrency(Number(card.currentBalance))}\n\n`;
  }

  return (
    <Detail
      navigationTitle={`${card.bankName} - ${card.cardName}`}
      markdown={`> ⚠️ **Internal Tool — No Authentication Enabled**\n\n${summary}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Cardholder" text={card.cardHolderName} icon={Icon.Person} />
          <Detail.Metadata.Label title="Card Number" text={maskCardNumber(card.cardNumber)} icon={Icon.Clipboard} />
          <Detail.Metadata.Label title="Expiry" text={card.expiryDate} icon={Icon.Calendar} />
          <Detail.Metadata.Label title="CVV" text={"•••"} icon={Icon.Key} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Maximum Credit Limit" text={card.totalLimit ? formatCurrency(Number(card.totalLimit)) : "-"} icon={Icon.Coins} />
          <Detail.Metadata.Label
            title="Outstanding Balance"
            text={(() => {
              const current = Number(card.currentBalance) || 0;
              const pending = Number(card.pendingBalance) || 0;
              const outstanding = current + pending;
              return outstanding > 0 ? formatCurrency(outstanding) : "-";
            })()}
            icon={Icon.Coins}
          />
          <Detail.Metadata.Label title="Pending Balance" text={card.pendingBalance ? formatCurrency(Number(card.pendingBalance)) : "-"} icon={Icon.Clock} />
          <Detail.Metadata.Label title="Available Credit" text={card.availableBalance !== undefined ? formatCurrency(Number(card.availableBalance)) : (card.totalLimit && (card.currentBalance || card.pendingBalance) ? formatCurrency(Number(card.totalLimit) - (Number(card.currentBalance) || 0) - (Number(card.pendingBalance) || 0)) : "-")} icon={Icon.BarChart} />
          <Detail.Metadata.Label title="Last Updated" text={card.lastUpdated && card.lastUpdated !== "0/0/0005" ? new Date(card.lastUpdated).toLocaleDateString() : "Never"} icon={Icon.Clock} />
          <Detail.Metadata.Label title="Payment Due Date" text={card.paymentDueDate ? new Date(card.paymentDueDate).toLocaleDateString() : "-"} icon={Icon.Calendar} />
          <Detail.Metadata.Label title="Payment Due Amount" text={typeof card.paymentDueAmount === "number" ? formatCurrency(Number(card.paymentDueAmount)) : "-"} icon={Icon.Coins} />
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
              title="CVV Not Stored (PCI)"
              icon={Icon.Key}
              onAction={async () => {
                await showToast({ style: Toast.Style.Animated, title: "CVV is never stored" });
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
              title="Quick Update Balance"
              icon={Icon.Pencil}
              shortcut={{ modifiers: ["cmd"], key: "u" }}
              onAction={() => push(<QuickUpdateBalanceForm card={card} onUpdated={onCardUpdated} />)}
            />
            <Action
              title="Edit Card"
              icon={Icon.Gear}
              shortcut={{ modifiers: ["cmd"], key: "e" }}
              onAction={() => push(<CardForm editingCard={card} onSubmit={onCardUpdated} />)}
            />
            <Action
              title="Remove Card"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              onAction={async () => {
                const confirmed = await confirmAlert({
                  title: "Remove Card",
                  message: `Are you sure you want to remove ${card.bankName} - ${card.cardName}?`,
                  primaryAction: { title: "Remove" },
                });
                if (!confirmed) return;
                try {
                  await removeCard(card.id);
                  await showToast({ style: Toast.Style.Success, title: "Card removed" });
                  onCardUpdated();
                } catch (error) {
                  await showToast({ style: Toast.Style.Failure, title: "Failed to remove card", message: String(error) });
                }
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}