import '../assets/css/main.css';
import '../assets/css/style.css';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'Yogi and Yathra | Yoga Workshop & Training',
  description: 'Join Yogi and Yathra for expert yoga workshops and training classes. Enhance your physical and mental well-being through our guided yoga sessions.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}