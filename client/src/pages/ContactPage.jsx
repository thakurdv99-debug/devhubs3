import Navbar from "@shared/components/layout/NavBar";
const Contact = () => (
  <>
    <Navbar />
    <div className="max-w-4xl mx-auto py-20 px-6 text-gray-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <p className="mb-6">
        Whether you have a question, feedback, or just want to say hello — we’d
        love to hear from you.
      </p>

      <h2 className="text-2xl font-bold my-6">General Inquiries</h2>
      <p className="mb-6">
        Email us at <span className="text-blue-400">devhubs526@gmail.com</span>
      </p>

      <h2 className="text-2xl font-bold my-6">Business / Partnerships</h2>
      <p className="mb-6">
        Reach out at <span className="text-blue-400">devhubs526@gmail.com</span>
      </p>

      <h2 className="text-2xl font-bold my-6">Community & Events</h2>
      <p className="mb-6">
        For collaborations, events, or community growth, write to{" "}
        <span className="text-blue-400">devhubs526@gmail.com</span>
      </p>

      <h2 className="text-2xl font-bold my-6">Office Address</h2>
      <p className="mb-6">DevHubs HQ, New Delhi, India</p>

      <h2 className="text-2xl font-bold my-6">Response Time</h2>
      <p className="mb-6">We typically respond within 2-3 business days.</p>
    </div>
  </>
);

export default Contact;
