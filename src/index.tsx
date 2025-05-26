import { List, ActionPanel, Action, Icon, useNavigation, Color } from "@raycast/api";
import { useEffect, useState } from "react";
import React from "react";
import { Card } from "./types";
import { getStoredCards, maskCardNumber } from "./utils";
import { CardForm } from "./components/CardForm";
import { CardDetail } from "./components/CardDetail";

const CREDIT_ICON = {
  source: Icon.CreditCard,
  tintColor: Color.Purple,
};

const DEBIT_ICON = {
  source: Icon.CreditCard,
  tintColor: Color.Green,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    maximumFractionDigits: 0 
  }).format(amount);
}

export default function Command() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push, pop } = useNavigation();

  useEffect(() => {
    loadCards();
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
        onSubmit={() => {
          loadCards();
          pop();
        }}
      />
    );
  }

  function handleSelectCard(card: Card) {
    push(<CardDetail card={card} onCardUpdated={() => {
      loadCards();
      pop();
    }} />);
  }

  // Calculate total credit limit
  const totalCreditLimit = cards
    .filter(card => card.cardType === "credit" && card.cardLimit)
    .reduce((sum, card) => sum + (card.cardLimit || 0), 0);

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

  return (
    <List 
      isLoading={isLoading}
      searchBarPlaceholder="Search cards..."
      navigationTitle="Card Vault"
    >
      {totalCreditLimit > 0 && (
        <List.Section title={`Total Credit Limit: ${formatCurrency(totalCreditLimit)}`} />
      )}

      {creditCards.length > 0 && (
        <List.Section title="Credit Cards">
          {creditCards.map((card) => (
            <List.Item
              key={card.id}
              icon={CREDIT_ICON}
              title={`${card.bankName} - ${card.cardName}`}
              subtitle={maskCardNumber(card.cardNumber)}
              accessories={[
                { text: card.cardType.toUpperCase() },
                { text: card.expiryDate },
                ...(card.cardLimit ? [{ text: formatCurrency(card.cardLimit), icon: Icon.Coins }] : []),
                ...(typeof card.weeklyUsage === "number"
                  ? [{
                      text: `${card.weeklyUsage}%`,
                      icon: {
                        source: Icon.Circle,
                        tintColor:
                          card.weeklyUsage < 50
                            ? Color.Green
                            : card.weeklyUsage < 80
                            ? Color.Orange
                            : Color.Red,
                      },
                    }]
                  : [])
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
              icon={DEBIT_ICON}
              title={`${card.bankName} - ${card.cardName}`}
              subtitle={maskCardNumber(card.cardNumber)}
              accessories={[
                { text: card.cardType.toUpperCase() },
                { text: card.expiryDate },
                ...(typeof card.weeklyUsage === "number"
                  ? [{
                      text: `${card.weeklyUsage}%`,
                      icon: {
                        source: Icon.Circle,
                        tintColor:
                          card.weeklyUsage < 50
                            ? Color.Green
                            : card.weeklyUsage < 80
                            ? Color.Orange
                            : Color.Red,
                      },
                    }]
                  : [])
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
