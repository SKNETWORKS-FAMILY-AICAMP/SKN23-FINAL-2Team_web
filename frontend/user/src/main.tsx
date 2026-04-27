import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App";
import PaymentPage from "@/app/pages/PaymentPage";
import UserPage from "@/app/pages/UserPage";
import FAQPage from "@/app/pages/FAQPage";
import InquiriesPage from "@/app/pages/InquiriesPage";
import PaymentSuccessPage from "@/app/pages/PaymentSuccessPage";
import PaymentFailPage from "@/app/pages/PaymentFailPage";
import PricingPage from "@/app/pages/PricingPage";
import { AuthProvider } from "./app/context/AuthContext";
import { AuthModal } from "@/app/components/auth/AuthModal";
import { Toaster } from "./app/components/ui/sonner";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/fail" element={<PaymentFailPage />} />
        <Route path="/profile" element={<UserPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/inquiries" element={<InquiriesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
      <AuthModal />
      <Toaster />
    </AuthProvider>
  </BrowserRouter>
);
