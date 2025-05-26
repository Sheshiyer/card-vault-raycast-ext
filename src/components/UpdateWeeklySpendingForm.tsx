import { Form, ActionPanel, Action, showToast, Toast, useNavigation, LocalStorage } from "@raycast/api";
import { useState } from "react";
import { Card } from "../types";
import { getStoredCards, updateWeeklyUsage } from "../utils";

export function UpdateWeeklySpendingForm({ card, onUpdated }: { card: Card; onUpdated: () => void }) {
  const { pop } = useNavigation();
  const [value, setValue] = useState(card.weeklySpending?.toString() || "");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: { weeklySpending: string }) {
    setIsLoading(true);
    const newSpending = Number(values.weeklySpending);
    if (isNaN(newSpending) || newSpending < 0) {
      await showToast({ style: Toast.Style.Failure, title: "Invalid value" });
      setIsLoading(false);
      return;
    }
    // Update the card's weeklySpending and recalculate weeklyUsage
    const cards = await getStoredCards();
    const updatedCards = cards.map((c) =>
      c.id === card.id
        ? { ...c, weeklySpending: newSpending }
        : c
    );
    // Save and recalc usage
    await LocalStorage.setItem("stored_cards", JSON.stringify(updatedCards));
    await updateWeeklyUsage(card.id);
    await showToast({ style: Toast.Style.Success, title: "Weekly spending updated" });
    setIsLoading(false);
    onUpdated();
    pop();
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Update Weekly Spending"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Update the current weekly spending for this card." />
      <Form.TextField
        id="weeklySpending"
        title="Weekly Spending"
        placeholder="Enter amount"
        value={value}
        onChange={setValue}
        autoFocus
      />
    </Form>
  );
}
