import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingSpinner from "@shared/components/ui/LoadingSpinner";

// Public pages - keep synchronous for faster initial load
import AboutPage from "../../pages/Aboutpage";
import LandingPage from "../../pages/LandingPage";
import PrivacyPolicy from "../../pages/PrivacyPolicy";
import TermsOfService from "../../pages/TermsofServicePage";
import CookiePolicy from "../../pages/CookiePolicy";
import CommunityGuidelines from "../../pages/CommunityGuideline";
import Careers from "../../pages/CarrerPage";
import Blog from "../../pages/BlogPage";
import Contact from "../../pages/ContactPage";

// Feature pages - lazy load for code splitting
const SignupPage = lazy(() => import("@features/auth/pages/SignupPage"));
const LoginPage = lazy(() => import("@features/auth/pages/LoginPage"));
const ProjectListingPage = lazy(() => import("@features/projects/pages/ProjectListingPage"));
const FreeProjectListingPage = lazy(() => import("@features/projects/pages/FreeProjectListingPage"));
const DashboardPage = lazy(() => import("@features/projects/pages/DashboardPage"));
const BiddingPage = lazy(() => import("@features/bidding/pages/BiddingPage"));
const BiddingProposalPage = lazy(() => import("@features/bidding/pages/BiddingProposalPage"));
const PaymentPage = lazy(() => import("@features/payments/pages/PaymentPage"));
const PaymentHistoryPage = lazy(() => import("@features/payments/pages/PaymentHistoryPage"));
const WithdrawalPage = lazy(() => import("@features/payments/pages/WithdrawalPage"));
const SubscriptionPage = lazy(() => import("@features/payments/pages/SubscriptionPage"));
const ProfilePage = lazy(() => import("@features/profile/pages/ProfilePage"));
const EditProfilePage = lazy(() => import("@features/profile/pages/EditProfilePage"));
const AdminPage = lazy(() => import("@features/admin/pages/AdminPage"));
const ContributionPage = lazy(() => import("@features/contribution/pages/ContributionPage"));
const ProjectSelectionManager = lazy(() => import("@features/project-selection/components/ProjectSelectionManager"));
const EscrowWalletManager = lazy(() => import("@features/escrow/components/EscrowWalletManager"));

import ProtectedRoute from "./protected-route";

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/createaccount" element={<SignupPage />} />
        <Route path="/loginaccount" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-service" element={<TermsOfService/>}/>
        <Route path="/cookie-policy" element={<CookiePolicy/>}/>
        <Route path="/community-guidelines" element={<CommunityGuidelines/>}/>
        <Route path="/careers" element={<Careers/>}/>
        <Route path="/blog" element={<Blog/>}/>
        <Route path="/contact" element={<Contact/>}/>
       

        <Route element={<ProtectedRoute />}>
          <Route path="/listproject" element={<ProjectListingPage />} />
          <Route path="/listfreeproject" element={<FreeProjectListingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bidingPage/:_id" element={<BiddingPage />} />
          <Route path="/bidingproposal/:_id" element={<BiddingProposalPage />} />
          <Route path="/profile" element={<ProfilePage/>}/>
          <Route path="/editprofile" element={<EditProfilePage/>}/>
          <Route path="/createprofile" element={<EditProfilePage/>}/>
          <Route path="/admin/" element={<AdminPage/>}/>
          <Route path="/editproject/:id" element={<ProjectListingPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path = "/contributionPage/:_id" element={<ContributionPage/>}/>
          
          {/* Project Selection System Routes */}
          <Route path="/project-selection/:projectId" element={<ProjectSelectionManager />} />
          
          {/* Escrow Wallet System Routes */}
          <Route path="/escrow-wallet/:projectId" element={<EscrowWalletManager />} />
          
          {/* Payment Routes */}
          <Route path="/payments" element={<PaymentPage />} />
          <Route path="/payment-history" element={<PaymentHistoryPage />} />
          <Route path="/withdrawals" element={<WithdrawalPage />} />
          
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
