import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Account | WanderAI",
  description: "Join WanderAI to plan intelligent itineraries, save destinations, and unlock AI concierge insights.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
