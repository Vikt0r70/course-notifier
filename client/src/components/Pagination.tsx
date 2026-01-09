import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './ui/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  // Build pages array with ellipsis
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push('...');
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  const PageButton = ({ 
    page, 
    isActive = false, 
    disabled = false 
  }: { 
    page: number | string; 
    isActive?: boolean; 
    disabled?: boolean;
  }) => {
    if (page === '...') {
      return <span className="px-2 text-zinc-500">...</span>;
    }

    return (
      <button
        onClick={() => onPageChange(page as number)}
        disabled={disabled}
        className={cn(
          'min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all duration-200',
          isActive
            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
            : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {page}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'flex items-center gap-1 px-3 h-10 rounded-lg font-medium transition-all duration-200',
          'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white',
          currentPage === 1 && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => (
          <PageButton 
            key={index} 
            page={page} 
            isActive={page === currentPage}
          />
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'flex items-center gap-1 px-3 h-10 rounded-lg font-medium transition-all duration-200',
          'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white',
          currentPage === totalPages && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
