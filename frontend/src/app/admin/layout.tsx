import { MainLayout } from "@/components/layout/MainLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = [
    { name: "Home", href: "/", iconName: "Home" },
    { name: "Dashboard", href: "/admin", iconName: "LayoutDashboard" },
    {
      name: "analytics",
      href: "/admin/analitics",
      iconName: "LayoutDashboard",
    },
    { name: "Games", href: "/admin/games", iconName: "Gamepad2" },
    { name: "Events", href: "/admin/events", iconName: "Calendar" },
    { name: "Users", href: "/admin/user", iconName: "Users" },
  ];

  return <MainLayout Nav={nav}>{children}</MainLayout>;
}
