import Navbar from "@shared/components/layout/NavBar";
const PrivacyPolicy = () => (
  <>
    <Navbar />
    <div className="max-w-4xl mx-auto py-20 px-6 text-gray-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-6">
        At DevHubs, we are committed to protecting your privacy. This Privacy
        Policy describes how we collect, use, store, and disclose your personal
        information when you use our services. By accessing or using DevHubs,
        you agree to the collection and use of information in accordance with
        this policy.
      </p>

      <h2 className="text-2xl font-bold my-6">1. Information We Collect</h2>
      <p className="mb-4">We may collect the following types of information:</p>
      <ul className="list-disc ml-6 mb-6">
        <li>
          <strong>Personal Identification Information:</strong> Name, email
          address, profile photo, and other identifying details you provide when
          creating an account.
        </li>
        <li>
          <strong>Usage Data:</strong> How you interact with the platform, such
          as the pages you visit, time spent, features used, and projects
          viewed.
        </li>
        <li>
          <strong>Device and Technical Data:</strong> IP address, browser type,
          operating system, and device identifiers.
        </li>
        <li>
          <strong>Third-Party Login Info:</strong> If you log in using GitHub,
          Google, or other OAuth providers, we collect certain authorized
          details.
        </li>
      </ul>

      <h2 className="text-2xl font-bold my-6">
        2. How We Use Your Information
      </h2>
      <p className="mb-6">We use your information to:</p>
      <ul className="list-disc ml-6 mb-6">
        <li>Create, manage, and secure your DevHubs account</li>
        <li>
          Provide access to collaboration features, project submissions, and
          messaging
        </li>
        <li>Communicate updates, newsletters, or service notifications</li>
        <li>
          Analyze platform usage to improve performance and user experience
        </li>
        <li>Detect, prevent, and address technical issues, fraud, or abuse</li>
      </ul>

      <h2 className="text-2xl font-bold my-6">3. Sharing of Information</h2>
      <p className="mb-4">
        We do not sell your personal data. We may share your information with:
      </p>
      <ul className="list-disc ml-6 mb-6">
        <li>
          Trusted third-party services (e.g., cloud providers, analytics tools)
          who help us operate DevHubs
        </li>
        <li>
          Legal authorities if required by law or to protect our legal rights
        </li>
        <li>
          Other users of the platform in accordance with your privacy settings
          (e.g., your public profile or project contributions)
        </li>
      </ul>

      <h2 className="text-2xl font-bold my-6">4. Data Storage & Security</h2>
      <p className="mb-6">
        Your data is stored on secure servers, and we use industry-standard
        encryption, access controls, and security protocols to protect it.
        However, no online service is 100% secure. We cannot guarantee absolute
        security but we take reasonable steps to protect your data.
      </p>

      <h2 className="text-2xl font-bold my-6">5. Your Rights & Choices</h2>
      <p className="mb-6">As a user, you have the right to:</p>
      <ul className="list-disc ml-6 mb-6">
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your account and data</li>
        <li>Withdraw consent for future data collection</li>
      </ul>
      <p className="mb-6">
        To exercise your rights, email us at{" "}
        <a href="mailto:devhubs526@gmail.com" className="text-blue-400">
          devhubs526@gmail.com
        </a>
        .
      </p>

      <h2 className="text-2xl font-bold my-6">6. Cookies & Tracking</h2>
      <p className="mb-6">
        We use cookies and similar technologies to personalize your experience,
        track usage, and remember preferences. For more information, please see
        our{" "}
        <a href="/cookie-policy" className="text-blue-400">
          Cookie Policy
        </a>
        .
      </p>

      <h2 className="text-2xl font-bold my-6">7. Third-Party Services</h2>
      <p className="mb-6">
        DevHubs may contain links to other websites or services that we do not
        operate. We are not responsible for the privacy practices of these third
        parties. We recommend reviewing their privacy policies before providing
        any information.
      </p>

      <h2 className="text-2xl font-bold my-6">8. Children's Privacy</h2>
      <p className="mb-6">
        Our platform is not intended for individuals under the age of 13. We do
        not knowingly collect personal data from children.
      </p>

      <h2 className="text-2xl font-bold my-6">9. Changes to This Policy</h2>
      <p className="mb-6">
        We may update this Privacy Policy from time to time. If we make material
        changes, we will notify you via email or through our platform. Please
        review this page periodically for the latest version.
      </p>

      <h2 className="text-2xl font-bold my-6">10. Contact Us</h2>
      <p>
        If you have questions or concerns regarding this Privacy Policy, please
        contact us at:
      </p>
      <p className="mt-4 text-blue-400">Email: devhubs526@gmail.com</p>
      <p>Address: DevHubs, New Delhi, India</p>
    </div>
  </>
);

export default PrivacyPolicy;
