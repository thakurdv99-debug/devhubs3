import { motion } from "framer-motion";

const EmptyState = ({ 
  title = "No results found", 
  description = "Try adjusting your search criteria or filters to find more content.",
  icon = "🔍",
  actionText = "Clear Filters",
  onAction = null,
  showAction = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex items-center justify-center p-8"
    >
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-6xl mb-6"
        >
          {icon}
        </motion.div>
        
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold text-white mb-3"
        >
          {title}
        </motion.h3>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6 leading-relaxed"
        >
          {description}
        </motion.p>
        
        {showAction && onAction && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onAction}
            className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#00A8E8]/20 transition-all duration-300 transform hover:scale-105"
          >
            {actionText}
          </motion.button>
        )}
        
        {/* Decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex justify-center space-x-2"
        >
          <div className="w-2 h-2 bg-[#00A8E8] rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[#00A8E8] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#00A8E8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmptyState;
