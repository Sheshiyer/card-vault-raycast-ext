import { LocalStorage } from "@raycast/api";
import { Card, CardFormData } from "./types";
import crypto from "crypto";

const CARDS_KEY = "stored_cards";
const BACKUP_KEY = "cards_backup";

export async function getStoredCards(): Promise<Card[]> {
  const storedData = await LocalStorage.getItem<string>(CARDS_KEY);
  if (!storedData) return [];
  return JSON.parse(storedData);
}

export async function addCard(cardData: CardFormData): Promise<void> {
  const cards = await getStoredCards();
  const newCard: Card = {
    ...cardData,
    id: crypto.randomUUID(),
  };
  
  await LocalStorage.setItem(CARDS_KEY, JSON.stringify([...cards, newCard]));
}

export async function editCard(id: string, cardData: CardFormData): Promise<void> {
  const cards = await getStoredCards();
  const updatedCards = cards.map((card) =>
    card.id === id ? { ...cardData, id } : card
  );
  await LocalStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));
}

export async function removeCard(id: string): Promise<void> {
  const cards = await getStoredCards();
  const filteredCards = cards.filter((card) => card.id !== id);
  await LocalStorage.setItem(CARDS_KEY, JSON.stringify(filteredCards));
}

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})/g, "$1 ").trim();
}

export function maskCardNumber(cardNumber: string): string {
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, "");
  return cleaned.length === 16;
}

export function validateExpiryDate(date: string): boolean {
  const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!regex.test(date)) return false;
  
  const [month, year] = date.split("/").map(Number);
  const now = new Date();
  const expiry = new Date(2000 + year, month - 1);
  
  return expiry > now;
}

export function validateCVV(cvv: string): boolean {
  const cleaned = cvv.replace(/\D/g, "");
  return cleaned.length === 3;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    maximumFractionDigits: 0 
  }).format(amount);
}

export async function backupCards(): Promise<void> {
  const cards = await getStoredCards();
  await LocalStorage.setItem(BACKUP_KEY, JSON.stringify(cards));
}

export async function restoreCardsFromBackup(): Promise<boolean> {
  const backupData = await LocalStorage.getItem<string>(BACKUP_KEY);
  if (!backupData) return false;
  
  await LocalStorage.setItem(CARDS_KEY, backupData);
  return true;
}

export async function exportCardsToJSON(): Promise<string> {
  const cards = await getStoredCards();
  return JSON.stringify(cards, null, 2);
}

export async function importCardsFromJSON(jsonData: string): Promise<boolean> {
  try {
    const cards = JSON.parse(jsonData);
    if (!Array.isArray(cards)) return false;
    
    await LocalStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    return true;
  } catch (error) {
    return false;
  }
}

export async function updateWeeklyUsage(cardId: string): Promise<void> {
  const cards = await getStoredCards();
  const updatedCards = cards.map((card) => {
    if (card.id === cardId) {
      const weeklyLimit = card.weeklyLimit || card.cardLimit || 1;
      const weeklySpending = card.weeklySpending || 0;
      const weeklyUsage = Math.min(Math.round((weeklySpending / weeklyLimit) * 100), 100);
      
      return { ...card, weeklyUsage };
    }
    return card;
  });
  
  await LocalStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));
}
