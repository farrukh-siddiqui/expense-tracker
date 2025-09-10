'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { ParsedTransaction } from '@/types/transaction';

interface SaveTransactionsResult {
  success?: boolean;
  data?: {
    message: string;
    savedCount: number;
  };
  error?: string;
}

async function saveTransactions(transactions: ParsedTransaction[]): Promise<SaveTransactionsResult> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  if (!transactions || transactions.length === 0) {
    return { error: 'No transactions to save' };
  }

  try {
    console.log('=== SAVING TRANSACTIONS TO DATABASE ===');
    console.log('User ID:', userId);
    console.log('Transactions to save:', transactions.length);

    let savedCount = 0;

    // Save each transaction to the records table
    for (const transaction of transactions) {
      if (!transaction.category) {
        console.warn(`Skipping transaction ${transaction.id} - no category assigned`);
        continue;
      }

      // Parse date - convert "1 February" to proper date format
      let transactionDate: Date;
      try {
        // Assuming the year is 2019 based on the statement
        const year = 2019;
        const dateParts = transaction.date.split(' ');
        const day = parseInt(dateParts[0]);
        const monthName = dateParts[1];
        
        const monthMap: { [key: string]: number } = {
          'January': 0, 'February': 1, 'March': 2, 'April': 3,
          'May': 4, 'June': 5, 'July': 6, 'August': 7,
          'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        
        const month = monthMap[monthName];
        transactionDate = new Date(year, month, day);
      } catch (error) {
        console.error(`Error parsing date for transaction ${transaction.id}:`, error);
        transactionDate = new Date(); // Fallback to current date
      }

      // Insert into database
      try {
        await db.record.create({
          data: {
            userId,
            amount: transaction.type === 'debit' ? -transaction.amount : transaction.amount,
            text: transaction.editableName,
            category: transaction.category,
            date: transactionDate,
          }
        });
        
        savedCount++;
        console.log(`Saved transaction: ${transaction.editableName} - ${transaction.amount} - ${transaction.category}`);
      } catch (dbError) {
        console.error(`Error saving transaction ${transaction.id}:`, dbError);
        // Continue with other transactions even if one fails
      }
    }

    console.log(`Successfully saved ${savedCount} out of ${transactions.length} transactions`);

    return {
      success: true,
      data: {
        message: `Successfully saved ${savedCount} transactions`,
        savedCount
      }
    };

  } catch (error) {
    console.error('Error saving transactions:', error);
    return {
      error: 'An unexpected error occurred while saving transactions.'
    };
  }
}

export default saveTransactions;
