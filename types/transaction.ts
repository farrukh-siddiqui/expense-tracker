export interface ParsedTransaction {
  id: string;
  date: string;
  originalDescription: string;
  editableName: string;
  amount: number;
  type: 'debit' | 'credit';
  category?: string;
  balance?: number;
}

export interface TransactionReviewData {
  transactions: ParsedTransaction[];
  accountInfo: {
    accountName: string;
    accountNumber: string;
    statementPeriod: string;
    openingBalance: number;
    closingBalance: number;
    totalIn: number;
    totalOut: number;
  };
}

export const TRANSACTION_CATEGORIES = [
  { value: 'food-dining', label: 'Food & Dining' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'bills-utilities', label: 'Bills & Utilities' },
  { value: 'auto-transport', label: 'Auto & Transport' },
  { value: 'travel', label: 'Travel' },
  { value: 'fees-charges', label: 'Fees & Charges' },
  { value: 'business-services', label: 'Business Services' },
  { value: 'personal-care', label: 'Personal Care' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'kids', label: 'Kids' },
  { value: 'gifts-donations', label: 'Gifts & Donations' },
  { value: 'investments', label: 'Investments' },
  { value: 'income', label: 'Income' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'rent-mortgage', label: 'Rent & Mortgage' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'cash-atm', label: 'Cash & ATM' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'other', label: 'Other' },
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number]['value'];
