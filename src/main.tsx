/*
File    : src/main.tsx
Author  : 김민정
Create  : 2026-04-20
Description : React 애플리케이션 진입점 및 라우팅 설정(BrowserRouter, AuthProvider)

Modification History:
    - 2026-04-21 (김민정) : PaymentPage/ProfilePage/AuthContext 경로 등록
    - 2026-04-22 (김민정) : FAQPage/QnAPage 경로 등록
    - 2026-04-23 (김민정) : PaymentSuccessPage/PaymentFailPage/AdminPage 경로 등록
 */
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App";
import PaymentPage from "@/app/pages/organizations/PaymentPage";
import ProfilePage from "@/app/pages/organizations/ProfilePage";
import FAQPage from "@/app/pages/organizations/FAQPage";
import QnAPage from "@/app/pages/organizations/QnAPage";
import PaymentSuccessPage from "@/app/pages/organizations/PaymentSuccessPage";
import PaymentFailPage from "@/app/pages/organizations/PaymentFailPage";
import AdminPage from "@/app/pages/admin/AdminPage";
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/qna" element={<QnAPage />} />
      </Routes>
      <AuthModal />
      <Toaster />
    </AuthProvider>
  </BrowserRouter>
);
