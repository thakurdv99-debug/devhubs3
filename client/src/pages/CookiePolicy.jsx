import Navbar from "@shared/components/layout/NavBar";
const CookiePolicy = () => (
  <>
    <Navbar />
    <div className="max-w-4xl mx-auto py-20 px-6 text-gray-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>

      <p className="mb-6">
        This Cookie Policy explains how DevHubs uses cookies and similar
        technologies to recognize you when you visit our website. It explains
        what these technologies are and why we use them, as well as your rights
        to control their use.
      </p>

      <h2 className="text-2xl font-bold my-6">1. What Are Cookies?</h2>
      <p className="mb-6">
        Cookies are small data files placed on your device when you visit a
        website. Cookies help us understand user behavior, improve user
        experience, and deliver relevant content.
      </p>

      <h2 className="text-2xl font-bold my-6">2. How We Use Cookies</h2>
      <ul className="list-disc ml-6 mb-6">
        <li>To recognize you when you return to our platform.</li>
        <li>To keep you logged in and manage your session securely.</li>
        <li>To analyze site performance through analytics tools.</li>
        <li>To personalize your experience based on your preferences.</li>
      </ul>

      <h2 className="text-2xl font-bold my-6">3. Types of Cookies We Use</h2>
      <ul className="list-disc ml-6 mb-6">
        <li>
          <strong>Essential Cookies:</strong> Required for basic website
          functionality.
        </li>
        <li>
          <strong>Performance Cookies:</strong> Help us understand how you use
          our site.
        </li>
        <li>
          <strong>Functional Cookies:</strong> Remember your settings and
          preferences.
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Help us improve our platform with
          usage data.
        </li>
      </ul>

      <h2 className="text-2xl font-bold my-6">4. Managing Cookies</h2>
      <p className="mb-6">
        Most browsers allow you to refuse or delete cookies. However, blocking
        cookies may impact your experience on DevHubs.
      </p>

      <h2 className="text-2xl font-bold my-6">5. Third-Party Cookies</h2>
      <p className="mb-6">
        We may use third-party services (e.g., Google Analytics) that use
        cookies to help us analyze usage patterns. These cookies are subject to
        the privacy policies of the respective providers.
      </p>

      <h2 className="text-2xl font-bold my-6">6. Changes to This Policy</h2>
      <p className="mb-6">
        We may update this Cookie Policy to reflect changes in our practices or
        relevant regulations.
      </p>

      <h2 className="text-2xl font-bold my-6">7. Contact Us</h2>
      <p>
        If you have questions about our use of cookies, please email us at{" "}
        <span className="text-blue-400">devhubs526@gmail.com</span>.
      </p>
    </div>
  </>
);

export default CookiePolicy;
