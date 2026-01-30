import React from 'react';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  /** Optional title for the button (tooltip/aria) */
  title?: string;
  /** Optional class names for styling (e.g. theme colors) */
  className?: string;
  /** Optional label text next to icon */
  label?: string;
}

/**
 * Button that triggers the browser print dialog to print the current page (records).
 * Use on admin list pages so users can print the visible records.
 */
export default function PrintButton({ title = 'Print records', className, label = 'Print' }: PrintButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  const defaultClass =
    'inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white dark:bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm';

  return (
    <button
      type="button"
      onClick={handlePrint}
      title={title}
      aria-label={title}
      className={className ?? defaultClass}
      data-no-print
    >
      <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
    </button>
  );
}
