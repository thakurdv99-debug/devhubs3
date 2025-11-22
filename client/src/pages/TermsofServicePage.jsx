import Navbar from "@shared/components/layout/NavBar";
const TermsOfService = () => (
  <>
    <Navbar />
    <div className="max-w-4xl mx-auto py-20 px-6 text-gray-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="mb-6">
        Welcome to DevHubs. These Terms of Service ("Terms") govern your access
        and use of our platform, services, and any related content. By accessing
        or using DevHubs, you agree to comply with these Terms and our Privacy
        Policy.
      </p>

      <h2 className="text-2xl font-bold my-6">1. Using DevHubs</h2>
      <p className="mb-4">
        You must be at least 13 years old to use DevHubs. You agree to provide
        accurate information when creating your account and to keep it updated.
      </p>
      <p className="mb-4">
        You agree not to misuse DevHubs by interfering with its normal operation
        or attempting to access it using methods other than through the
        interfaces provided.
      </p>

      <h2 className="text-2xl font-bold my-6">2. User Conduct</h2>
      <ul className="list-disc ml-6 mb-6">
        <li>Respect other members of the community at all times.</li>
        <li>
          Do not post or share illegal, harmful, abusive, or offensive content.
        </li>
        <li>Do not harass, threaten, or abuse others.</li>
        <li>Do not attempt to breach the security of our systems.</li>
        <li>Do not impersonate other users or organizations.</li>
      </ul>

      <h2 className="text-2xl font-bold my-6">3. Account Security</h2>
      <p className="mb-6">
        You are responsible for maintaining the confidentiality of your account
        and password. You agree to notify us immediately of any unauthorized use
        of your account.
      </p>

      <h2 className="text-2xl font-bold my-6">4. Intellectual Property</h2>
      <p className="mb-6">
        All content on DevHubs, including text, code snippets, designs, and
        graphics, is either owned by DevHubs or used with permission. You may
        not reproduce or redistribute our content without written permission.
      </p>

      <h2 className="text-2xl font-bold my-6">5. Termination</h2>
      <p className="mb-6">
        We reserve the right to suspend or terminate your access if you violate
        these Terms or engage in conduct that we deem harmful to DevHubs or its
        community.
      </p>

      <h2 className="text-2xl font-bold my-6">6. Disclaimers</h2>
      <p className="mb-6">
        DevHubs is provided "as is" without warranties of any kind. We make no
        guarantees regarding the availability, reliability, or accuracy of our
        services.
      </p>

      <h2 className="text-2xl font-bold my-6">7. Limitation of Liability</h2>
      <p className="mb-6">
        DevHubs will not be liable for any indirect, incidental, or
        consequential damages resulting from your use of our platform.
      </p>

      <h2 className="text-2xl font-bold my-6">8. Changes to These Terms</h2>
      <p className="mb-6">
        We may update these Terms from time to time. Continued use of the
        platform means you accept the updated Terms.
      </p>

      <h2 className="text-2xl font-bold my-6">9. Governing Law</h2>
      <p className="mb-6">
        These Terms are governed by the laws of India. Disputes will be resolved
        in the courts located in New Delhi, India.
      </p>

      <h2 className="text-2xl font-bold my-6">10. Contact</h2>
      <p>
        For questions or concerns, please contact us at{" "}
        <span className="text-blue-400">devhubs526@gmail.com</span>.
      </p>
    </div>
  </>
);

export default TermsOfService;
