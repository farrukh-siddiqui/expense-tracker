'use client';
import { useState, useRef } from 'react';
import processExtractedText from '@/app/actions/processExtractedText';
import saveTransactions from '@/app/actions/saveTransactions';
import TransactionReviewDialog from './TransactionReviewDialog';
import { TransactionReviewData, ParsedTransaction } from '@/types/transaction';

// Type declaration for PDF.js global
declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (params: { data: Uint8Array; verbosity: number }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNum: number) => Promise<{
            getTextContent: () => Promise<{
              items: Array<{ str: string }>;
            }>;
          }>;
        }>;
      };
      GlobalWorkerOptions: {
        workerSrc: string;
      };
    };
  }
}

const UploadStatement = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionReviewData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setAlertMessage('Please upload a PDF file only');
      setAlertType('error');
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setAlertMessage('File size must be less than 10MB');
      setAlertType('error');
      return;
    }

    setUploadedFile(file);
    setAlertMessage('PDF uploaded successfully! Ready for analysis.');
    setAlertType('success');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = new Uint8Array(e.target?.result as ArrayBuffer);

          if (!window.pdfjsLib) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
              if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              }
            };
            document.head.appendChild(script);
            
            await new Promise((resolve) => {
              script.onload = resolve;
            });
          }

          const pdfjsLib = window.pdfjsLib;
          if (!pdfjsLib) {
            throw new Error('Failed to load PDF.js library');
          }
          const loadingTask = pdfjsLib.getDocument({ data: buffer, verbosity: 0 });
          const pdf = await loadingTask.promise;

          let extractedText = '';
          const numPages = pdf.numPages;

          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((item: any) => {
                return item.str || '';
              })
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            extractedText += pageText + '\n\n--- PAGE BREAK ---\n\n';
          }

          resolve(extractedText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setAlertMessage('Please upload a PDF file first');
      setAlertType('error');
      return;
    }

    setIsExtracting(true);
    setIsUploading(true);
    setAlertMessage(null);

    try {
      // Step 1: Extract text client-side
      setAlertMessage('Extracting text from PDF...');
      const extractedText = await extractTextFromPDF(uploadedFile);
      
      if (!extractedText) {
        throw new Error('No text could be extracted from the PDF');
      }

      // Step 2: Send text to server for processing
      setAlertMessage('Processing transactions...');
      const formData = new FormData();
      formData.append('text', extractedText);
      formData.append('filename', uploadedFile.name);

      const result = await processExtractedText(formData);

      if (result.error) {
        throw new Error(result.error);
      } else if (result.success && result.data) {
        // Check if we have the required fields
        if (result.data.transactions && result.data.accountInfo) {
          // Extract transaction data from result
          const reviewData: TransactionReviewData = {
            transactions: result.data.transactions,
            accountInfo: result.data.accountInfo
          };
          
          setTransactionData(reviewData);
          setIsModalOpen(true);
          setAlertMessage('Transactions extracted! Please review and categorize them.');
          setAlertType('success');
        } else {
          console.error('Missing required data fields in server response');
          setAlertMessage('Error: Invalid response structure from server.');
          setAlertType('error');
        }
      }
    } catch (error: unknown) {
      console.error('Error in analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze PDF. Please try again.';
      setAlertMessage(errorMessage);
      setAlertType('error');
    } finally {
      setIsExtracting(false);
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setAlertMessage(null);
    setAlertType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionData(null);
  };

  const handleSaveTransactions = async (transactions: ParsedTransaction[]) => {
    try {
      const result = await saveTransactions(transactions);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.success) {
        setAlertMessage(`Successfully saved ${result.data?.savedCount} transactions to your records!`);
        setAlertType('success');
        
        // Reset upload state
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error saving transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save transactions.';
      setAlertMessage(errorMessage);
      setAlertType('error');
      throw error; // Re-throw so modal can handle it
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='bg-card backdrop-blur-lg rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center'>
            <span className='text-white text-sm font-bold'>AI</span>
          </div>
          <h2 className='text-lg font-semibold text-card-foreground'>Bank Statement Analysis</h2>
        </div>
        <div className='pl-11'>
          <p className='text-xs text-muted-foreground'>AI-powered expense analysis and insights</p>
        </div>
      </div>

      {/* Alert Message */}
      {alertMessage && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
          alertType === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/50'
        }`}>
          <div className='flex items-center gap-2'>
            <span className={`w-1.5 h-1.5 rounded-full ${alertType === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {alertMessage}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className={`mb-4 border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
        isDragOver 
          ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' 
          : uploadedFile
            ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-900/5'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-700/20'
      }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {!uploadedFile ? (
          <div className='flex flex-col items-center gap-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-full flex items-center justify-center'>
              <span className='text-2xl'>📤</span>
            </div>
            <div className='space-y-2'>
              <h3 className='text-base font-semibold text-foreground'>Drop your bank statement PDF here</h3>
              <p className='text-sm text-muted-foreground'>
                or{' '}
                <button onClick={handleBrowseClick} className='text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors'>
                  browse to upload
                </button>
              </p>
            </div>
            <div className='flex items-center gap-4 text-xs text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <span className='w-1 h-1 bg-muted-foreground rounded-full'></span>
                PDF files only
              </div>
              <div className='flex items-center gap-1'>
                <span className='w-1 h-1 bg-muted-foreground rounded-full'></span>
                Max 10MB
              </div>
            </div>
          </div>
        ) : (
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center'>
                <span className='text-red-600 dark:text-red-400 text-lg'>📄</span>
              </div>
              <div>
                <p className='text-sm font-medium text-foreground'>{uploadedFile.name}</p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>{(uploadedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button onClick={handleRemoveFile} className='text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors'>
              <span className='text-lg'>✕</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Button */}
      {uploadedFile && (
        <div className="space-y-3">
          <button
            onClick={handleAnalyze}
            disabled={isUploading || isExtracting}
            className='w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed'
          >
            {isExtracting ? (
              <div className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                Extracting Text...
              </div>
            ) : isUploading ? (
              <div className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                Analyzing Statement...
              </div>
            ) : (
              'Analyze Statement'
            )}
          </button>
        </div>
      )}

      {/* Feature Info */}
      <div className='mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs'>
          <div className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
            <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></span>
            Extract transactions
          </div>
          <div className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
            <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></span>
            Categorize expenses
          </div>
          <div className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
            <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></span>
            Generate insights
          </div>
        </div>
      </div>

      {/* Transaction Review Modal */}
      {transactionData && (
        <TransactionReviewDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          data={transactionData}
          onSaveTransactions={handleSaveTransactions}
        />
      )}
    </div>
  );
};

export default UploadStatement;
