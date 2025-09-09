'use server';
import { auth } from '@clerk/nextjs/server';

interface ProcessStatementResult {
  success?: boolean;
  text?: string;
  error?: string;
}

async function processBankStatement(formData: FormData): Promise<ProcessStatementResult> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  const file = formData.get('file') as File;
  if (!file) return { error: 'No file uploaded' };
  if (file.type !== 'application/pdf') return { error: 'Invalid file type. Please upload a PDF file.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'File size exceeds 10MB limit' };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('=== PDF PROCESSING START ===');
    console.log('File name:', file.name);
    console.log('File size:', (file.size / 1024).toFixed(2), 'KB');
    console.log('User ID:', userId);

    // Dynamic import for pdfjs-dist to avoid bundling issues in Next.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker path for Next.js environment using CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    // Load PDF from buffer
    const loadingTask = pdfjsLib.getDocument({ 
      data: buffer,
      verbosity: 0 // Reduce console output
    });
    const pdf = await loadingTask.promise;

    let extractedText = '';
    const numPages = pdf.numPages;

    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      extractedText += pageText + '\n\n'; // Add page breaks
    }

    console.log('=== PDF TEXT EXTRACTION SUCCESS ===');
    console.log('Number of pages:', numPages);
    console.log('Extracted text length:', extractedText.length);
    console.log('=== EXTRACTED TEXT START ===');
    console.log(extractedText || 'No text extracted');
    console.log('=== EXTRACTED TEXT END ===');

    return { success: true, text: extractedText || 'No text could be extracted from the PDF' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error:any ) {
    console.error('Error processing PDF:', error);
    // More specific error messages for production debugging
    if (error.name === 'MissingPDFException' || error.message?.includes('Invalid PDF')) {
      return { error: 'Invalid or corrupted PDF file. Please upload a valid bank statement.' };
    }
    if (error.message?.includes('Password')) {
      return { error: 'PDF is password-protected. Please upload an unprotected file.' };
    }
    return { error: 'An unexpected error occurred while processing the PDF file.' };
  }
}

export default processBankStatement;