'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ParsedTransaction, TransactionReviewData, TRANSACTION_CATEGORIES, TransactionCategory } from '@/types/transaction';

interface TransactionReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: TransactionReviewData;
  onSaveTransactions: (transactions: ParsedTransaction[]) => Promise<void>;
}

const TransactionReviewDialog: React.FC<TransactionReviewDialogProps> = ({
  isOpen,
  onClose,
  data,
  onSaveTransactions
}) => {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>(data.transactions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditStart = (transaction: ParsedTransaction) => {
    setEditingId(transaction.id);
    setEditingName(transaction.editableName);
  };

  const handleEditSave = (transactionId: string) => {
    setTransactions(transactions.map(tx => 
      tx.id === transactionId 
        ? { ...tx, editableName: editingName }
        : tx
    ));
    setEditingId(null);
    setEditingName('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleCategoryChange = (transactionId: string, category: TransactionCategory) => {
    setTransactions(transactions.map(tx => 
      tx.id === transactionId 
        ? { ...tx, category }
        : tx
    ));
  };

  const handleSaveAll = async () => {
    // Check if all transactions have categories
    const uncategorized = transactions.filter(tx => !tx.category);
    if (uncategorized.length > 0) {
      alert(`Please assign categories to all transactions. ${uncategorized.length} transactions are missing categories.`);
      return;
    }

    setIsSaving(true);
    try {
      await onSaveTransactions(transactions);
      onClose();
    } catch (error) {
      console.error('Error saving transactions:', error);
      alert('Failed to save transactions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP' 
    }).format(amount);
  };

  const totalDebits = transactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);
  const totalCredits = transactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
  const categorizedCount = transactions.filter(tx => tx.category).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 border-b border-border">
          <DialogTitle className="text-2xl font-bold">
            Review Transactions
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {data.accountInfo.accountName} • {data.accountInfo.statementPeriod}
          </p>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Summary Cards */}
          <div className="p-6 border-b border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <div className="w-3 h-2 border border-white rounded-sm relative">
                      <div className="absolute -top-0.5 left-0.5 w-0.5 h-1 bg-white"></div>
                      <div className="absolute -top-0.5 right-0.5 w-0.5 h-1 bg-white"></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Transactions</span>
                </div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">
                  {transactions.length}
                </p>
              </div>
              
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">£</span>
                  </div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-300">Total Debits</span>
                </div>
                <p className="text-2xl font-bold text-red-800 dark:text-red-200 mt-1">
                  {formatCurrency(totalDebits)}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">£</span>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-300">Total Credits</span>
                </div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">
                  {formatCurrency(totalCredits)}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-600 rounded-lg flex items-center justify-center transform rotate-12">
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-300">Categorized</span>
                </div>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200 mt-1">
                  {categorizedCount}/{transactions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            <div className="p-6">
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Date */}
                      <div className="lg:col-span-2">
                        <p className="text-sm font-medium text-foreground">
                          {transaction.date}
                        </p>
                      </div>

                      {/* Description/Name */}
                      <div className="lg:col-span-4">
                        {editingId === transaction.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 px-3 py-1 border border-input rounded-md text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave(transaction.id);
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleEditSave(transaction.id)}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-2 h-1 border-b-2 border-l-2 border-green-600 transform rotate-45 translate-y-[-1px]"></div>
                              </div>
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="p-1 text-muted-foreground hover:bg-accent rounded transition-colors"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-3 h-0.5 bg-current transform rotate-45 absolute"></div>
                                <div className="w-3 h-0.5 bg-current transform -rotate-45 absolute"></div>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-foreground">
                              {transaction.editableName}
                            </p>
                            <button
                              onClick={() => handleEditStart(transaction)}
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-2 h-2 border border-current rounded-sm relative">
                                  <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-current rounded-full"></div>
                                </div>
                              </div>
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Original: {transaction.originalDescription}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="lg:col-span-2">
                        <p className={`text-sm font-medium ${
                          transaction.type === 'credit' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                        </p>
                      </div>

                      {/* Category Dropdown */}
                      <div className="lg:col-span-3">
                        <select
                          value={transaction.category || ''}
                          onChange={(e) => handleCategoryChange(transaction.id, e.target.value as TransactionCategory)}
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-ring focus:border-ring ${
                            transaction.category 
                              ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200' 
                              : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200'
                          } [&>option]:bg-background [&>option]:text-foreground`}
                          required
                        >
                          <option value="" className="bg-background text-foreground">Select Category</option>
                          {TRANSACTION_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value} className="bg-background text-foreground">
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Indicator */}
                      <div className="lg:col-span-1 flex justify-center">
                        {transaction.category ? (
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-muted/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  {categorizedCount} of {transactions.length} transactions categorized
                </p>
                {categorizedCount < transactions.length && (
                  <p className="text-xs text-destructive mt-1">
                    Please categorize all transactions before saving
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={categorizedCount < transactions.length || isSaving}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Transactions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionReviewDialog;
