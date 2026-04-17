import type { TransactionFeedRow } from "@/app/components/OCBankFeedSnapshot";

export const MOCK_TOTAL_BANK_BALANCE = 442.15;

export const MOCK_TRANSACTIONS: TransactionFeedRow[] = [
  {
    id: "tx-2025-10-14-insurance",
    transaction_date: "2025-10-14",
    description: "Insurance Premium - Commercial",
    amount: 1200.0,
    category: "Insurance",
    type: "Debit",
  },
  {
    id: "tx-2025-10-12-levy-unit-1",
    transaction_date: "2025-10-12",
    description: "Q1 Levy — Unit 1",
    amount: 485.0,
    category: "Levy",
    type: "Credit",
  },
  {
    id: "tx-2025-10-10-levy-unit-2",
    transaction_date: "2025-10-10",
    description: "Q1 Levy — Unit 2",
    amount: 485.0,
    category: "Levy",
    type: "Credit",
  },
  {
    id: "tx-2025-10-08-gardening",
    transaction_date: "2025-10-08",
    description: "Gardening Service",
    amount: 85.0,
    category: "Maintenance",
    type: "Debit",
  },
  {
    id: "tx-2025-10-05-electricity",
    transaction_date: "2025-10-05",
    description: "Common Area Electricity",
    amount: 42.1,
    category: "Utilities",
    type: "Debit",
  },
  {
    id: "tx-2025-10-01-bank-fees",
    transaction_date: "2025-10-01",
    description: "Bank Fees",
    amount: 5.0,
    category: "Banking",
    type: "Debit",
  },
];

