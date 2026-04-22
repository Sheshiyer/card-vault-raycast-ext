import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import React from "react";
import { Card } from "../types";
import { getStoredCards, bulkUpdateBalances } from "../utils";
import { upsertFromCard } from "../cloudflare";

export function BulkUpdateForm({ cards, onUpdated }: { cards: Card[]; onUpdated: () => void }) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [updates, setUpdates] = useState<Record<string, { currentBalance: string; pendingBalance: string }>>({});

  // Initialize updates with current values
  useState(() => {
    const initialUpdates: Record<string, { currentBalance: string; pendingBalance: string }> = {};
    cards.forEach(card => {
      initialUpdates[card.id] = {
        currentBalance: card.currentBalance?.toString() || "",
        pendingBalance: card.pendingBalance?.toString() || ""
      };
    });
    setUpdates(initialUpdates);
  });

  async function handleSubmit() {
    setIsLoading(true);
    
    try {
      // Prepare numeric updates and delegate to centralized util to persist and append history
      const numericUpdates: Record<string, { currentBalance: number; pendingBalance: number }> = {};
      for (const [cardId, vals] of Object.entries(updates)) {
        numericUpdates[cardId] = {
          currentBalance: Number(vals.currentBalance) || 0,
          pendingBalance: Number(vals.pendingBalance) || 0,
        };
      }
      await bulkUpdateBalances(numericUpdates);
      // Best-effort push to Cloudflare for cards that changed
      try {
        const latest = await getStoredCards();
        for (const cardId of Object.keys(numericUpdates)) {
          const card = latest.find((c) => c.id === cardId);
          if (card) {
            await upsertFromCard(card);
          }
        }
      } catch {}
      
      await showToast({ 
        style: Toast.Style.Success, 
        title: "Bulk update completed",
        message: `Updated ${Object.keys(updates).length} cards`
      });
      
      onUpdated();
      pop();
    } catch (error) {
      await showToast({ 
        style: Toast.Style.Failure, 
        title: "Update failed",
        message: "Please try again"
      });
    } finally {
      setIsLoading(false);
    }
  }

  function updateCardBalance(cardId: string, field: 'currentBalance' | 'pendingBalance', value: string) {
    setUpdates(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        [field]: value
      }
    }));
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Bulk Update Balances"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update All Cards" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text={`Update balances for ${cards.length} cards at once`} />
      
      {cards.map((card) => (
        <React.Fragment key={card.id}>
          <Form.Description text={`${card.bankName} - ${card.cardName}`} />
          <Form.TextField
            id={`currentBalance_${card.id}`}
            title="Current Balance"
            placeholder="Enter current balance"
            value={updates[card.id]?.currentBalance || ""}
            onChange={(value) => updateCardBalance(card.id, 'currentBalance', value)}
          />
          
          <Form.TextField
            id={`pendingBalance_${card.id}`}
            title="Pending Balance"
            placeholder="Enter pending transactions"
            value={updates[card.id]?.pendingBalance || ""}
            onChange={(value) => updateCardBalance(card.id, 'pendingBalance', value)}
          />
          
          {card.totalLimit && (
            <Form.Description 
              text={`Total Limit: ₹${card.totalLimit.toLocaleString()}`} 
            />
          )}
          <Form.Separator />
        </React.Fragment>
      ))}
    </Form>
  );
}
