'use server';
import { auth } from '@clerk/nextjs/server';

interface ProcessExtractedTextResult {
  success?: boolean;
  data?: {
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
    console.log('=== SERVER-SIDE TEXT PROCESSING START ===');
    console.log('User ID:', userId);
    console.log('Filename:', filename || 'Unknown');
    console.log('Text length:', extractedText.length, 'characters');
    console.log('=== EXTRACTED TEXT START ===');
    console.log(extractedText);
    console.log('=== EXTRACTED TEXT END ===');

    // Here you would add your AI processing logic
    // For now, just return success with the text data
    return {
      success: true,
      data: {
        message: 'Text processed successfully',
        textLength: extractedText.length,
        filename: filename || 'Unknown'
      }
    };

  } catch (error) {
    console.error('Error processing extracted text:', error);
    return {
      error: 'An unexpected error occurred while processing the extracted text.'
    };
  }
}

export default processExtractedText;
