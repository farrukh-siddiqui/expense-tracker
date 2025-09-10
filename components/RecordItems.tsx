'use client';
import { useState } from 'react';
import { Record } from '@/types/Records';
import deleteRecord from '@/app/actions/deleteRecord';

// Helper function to get category emoji
const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'Food':
      return '🍔';
    case 'Transportation':
      return '🚗';
    case 'Shopping':
      return '🛒';
    case 'Entertainment':
      return '🎬';
    case 'Bills':
      return '💡';
    case 'Healthcare':
      return '🏥';
    default:
      return '📦';
  }
};

const RecordItem = ({ record }: { record: Record }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteRecord = async (recordId: string) => {
    setIsLoading(true);
    await deleteRecord(recordId);
    setIsLoading(false);
  };

  // Get category color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Food': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20';
      case 'Transportation': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20';
      case 'Shopping': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20';
      case 'Entertainment': return 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20';
      case 'Bills': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
      case 'Healthcare': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  return (
    <div className='group flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-all duration-200'>
      {/* Left side - Category and Description */}
      <div className='flex items-center gap-3 flex-1'>
        {/* Category Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getCategoryColor(record?.category)}`}>
          <span className='text-sm'>{getCategoryEmoji(record?.category)}</span>
          <span>{record?.category}</span>
        </div>
        
        {/* Description and Date */}
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-foreground truncate'>
            {record?.category} Expense
          </p>
          <p className='text-xs text-muted-foreground'>
            {new Date(record?.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Right side - Amount and Delete */}
      <div className='flex items-center gap-3'>
        {/* Amount */}
        <div className='text-right'>
          <p className='text-sm font-semibold text-foreground'>
            ${record?.amount.toFixed(2)}
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => handleDeleteRecord(record.id)}
          className='opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200'
          disabled={isLoading}
          aria-label='Delete record'
        >
          {isLoading ? (
            <div className='w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin'></div>
          ) : (
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default RecordItem;
