import Navbar from "@shared/components/layout/NavBar";
const Blog = () => (
  <>
    <Navbar />
    <div className="max-w-4xl mx-auto py-20 px-6 text-gray-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">DevHubs Blog</h1>
      <p className="mb-6">
        Welcome to the DevHubs Blog! This is where we’ll share updates,
        developer stories, and practical insights on how we’re building DevHubs
        for the future of tech collaboration.
      </p>

      <h2 className="text-2xl font-bold my-6">What's Coming:</h2>
      <ul className="list-disc ml-6 mb-6">
        <li>Tips for junior developers entering the industry</li>
        <li>Case studies from our community</li>
        <li>Behind-the-scenes on how we build DevHubs</li>
        <li>Tech breakdowns: React, Node.js, Firebase, MongoDB</li>
      </ul>

      <h2 className="text-2xl font-bold my-6">First Post Coming Soon!</h2>
      <p className="mb-6">
        Stay tuned as we kick off our first posts in the coming weeks.
      </p>
    </div>
  </>
);

export default Blog;
