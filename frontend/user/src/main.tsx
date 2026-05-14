/*
Modification History:
    - 2026-05-14 (김지우) : AuthModalProvider 적용 및 공용 Toaster 경로 연동
*/
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./app/App";
import PaymentPage from "@/app/pages/PaymentPage";
import UserPage from "@/app/pages/UserPage";
import FAQPage from "@/app/pages/FAQPage";
import InquiriesPage from "@/app/pages/InquiriesPage";
import PaymentSuccessPage from "@/app/pages/PaymentSuccessPage";
import PaymentFailPage from "@/app/pages/PaymentFailPage";
import PricingPage from "@/app/pages/PricingPage";
import DownloadPage from "@/app/pages/DownloadPage";
import LoginPage from "@/app/pages/LoginPage";
import { AuthProvider } from "./app/context/AuthContext";
import { AuthModalProvider } from "@/app/context/AuthModalContext";
import { Toaster } from "@shared/ui/feedback";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <AuthModalProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/fail" element={<PaymentFailPage />} />
          <Route path="/profile" element={<UserPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthModalProvider>
    </AuthProvider>
  </BrowserRouter>
);
