"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from '@/components/nav/Nav';
import Footer from '@/components/footer/Footer';
import SubNav from '@/components/nav/SubNav';
import Providers from '@/components/Providers';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((e) => {
        console.log(e);
      });
    }
  }, []);

  const isAuthPage = pathname === "/auth/login" || pathname === "/auth/signup" || pathname === "/auth/forgetpassword" || pathname === "/auth/otp" || pathname === "/auth/changepassword";
  const isPlayerPage = pathname?.includes("/learn/") || pathname?.includes("/live-stream") || pathname?.includes("/player");
  const hideHeaderFooter = isAuthPage || isPlayerPage;

  return (
    <SmoothScrollProvider>
      <Providers>
        {!hideHeaderFooter && <Nav />}
        {!hideHeaderFooter && <SubNav />}
        
        <main>{children}</main>
        
        {!hideHeaderFooter && <Footer />}
      </Providers>
    </SmoothScrollProvider>
  );
}
