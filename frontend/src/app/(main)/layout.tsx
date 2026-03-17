import { MainLayout } from "@/components/layout/MainLayout";

const nav = [
  { name: "events", href: "/events", iconName: "Home" },
  { name: "games", href: "/games", iconName: "LayoutDashboard" },
  { name: "buy Tickets", href: "/buy", iconName: "Gamepad2" },
  { name: "my bookings", href: "/my-bookings", iconName: "Calendar" },
  { name: "admin", href: "/admin", iconName: "Users" },
];

export default function Mainlayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayout Nav={nav}>{children}</MainLayout>;
}
