import Navbar from "@shared/components/layout/NavBar";
const CommunityGuidelines = () => (
  <>
    <Navbar />
    <div className="max-w-4xl mx-auto py-20 px-6 text-gray-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Community Guidelines</h1>

      <p className="mb-6">
        DevHubs is a platform for developers to collaborate, learn, and grow
        together. These guidelines are designed to foster a respectful and
        productive environment for everyone.
      </p>

      <h2 className="text-2xl font-bold my-6">1. Be Respectful</h2>
      <p className="mb-6">
        Treat all users with respect. Personal attacks, harassment, hate speech,
        and discrimination will not be tolerated.
      </p>

      <h2 className="text-2xl font-bold my-6">2. Keep it Professional</h2>
      <p className="mb-6">
        DevHubs is a professional space for developers. Avoid using offensive
        language, and stay focused on meaningful, constructive discussions.
      </p>

      <h2 className="text-2xl font-bold my-6">
        3. No Spam or Irrelevant Content
      </h2>
      <ul className="list-disc ml-6 mb-6">
        <li>
          Do not post repetitive content or unrelated promotional material.
        </li>
        <li>Do not share irrelevant links or advertisements.</li>
      </ul>

      <h2 className="text-2xl font-bold my-6">
        4. Respect Intellectual Property
      </h2>
      <p className="mb-6">
        Only share content you own or have permission to share. Do not
        plagiarize or use copyrighted materials without permission.
      </p>

      <h2 className="text-2xl font-bold my-6">5. Reporting Violations</h2>
      <p className="mb-6">
        If you encounter behavior that violates these guidelines, please report
        it to <span className="text-blue-400">devhubs526@gmail.com</span>.
      </p>

      <h2 className="text-2xl font-bold my-6">6. Enforcement</h2>
      <p className="mb-6">
        Violations of these guidelines may result in warnings, suspension, or
        permanent removal from the platform at our discretion.
      </p>

      <h2 className="text-2xl font-bold my-6">7. Final Note</h2>
      <p className="mb-6">
        These guidelines exist to keep DevHubs a safe, welcoming place where
        developers can thrive. We appreciate your cooperation in maintaining a
        positive community.
      </p>
    </div>
  </>
);

export default CommunityGuidelines;
