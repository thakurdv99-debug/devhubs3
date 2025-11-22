import Navbar from "@shared/components/layout/NavBar";
const Careers = () => (
  <>
    <Navbar />
    <div className="max-w-4xl mx-auto py-20 px-6 text-gray-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Careers at DevHubs</h1>
      <p className="mb-6">
        At DevHubs, we're building a platform to shape the future of developer
        collaboration and opportunity. While we aren’t actively hiring right
        now, we’re always excited to connect with talented individuals who share
        our passion for empowering developers.
      </p>

      <h2 className="text-2xl font-bold my-6">Our Mission</h2>
      <p className="mb-6">
        DevHubs is on a mission to connect junior developers with real-world
        projects, mentorship, and community support. Our team is passionate
        about helping developers grow through collaboration, learning, and
        real-world experience.
      </p>

      <h2 className="text-2xl font-bold my-6">What We Value</h2>
      <ul className="list-disc ml-6 mb-6">
        <li>Passion for community, learning, and collaboration</li>
        <li>Growth mindset and continuous improvement</li>
        <li>Respect, inclusion, and empathy in the developer space</li>
        <li>Creativity, ownership, and curiosity</li>
      </ul>

      <h2 className="text-2xl font-bold my-6">Future Opportunities</h2>
      <p className="mb-6">
        As we grow, we’ll be looking for passionate people to join our team in
        areas like:
      </p>
      <ul className="list-disc ml-6 mb-6">
        <li>Frontend Development (React.js)</li>
        <li>Backend Engineering (Node.js, MongoDB)</li>
        <li>Community & Events Management</li>
        <li>Product & Design</li>
      </ul>

      <h2 className="text-2xl font-bold my-6">
        Interested in Working With Us?
      </h2>
      <p className="mb-6">
        If you’d like to stay connected for future opportunities, feel free to
        email us at <span className="text-blue-400">devhubs526@gmail.com</span>.
        Share a little about yourself, your skills, and why you’re interested in
        DevHubs.
      </p>

      <p className="italic text-gray-400">
        We’ll keep your details on file and reach out when relevant roles open
        up.
      </p>
    </div>
  </>
);

export default Careers;
