import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FilterSidebar = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  isOpen, 
  onClose 
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const techStackOptions = [
    { value: "MERN Stack", label: "MERN Stack" },
    { value: "MEAN Stack", label: "MEAN Stack" },
    { value: "MEVN Stack", label: "MEVN Stack" },
    { value: "Next.js", label: "Next.js" },
    { value: "NestJS", label: "NestJS" },
    { value: "Django", label: "Django" },
    { value: "Flask", label: "Flask" },
    { value: "Spring Boot", label: "Spring Boot" },
    { value: "ASP.NET", label: "ASP.NET" },
    { value: "React Native", label: "React Native" },
    { value: "Flutter", label: "Flutter" },
    { value: "Swift", label: "Swift" },
    { value: "Kotlin", label: "Kotlin" },
    { value: "TensorFlow", label: "TensorFlow" },
    { value: "PyTorch", label: "PyTorch" },
    { value: "Apache Spark", label: "Apache Spark" },
    { value: "Solidity", label: "Solidity" },
    { value: "Rust", label: "Rust" },
    { value: "Docker", label: "Docker" },
    { value: "Kubernetes", label: "Kubernetes" },
    { value: "AWS", label: "AWS" },
    { value: "GCP", label: "GCP" },
    { value: "MySQL", label: "MySQL" },
    { value: "MongoDB", label: "MongoDB" },
    { value: "PostgreSQL", label: "PostgreSQL" },
    { value: "Firebase", label: "Firebase" },
    { value: "Redis", label: "Redis" },
    { value: "Unity", label: "Unity" },
    { value: "Unreal Engine", label: "Unreal Engine" },
    { value: "IoT", label: "IoT" },
    { value: "C++", label: "C++" },
    { value: "Go", label: "Go" },
    { value: "Cybersecurity", label: "Cybersecurity" },
    { value: "Other", label: "Other" }
  ];

  const budgetOptions = [
    { value: "Micro_Budget", label: "Micro Budget (Below ₹500)" },
    { value: "Low_Budget", label: "Low Budget (₹500 - ₹2,000)" },
    { value: "Medium_Budget", label: "Medium Budget (₹2,000 - ₹10,000)" },
    { value: "High_Budget", label: "High Budget (₹10,000+)" }
  ];

  const contributorOptions = [
    { value: "Solo", label: "Solo (1 Contributor)" },
    { value: "Small_Team", label: "Small Team (2-4 Contributors)" },
    { value: "Medium_Team", label: "Medium Team (5-10 Contributors)" },
    { value: "Large_Team", label: "Large Team (10+ Contributors)" }
  ];

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const FilterGroup = ({ label, children, className = "" }) => (
    <div className={`filter-group ${className}`}>
      <label className="block text-[#00A8E8] mb-3 font-semibold text-sm uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );

  const SelectField = ({ value, onChange, options, placeholder, "aria-label": ariaLabel }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg p-3 focus:border-[#00A8E8] focus:ring-2 focus:ring-[#00A8E8]/20 focus:outline-none transition-all duration-300 text-white"
      aria-label={ariaLabel}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const sidebarContent = (
    <div className="bg-[#1E1E1E] p-4 lg:p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#333] pb-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg lg:text-xl font-bold text-[#00A8E8] flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter Projects
          </h2>
          {isMobile && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close filters"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="space-y-5">
        {/* Technology Stack Filter */}
        <FilterGroup label="Technology Stack">
          <SelectField
            value={filters.techStack}
            onChange={(value) => onFilterChange('techStack', value)}
            options={techStackOptions}
            placeholder="All Technologies"
            aria-label="Filter by technology stack"
          />
        </FilterGroup>

        {/* Budget Range Filter */}
        <FilterGroup label="Starting Bid">
          <SelectField
            value={filters.budget}
            onChange={(value) => onFilterChange('budget', value)}
            options={budgetOptions}
            placeholder="All Budgets"
            aria-label="Filter by budget range"
          />
        </FilterGroup>

        {/* Contributors Filter */}
        <FilterGroup label="Number of Contributors">
          <SelectField
            value={filters.contributor}
            onChange={(value) => onFilterChange('contributor', value)}
            options={contributorOptions}
            placeholder="All Contributors"
            aria-label="Filter by number of contributors"
          />
        </FilterGroup>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#333]">
          <button
            onClick={onClearFilters}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2.5 px-4 rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={onClose}
            />
            
            {/* Sidebar */}
            <motion.aside
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-0 top-0 h-screen w-80 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="w-full">
      {sidebarContent}
    </div>
  );
};

export default FilterSidebar;
