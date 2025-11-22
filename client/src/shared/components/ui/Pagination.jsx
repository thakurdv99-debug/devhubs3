import { motion } from "framer-motion";

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxVisiblePages = 5 
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  const PageButton = ({ page, isActive = false, isDisabled = false, children, onClick }) => (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative px-3 py-2 rounded-lg font-medium transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg shadow-[#00A8E8]/20' 
          : isDisabled
          ? 'text-gray-500 cursor-not-allowed'
          : 'text-gray-300 hover:text-white hover:bg-[#2A2A2A]'
        }
        min-w-[40px] h-[40px] flex items-center justify-center
      `}
      aria-label={children || `Page ${page}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children || page}
    </motion.button>
  );

  const NavigationButton = ({ direction, onClick, disabled, children }) => (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-1
        ${disabled
          ? 'text-gray-500 cursor-not-allowed'
          : 'text-gray-300 hover:text-white hover:bg-[#2A2A2A]'
        }
        min-w-[40px] h-[40px] flex items-center justify-center
      `}
      aria-label={`Go to ${direction} page`}
    >
      {children}
    </motion.button>
  );

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center space-x-2"
      aria-label="Pagination navigation"
    >
      {/* Previous Button */}
      <NavigationButton
        direction="previous"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </NavigationButton>

      {/* First Page */}
      {visiblePages[0] > 1 && (
        <>
          <PageButton page={1} onClick={() => onPageChange(1)}>
            1
          </PageButton>
          {visiblePages[0] > 2 && (
            <span className="px-2 text-gray-500">...</span>
          )}
        </>
      )}

      {/* Visible Pages */}
      {visiblePages.map((page) => (
        <PageButton
          key={page}
          page={page}
          isActive={page === currentPage}
          onClick={() => onPageChange(page)}
        />
      ))}

      {/* Last Page */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <PageButton page={totalPages} onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PageButton>
        </>
      )}

      {/* Next Button */}
      <NavigationButton
        direction="next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </NavigationButton>

      {/* Page Info */}
      <div className="ml-4 text-sm text-gray-400 hidden sm:block">
        Page {currentPage} of {totalPages}
      </div>
    </motion.nav>
  );
};

export default Pagination;
