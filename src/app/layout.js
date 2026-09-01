import "../assets/css/main.css";
import "../assets/css/style.css";
import "../assets/css/notification.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  metadataBase: new URL("https://www.yogiandyathra.com"),

  title: {
    default:
      "Yogi & Yathra | Online Yoga Courses, Live Yoga Classes & Meditation",
    template: "%s | Yogi & Yathra",
  },

  description:
    "Yogi & Yathra is an online yoga platform offering yoga courses, daily live yoga classes, live workshops, meditation sessions, wellness programs, and expert-guided yoga training for beginners and advanced practitioners.",

  keywords: [
    "Yoga",
    "Yoga Classes",
    "Online Yoga",
    "Online Yoga Classes",
    "Yoga Courses",
    "Yoga Course India",
    "Live Yoga Classes",
    "Daily Live Yoga Classes",
    "Yoga Workshop",
    "Online Yoga Workshop",
    "Meditation",
    "Meditation Classes",
    "Online Meditation",
    "Mindfulness",
    "Power Yoga",
    "Hatha Yoga",
    "Vinyasa Yoga",
    "Beginner Yoga",
    "Advanced Yoga",
    "Yoga Training",
    "Yoga Teacher",
    "Yoga Practice",
    "Breathing Exercises",
    "Pranayama",
    "Wellness",
    "Stress Relief",
    "Weight Loss Yoga",
    "Flexibility Training",
    "Online Wellness Programs",
    "Yoga for Beginners",
    "Live Meditation Sessions",
    "Yoga Community",
    "Healthy Lifestyle",
    "Yoga Events",
    "Daily Yoga Practice",
    "Yoga India",
  ],

  authors: [
    {
      name: "Yogi & Yathra",
    },
  ],

  creator: "Yogi & Yathra",

  publisher: "Yogi & Yathra",

  applicationName: "Yogi & Yathra",

  category: "Health & Fitness",

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",

    locale: "en_US",

    url: "https://www.yogiandyathra.com",

    siteName: "Yogi & Yathra",

    title:
      "Yogi & Yathra | Online Yoga Courses, Live Yoga Classes & Meditation",

    description:
      "Join expert-led online yoga courses, daily live yoga classes, meditation sessions, wellness workshops, and guided yoga training programs.",

    images: [
      {
        url: "/seo/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Yogi & Yathra - Online Yoga Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Yogi & Yathra | Online Yoga Courses & Live Yoga Classes",

    description:
      "Practice yoga with certified instructors through online courses, live yoga sessions, meditation programs, and wellness workshops.",

    images: ["/seo/og-image.jpg"],
  },

  icons: {
    icon: "/favicon.ico",

    shortcut: "/favicon.ico",

    apple: "/apple-touch-icon.png",
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
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