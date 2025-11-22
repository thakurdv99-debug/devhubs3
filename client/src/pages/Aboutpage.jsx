import { FaUsers, FaCode, FaRocket, FaLaptopCode } from "react-icons/fa";
import { Link } from "react-router-dom";
import Navbar from "@shared/components/layout/NavBar";
import { motion } from "framer-motion";
import { useEffect } from "react";

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const titleAnimation = {
    initial: { opacity: 0, y: -20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut" 
      }
    }
  };

  const buttonAnimation = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5 }
    },
    hover: { 
      scale: 1.05,
      backgroundColor: "#0087b5",
      boxShadow: "0px 0px 15px rgba(0, 168, 232, 0.5)"
    },
    tap: { scale: 0.95 }
  };
  
  // Particle animation for background effect
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push(
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-[#00A8E8] opacity-20"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.5
          }}
          animate={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: [0.1, 0.5, 0.1]
          }}
          transition={{ 
            duration: 10 + Math.random() * 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      );
    }
    return particles;
  };

  return (  
    <>
      <Navbar />
      <div className="bg-[#121212] text-white min-h-screen px-6 md:px-20 pt-24 pb-10 overflow-hidden relative">
        {/* Animated background particles */}
        {generateParticles()}
        
        {/* Floating code snippets in background */}
        <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute text-xs top-20 left-10 font-mono"
            animate={{ y: [0, -100], opacity: [0.5, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
          >
            {`function connect() {`}<br />
            {`  return hub.join();`}<br />
            {`}`}
          </motion.div>
          <motion.div 
            className="absolute text-xs bottom-40 right-10 font-mono"
            animate={{ y: [0, -150], opacity: [0.5, 0] }}
            transition={{ duration: 20, repeat: Infinity, delay: 5 }}
          >
            {`const developer = new`}<br />
            {`DevHub.Profile({`}<br />
            {`  skills: ['react', 'node']`}<br />
            {`});`}
          </motion.div>
        </div>
        
        {/* Hero Section with highlighted text */}
        <motion.section 
          className="text-center py-12 relative z-10"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <motion.div
            className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[#00A8E8] filter blur-[100px] opacity-20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold"
            variants={titleAnimation}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00A8E8] to-[#5ce1e6]">Empowering Developers.</span>
            <br />
            <span className="text-white">Building the Future.</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-300 mt-6 max-w-2xl mx-auto"
            variants={fadeIn}
          >
            Dev Hub is a platform designed for developers to <span className="text-[#00A8E8] font-semibold">connect</span>, <span className="text-[#00A8E8] font-semibold">collaborate</span>, and <span className="text-[#00A8E8] font-semibold">grow</span> in a thriving tech community.
          </motion.p>
          
          <motion.div
            className="mt-10"
            variants={buttonAnimation}
            whileHover="hover"
            whileTap="tap"
          >
            <Link to="/createaccount">
              <button className="bg-[#00A8E8] text-black px-8 py-4 rounded-full font-semibold transition duration-300 flex items-center mx-auto">
                Join Dev Hub Today
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </button>
            </Link>
          </motion.div>
          
          {/* Added: Social proof */}
          <motion.div 
            className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span>10,000+ active developers</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
              <span>5,000+ completed projects</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
              <span>24/7 global collaboration</span>
            </div>
          </motion.div>
        </motion.section>

        {/* What is Dev Hub? - with animated illustration */}
        <motion.section 
          className="text-center py-16 relative"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#00A8E8] rounded-full filter blur-[120px] opacity-10" />
          
          <motion.h2 
            className="text-3xl md:text-4xl font-semibold text-[#00A8E8]"
            variants={titleAnimation}
          >
            What is Dev Hub?
          </motion.h2>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 mt-8">
            {/* Added: Simple animated illustration */}
            <motion.div 
              className="w-64 h-64 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.div className="absolute inset-0 border-4 border-dashed border-[#00A8E8] opacity-20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              />
              <motion.div className="absolute inset-4 border-4 border-dashed border-[#00A8E8] opacity-40 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[#1E1E1E] p-4 rounded-lg shadow-lg">
                  <FaCode className="text-[#00A8E8] text-5xl mx-auto" />
                </div>
              </div>
              {/* Orbiting elements */}
              <motion.div 
                className="absolute w-12 h-12 bg-[#1E1E1E] rounded-lg shadow-lg flex items-center justify-center"
                animate={{ 
                  x: [0, 40, 0, -40, 0], 
                  y: [-40, 0, 40, 0, -40],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <FaUsers className="text-[#00A8E8] text-xl" />
              </motion.div>
              <motion.div 
                className="absolute w-10 h-10 bg-[#1E1E1E] rounded-lg shadow-lg flex items-center justify-center"
                animate={{ 
                  x: [30, 0, -30, 0, 30], 
                  y: [0, 30, 0, -30, 0],
                  rotate: [0, 90, 180, 270, 360]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <FaRocket className="text-[#00A8E8] text-lg" />
              </motion.div>
            </motion.div>
            
            <motion.p 
              className="text-gray-300 mt-4 max-w-xl text-left"
              variants={fadeIn}
            >
              Dev Hub is the <span className="text-[#00A8E8] font-semibold">first</span> developer-centric social platform that combines networking, real-time collaboration, 
              and skill-building in one place. Whether you're a beginner or an expert, Dev Hub helps you grow, connect, and showcase your work.
              <br /><br />
              <span className="text-white font-medium">Our platform is built by developers, for developers.</span>
            </motion.p>
          </div>
        </motion.section>

        {/* Core Features - with improved cards */}
        <motion.section 
          className="py-16 relative"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-[#00A8E8] rounded-full filter blur-[120px] opacity-10" />
          
          <motion.h2 
            className="text-3xl md:text-4xl font-semibold text-[#00A8E8] text-center"
            variants={titleAnimation}
          >
            Core Features
          </motion.h2>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10"
            variants={staggerContainer}
          >
            <FeatureCard 
              icon={<FaUsers size={30} />} 
              title="Developer Profiles" 
              text="Showcase your skills, projects, and experience with interactive portfolios." 
              index={0}
              color="#3498db"
            />
            <FeatureCard 
              icon={<FaCode size={30} />} 
              title="Coding Rooms" 
              text="Collaborate in real time with integrated terminals, chat, and screen sharing." 
              index={1}
              color="#2ecc71"
            />
            <FeatureCard 
              icon={<FaRocket size={30} />} 
              title="Live Coding Events" 
              text="Compete, learn, and participate in challenges with devs worldwide." 
              index={2}
              color="#9b59b6"
            />
            <FeatureCard 
              icon={<FaLaptopCode size={30} />} 
              title="Project Hub" 
              text="Share projects, get feedback, and find passionate collaborators." 
              index={3}
              color="#e74c3c"
            />
          </motion.div>
        </motion.section>

        {/* Mission - with parallax effect */}
        <motion.section 
          className="py-16 text-center relative"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <motion.div 
            className="absolute inset-0 flex items-center justify-center opacity-5 text-7xl font-bold"
            initial={{ y: 0 }}
            whileInView={{ y: -20 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            COMMUNITY
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl font-semibold text-[#00A8E8] relative z-10"
            variants={titleAnimation}
          >
            Our Mission
          </motion.h2>
          
          <motion.div 
            className="mt-8 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="w-24 h-1 bg-[#00A8E8] mx-auto mb-8" />
            <p className="text-gray-300 mt-4 max-w-3xl mx-auto text-xl leading-relaxed">
              To build an <span className="text-white font-semibold">inclusive</span> and <span className="text-white font-semibold">innovative</span> space where developers can connect, learn, and grow through real-time collaboration and knowledge sharing.
            </p>
            
            {/* Added counter stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              <CounterStat number="10k+" label="Developers" />
              <CounterStat number="500+" label="Live Events" />
              <CounterStat number="1.2M+" label="Code Lines" />
              <CounterStat number="45+" label="Countries" />
            </div>
          </motion.div>
        </motion.section>

        {/* Why Dev Hub? - with improved layout */}
        <motion.section 
          className="py-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-semibold text-[#00A8E8] text-center"
            variants={titleAnimation}
          >
            Why Dev Hub?
          </motion.h2>
          
          <motion.div 
            className="grid md:grid-cols-2 gap-8 mt-10"
            variants={staggerContainer}
          >
            <WhyCard 
              title="For Beginners" 
              text="Learn from experts, find mentors, and work on real-world projects to accelerate your growth." 
              index={0}
              icon="🚀"
            />
            <WhyCard 
              title="For Professionals" 
              text="Network with top developers, contribute to open-source, and get recognized in the global dev community." 
              index={1}
              icon="💼"
            />
            <WhyCard 
              title="For Teams & Startups" 
              text="Collaborate in live coding rooms, streamline development workflows, and recruit top talent." 
              index={2}
              icon="👥"
            />
            <WhyCard 
              title="AI-Powered Assistance" 
              text="Get intelligent code suggestions, personalized project recommendations, and learning resources." 
              index={3}
              icon="🤖"
            />
          </motion.div>
        </motion.section>

        {/* Testimonials Section - NEW */}
        <motion.section
          className="py-16 relative"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#00A8E8] rounded-full filter blur-[120px] opacity-10" />
          
          <motion.h2 
            className="text-3xl md:text-4xl font-semibold text-[#00A8E8] text-center"
            variants={titleAnimation}
          >
            Developer Stories
          </motion.h2>
          
          <motion.div
            className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
          >
            <Testimonial 
              quote="Just got placed at TCS! 🎉 Dev Hub helped me so much - I was clueless about building a portfolio but found amazing mentors here who guided me through everything. The community is super supportive!" 
              author="Priya Sharma"
              role="Final Year B.Tech, Mumbai University"
              index={0}
            />
            <Testimonial 
              quote="Bro, I was literally failing in DSA! 😅 Found study buddies from IIT Delhi on Dev Hub and we practiced together daily. Finally cracked Amazon's interview! This platform is a lifesaver for interview prep." 
              author="Rahul Verma"
              role="Final Year CSE, DTU"
              index={1}
            />
            <Testimonial 
              quote="From a tier-3 college and everyone said I won't get a good job. But Dev Hub helped me showcase my projects properly and I got hired by a cool Bangalore startup! Never give up guys! 💪" 
              author="Amit Patel"
              role="Final Year IT, Local Engineering College"
              index={2}
            />
            <Testimonial 
              quote="Was preparing for GATE but wanted to try IT too. Dev Hub's coding challenges are so fun and the mentors are really helpful. Got placed at Infosys! Still can't believe it happened! 😊" 
              author="Neha Singh"
              role="Final Year ECE, State University"
              index={3}
            />
          </motion.div>
        </motion.section>

        {/* Join Dev Hub CTA - with improved design */}
        <motion.section 
          className="text-center py-16 relative overflow-hidden"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#001e2b] to-[#004767] rounded-3xl opacity-50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.5 }}
            viewport={{ once: true }}
          />
          
          <div className="p-8 md:p-12 relative z-10">
            <motion.h2 
              className="text-3xl md:text-5xl font-bold text-white"
              variants={titleAnimation}
            >
              Join Dev Hub Today
            </motion.h2>
            
            <motion.p 
              className="text-gray-300 mt-4 text-lg max-w-2xl mx-auto"
              variants={fadeIn}
            >
              Be part of the future of developer networking. Start building, learning, and connecting today.
            </motion.p>
            
            <motion.div
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div
                variants={buttonAnimation}
                whileHover="hover"
                whileTap="tap"
              >
                <Link to="/createaccount">
                  <button className="bg-[#00A8E8] text-black px-8 py-3 rounded-lg font-semibold transition duration-300 flex items-center">
                    Create Account
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      →
                    </motion.span>
                  </button>
                </Link>
              </motion.div>
              
              <motion.div
                variants={buttonAnimation}
                whileHover="hover"
                whileTap="tap"
              >
                <Link to="/loginaccount">
                  <button className="bg-transparent text-[#00A8E8] border-2 border-[#00A8E8] px-8 py-3 rounded-lg font-semibold transition duration-300">
                    Log In
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </>
  );
};

// Feature Card Component with animation
const FeatureCard = ({ icon, title, text, index, color }) => {
  const cardVariants = {
    initial: { 
      opacity: 0,
      y: 50,
      scale: 0.9
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1
      }
    }
  };

  const iconVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.1 + index * 0.1
      }
    },
    hover: {
      scale: 1.1,
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div 
      className="bg-[#1E1E1E] p-6 rounded-xl text-center shadow-lg border-t-4 relative overflow-hidden group"
      style={{ borderColor: color }}
      variants={cardVariants}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
    >
      {/* Background glow effect on hover */}
      <motion.div 
        className="absolute -inset-1 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
        style={{ background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` }}
      />
      
      <motion.div 
        className="text-[#00A8E8] mb-4 flex justify-center relative"
        variants={iconVariants}
        whileHover="hover"
        style={{ color }}
      >
        <div className="relative">
          {icon}
          <motion.div 
            className="absolute -inset-4 rounded-full opacity-20"
            style={{ background: color }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
      
      <motion.h3 
        className="text-xl font-semibold mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p 
        className="text-gray-400 mt-2"
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

// Why Dev Hub Card Component with animation
const WhyCard = ({ title, text, index, icon }) => {
  const cardVariants = {
    initial: { 
      opacity: 0,
      x: index % 2 === 0 ? -50 : 50
    },
    animate: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1
      }
    }
  };

  return (
    <motion.div 
      className="bg-[#1E1E1E] p-6 rounded-xl shadow-lg relative overflow-hidden"
      variants={cardVariants}
      whileHover={{ 
        y: -5, 
        boxShadow: "0px 10px 20px rgba(0, 168, 232, 0.2)",
        transition: { duration: 0.3 }
      }}
    >
      {/* New corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
        <div className="absolute transform rotate-45 bg-[#00A8E8] text-black text-xs font-semibold py-1 right-[-20px] top-[16px] w-[70px] text-center">
          NEW
        </div>
      </div>
      
      <div className="flex items-start mb-4">
        <span className="text-3xl mr-3">{icon}</span>
        <motion.h3 
          className="text-xl font-semibold text-[#00A8E8]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 + index * 0.1 } }}
        >
          {title}
        </motion.h3>
      </div>
      
      <motion.p 
        className="text-gray-400 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.3 + index * 0.1 } }}
      >
        {text}
      </motion.p>
      
      <motion.div 
        className="mt-4 text-[#00A8E8] flex items-center text-sm font-medium cursor-pointer"
        whileHover={{ x: 5 }}
      >
        Learn more
        <motion.span
          className="ml-1"
          animate={{ x: [0, 3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          →
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

// NEW Counter Stat Component
const CounterStat = ({ number, label }) => {
  return (
    <motion.div 
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <motion.div 
        className="text-3xl md:text-4xl font-bold text-[#00A8E8]"
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
      >
        {number}
      </motion.div>
      <div className="text-gray-400 mt-2">{label}</div>
    </motion.div>
  );
};

// NEW Testimonial Component
const Testimonial = ({ quote, author, role, index }) => {
  return (
    <motion.div 
      className="bg-[#1E1E1E] p-6 rounded-xl shadow-lg relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <div className="text-[#00A8E8] text-4xl absolute -top-2 left-4 opacity-30">"</div>
      <p className="text-gray-300 italic relative z-10 mb-6">{quote}</p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00A8E8] to-[#3498db] flex items-center justify-center text-white font-semibold">
          {author.split(' ')[0][0]}{author.split(' ')[1][0]}
        </div>
        <div className="ml-3">
          <div className="font-semibold text-white">{author}</div>
          <div className="text-sm text-gray-400">{role}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default AboutPage;
