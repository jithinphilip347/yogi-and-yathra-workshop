"use client"; 
import { usePathname } from "next/navigation";
import Nav from '@/components/nav/Nav';
import Footer from '@/components/footer/Footer';
import SubNav from '@/components/nav/SubNav';
import Providers from '@/components/Providers';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  
  const isAuthPage = pathname === "/auth/login" || pathname === "/auth/signup" || pathname === "/auth/forgetpassword" || pathname === "/auth/otp" || pathname === "/auth/changepassword";
  const isPlayerPage = pathname?.includes("/learn/") || pathname?.includes("/live-stream");
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
