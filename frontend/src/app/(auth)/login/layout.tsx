import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In to Basecamp | WanderAI",
  description: "Sign in to access your saved itineraries, personalized recommendations, and expedition plans.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
