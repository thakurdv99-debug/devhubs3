import { useState } from "react";
import { useNavigate } from "react-router-dom";

const FreeProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleStartBuilding = () => {
    // Navigate to contribution panel for the project
    navigate(`/contributionPage/${project._id}`);
  };

  const getTechStackColor = (tech) => {
    const colors = {
      'MERN Stack': 'bg-green-500/20 text-green-400 border-green-500/30',
      'MEAN Stack': 'bg-red-500/20 text-red-400 border-red-500/30',
      'MEVN Stack': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Next.js': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'React Native': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'Flutter': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'Django': 'bg-green-600/20 text-green-300 border-green-600/30',
      'Flask': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Spring Boot': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'ASP.NET': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'TensorFlow': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'PyTorch': 'bg-red-600/20 text-red-300 border-red-600/30',
      'Docker': 'bg-blue-600/20 text-blue-300 border-blue-600/30',
      'Kubernetes': 'bg-blue-700/20 text-blue-200 border-blue-700/30',
      'AWS': 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
      'GCP': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Firebase': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Unity': 'bg-gray-600/20 text-gray-300 border-gray-600/30',
      'Unreal Engine': 'bg-purple-600/20 text-purple-300 border-purple-600/30',
      'Rust': 'bg-orange-600/20 text-orange-300 border-orange-600/30',
      'Go': 'bg-cyan-600/20 text-cyan-300 border-cyan-600/30',
      'Cybersecurity': 'bg-red-700/20 text-red-200 border-red-700/30',
    };
    return colors[tech] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div
      className={`bg-gradient-to-br from-[#1a1a1a] to-[#232323] rounded-xl border border-gray-700 overflow-hidden transition-all duration-300 hover:border-[#00A8E8]/50 hover:shadow-lg hover:shadow-[#00A8E8]/20 group cursor-pointer ${
        isHovered ? 'transform scale-[1.02]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Image */}
      {project.Project_cover_photo && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={project.Project_cover_photo}
            alt={project.project_Title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute top-4 left-4">
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-500/30">
              Free Project
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Project Title */}
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-[#00A8E8] transition-colors">
          {project.project_Title}
        </h3>

        {/* Project Description */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
          {project.Project_Description}
        </p>

        {/* Technology Stack */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getTechStackColor(project.Project_tech_stack)}`}>
            {project.Project_tech_stack}
          </span>
        </div>

        {/* Project Stats */}
        <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Free Project</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Open to All</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStartBuilding}
          className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#0062E6] hover:to-[#00A8E8] transition-all duration-300 shadow-lg hover:shadow-[#00A8E8]/30 flex items-center justify-center group/btn"
        >
          <svg className="w-5 h-5 mr-2 group-hover/btn:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Start Building for Resume
        </button>

        {/* GitHub Link */}
        {project.Project_gitHub_link && (
          <div className="mt-3 text-center">
            <a
              href={project.Project_gitHub_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-[#00A8E8] transition-colors flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#00A8E8]/5 to-[#0062E6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default FreeProjectCard;
