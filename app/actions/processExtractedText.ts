'use server';
import { auth } from '@clerk/nextjs/server';
import { TransactionReviewData } from '@/types/transaction';
import { parseBankStatementWithAI } from '@/lib/ai';

interface ProcessExtractedTextResult {
  success?: boolean;
  data?: TransactionReviewData & {
    message: string;
    textLength: number;
    filename: string;
  };
  error?: string;
}

async function processExtractedText(formData: FormData): Promise<ProcessExtractedTextResult> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  const extractedText = formData.get('text') as string;
  const filename = formData.get('filename') as string;

  if (!extractedText) {
    return { error: 'No text data received' };
  }

  try {
    // Use AI to parse the extracted text into structured transaction data
    const parsedData = await parseBankStatementWithAI(extractedText);

    const responseData = {
      transactions: parsedData.transactions,
      accountInfo: parsedData.accountInfo,
      message: 'Text processed and transactions parsed successfully with AI',
      textLength: extractedText.length,
      filename: filename || 'Unknown'
    };

    return {
      success: true,
      data: responseData
    };

  } catch (error) {
    console.error('Error processing extracted text:', error);
    return {
      error: 'An unexpected error occurred while processing the extracted text.'
    };
  }
}

export default processExtractedText;