import { List, ActionPanel, Action, Icon, useNavigation, Color, Image, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import React from "react";
import { Card, BankLogos } from "./types";
import { getStoredCards, maskCardNumber, initializeStorageSchema, formatCurrency, calculateUtilization, mergeRemoteSummaries } from "./utils";
import { fetchSummaries } from "./cloudflare";
import { CardForm } from "./components/CardForm";
import { CardDetail } from "./components/CardDetail";
import { BulkUpdateForm } from "./components/BulkUpdateForm";
import bankLogosData from "./bank-logos.json";

const bankLogos = bankLogosData as BankLogos;

const CREDIT_ICON = {
  source: Icon.CreditCard,
  tintColor: Color.Purple,
};

const DEBIT_ICON = {
  source: Icon.CreditCard,
  tintColor: Color.Green,
};

function getBankIcon(bankName: string): Image.ImageLike {
  const bankInfo = bankLogos.banks[bankName];
  if (bankInfo && bankInfo.logo) {
    return { source: bankInfo.logo, mask: Image.Mask.RoundedRectangle };
  }
  return CREDIT_ICON;
}

// Use shared helpers from utils for currency formatting and utilization

export default function Command() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push, pop } = useNavigation();

  useEffect(() => {
    (async () => {
      await initializeStorageSchema();
      await loadCards();
    })();
  }, []);

  // SECURITY NOTE: This internal tool omits user authentication by design.
  // It is intended for limited internal use and only handles summary data.
  // Do not deploy publicly; consider IP allowlists if exposing endpoints.
  useEffect(() => {
    console.warn("Security Notice: Authentication is DISABLED in this internal build. Do not expose publicly.");
  }, []);

  async function loadCards() {
    try {
      const storedCards = await getStoredCards();
      setCards(storedCards);
    } catch (error) {
      console.error("Failed to load cards:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddCard() {
    push(
      <CardForm
        onSubmit={async () => {
          await loadCards();
          pop();
        }}
      />
    );
  }

  function handleSelectCard(card: Card) {
    push(<CardDetail card={card} onCardUpdated={async () => {
      await loadCards();
      pop();
    }} />);
  }

  function handleBulkUpdate() {
    push(<BulkUpdateForm cards={cards} onUpdated={() => {
      loadCards();
      pop();
    }} />);
  }

  // Calculate total credit limit
  const totalCreditLimit = cards
    .filter(card => card.cardType === "credit" && card.totalLimit)
    .reduce((sum, card) => sum + (card.totalLimit || 0), 0);

  if (cards.length === 0 && !isLoading) {
    return (
      <List
        actions={
          <ActionPanel>
            <Action
              title="Add Card"
              icon={Icon.Plus}
              onAction={handleAddCard}
            />
            <Action
              title="Sync from Cloudflare"
              icon={Icon.Download}
              onAction={async () => {
                try {
                  setIsLoading(true);
                  const remote = await fetchSummaries();
                  await mergeRemoteSummaries(remote);
                  await showToast({ style: Toast.Style.Success, title: "Synced from Cloudflare" });
                  await loadCards();
                } catch (e) {
                  await showToast({ style: Toast.Style.Failure, title: "Sync failed", message: String(e) });
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          </ActionPanel>
        }
      >
        <List.EmptyView
          icon={Icon.CreditCard}
          title="No Cards Found"
          description="Add your first card to get started"
          actions={
            <ActionPanel>
              <Action
                title="Add Card"
                icon={Icon.Plus}
                onAction={handleAddCard}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const creditCards = cards.filter(card => card.cardType === "credit");
  const debitCards = cards.filter(card => card.cardType === "debit");

  // Summary metrics
  const maxCreditLimit = creditCards.reduce((sum, c) => sum + (Number(c.totalLimit) || 0), 0);
  const totalOutstanding = creditCards.reduce((sum, c) => sum + ((Number(c.currentBalance) || 0) + (Number(c.pendingBalance) || 0)), 0);
  const totalAvailable = Math.max(0, maxCreditLimit - totalOutstanding);
  const aggregatePaymentDue = creditCards.reduce((sum, c) => sum + (Number(c.paymentDueAmount) || 0), 0);

  return (
      <List 
        isLoading={isLoading}
        searchBarPlaceholder="Search cards..."
        navigationTitle="Card Vault"
        actions={
          <ActionPanel>
            <Action
              title="Add Card"
              icon={Icon.Plus}
              onAction={handleAddCard}
            />
            {cards.length > 1 && (
              <Action
                title="Bulk Update Balances"
                icon={Icon.Pencil}
                onAction={handleBulkUpdate}
              />
            )}
            <Action
              title="Sync from Cloudflare"
              icon={Icon.Download}
              onAction={async () => {
                try {
                  setIsLoading(true);
                  const remote = await fetchSummaries();
                  await mergeRemoteSummaries(remote);
                  await showToast({ style: Toast.Style.Success, title: "Synced from Cloudflare" });
                  await loadCards();
                } catch (e) {
                  await showToast({ style: Toast.Style.Failure, title: "Sync failed", message: String(e) });
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          </ActionPanel>
        }
      >
      {/* Prominent security indicator for internal use */}
      <List.Section title="Security Notice">
        <List.Item
          key="security-notice"
          icon={{ source: Icon.Warning, tintColor: Color.Red }}
          title="Internal Tool — No Authentication"
          accessories={[{ text: "Do not expose publicly" }]}
        />
      </List.Section>
      {(maxCreditLimit > 0 || aggregatePaymentDue > 0) && (
        <List.Section title="Summary">
          {maxCreditLimit > 0 && (
            <List.Item
              key="summary-max-limit"
              icon={Icon.Coins}
              title="Maximum Credit Limit"
              accessories={[{ text: formatCurrency(maxCreditLimit) }]}
            />
          )}
          {maxCreditLimit > 0 && (
            <List.Item
              key="summary-available"
              icon={Icon.BarChart}
              title="Total Available Credit"
              accessories={[{ text: formatCurrency(totalAvailable) }]}
            />
          )}
          {aggregatePaymentDue > 0 && (
            <List.Item
              key="summary-payment-due"
              icon={Icon.Calendar}
              title="Aggregate Payment Due"
              accessories={[{ text: formatCurrency(aggregatePaymentDue) }]}
            />
          )}
        </List.Section>
      )}

      {creditCards.length > 0 && (
        <List.Section title="Credit Cards">
          {creditCards.map((card) => (
            <List.Item
              key={card.id}
              icon={getBankIcon(card.bankName)}
              title={`${card.bankName} - ${card.cardName}`}
              subtitle={maskCardNumber(card.cardNumber)}
              accessories={[
                { text: card.cardType.toUpperCase() },
                { text: card.expiryDate },
                ...(card.totalLimit ? [{ text: formatCurrency(card.totalLimit), icon: Icon.Coins }] : []),
                ...(card.totalLimit && card.totalLimit > 0 && (card.currentBalance || card.pendingBalance)
                  ? (() => {
                      const currentBalance = Number(card.currentBalance) || 0;
                      const pendingBalance = Number(card.pendingBalance) || 0;
                      const totalLimit = Number(card.totalLimit);
                      const outstandingBalance = currentBalance + pendingBalance;
                      const usagePercentage = calculateUtilization(totalLimit, outstandingBalance);
                      const usageRatio = usagePercentage / 100;
                      return [{
                        text: `${usagePercentage}%`,
                        icon: {
                          source: Icon.Circle,
                          tintColor: usageRatio <= 0.3 ? Color.Green : usageRatio < 0.8 ? Color.Orange : Color.Red,
                        },
                      }];
                    })()
                  : []),
                ...(card.paymentDueDate || card.paymentDueAmount
                  ? (() => {
                      const dueDateStr = card.paymentDueDate ? new Date(card.paymentDueDate).toLocaleDateString() : undefined;
                      const dueInDays = card.paymentDueDate ? Math.ceil((new Date(card.paymentDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;
                      const isSoon = typeof dueInDays === "number" && dueInDays <= 7;
                      const iconLike = isSoon ? { source: Icon.Warning, tintColor: Color.Red } : Icon.Calendar;
                      const textParts = [
                        dueDateStr ? `Due: ${dueDateStr}` : undefined,
                        typeof card.paymentDueAmount === "number" ? `Amt: ${formatCurrency(Number(card.paymentDueAmount))}` : undefined,
                      ].filter(Boolean);
                      return textParts.length > 0 ? [{ text: textParts.join(" • "), icon: iconLike }] : [];
                    })()
                  : []),
                ...(card.lastUpdated ? [{ 
                  text: new Date(card.lastUpdated).toLocaleDateString(), 
                  icon: Icon.Clock 
                }] : [])
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="View Details"
                    icon={Icon.Eye}
                    onAction={() => handleSelectCard(card)}
                  />
                  <Action
                    title="Add New Card"
                    icon={Icon.Plus}
                    onAction={handleAddCard}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {debitCards.length > 0 && (
        <List.Section title="Debit Cards">
          {debitCards.map((card) => (
            <List.Item
              key={card.id}
              icon={getBankIcon(card.bankName)}
              title={`${card.bankName} - ${card.cardName}`}
              subtitle={maskCardNumber(card.cardNumber)}
              accessories={[
                { text: card.cardType.toUpperCase() },
                { text: card.expiryDate },
                ...(card.currentBalance
                  ? [{ text: formatCurrency(card.currentBalance), icon: Icon.Coins }]
                  : []),
                ...(card.lastUpdated ? [{ 
                  text: new Date(card.lastUpdated).toLocaleDateString(), 
                  icon: Icon.Clock 
                }] : [])
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="View Details"
                    icon={Icon.Eye}
                    onAction={() => handleSelectCard(card)}
                  />
                  <Action
                    title="Add New Card"
                    icon={Icon.Plus}
                    onAction={handleAddCard}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
