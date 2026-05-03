import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupContent, SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, CheckSquare, Utensils, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AIChatBubble } from "@/components/AIChatBubble";

const navItems = [
  { title: "Home", icon: LayoutDashboard, href: "/" },
  { title: "Calendar", icon: Calendar, href: "/calendar" },
  { title: "Tasks", icon: CheckSquare, href: "/tasks" },
  { title: "Meals", icon: Utensils, href: "/meals" },
  { title: "Family", icon: Users, href: "/family" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const activeItem = navItems.find((item) => item.href === location);

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-12 items-center justify-between px-4 shrink-0">
          <span className="text-base font-bold tracking-tight text-primary">NaturHome Hub</span>
          <UserButton />
        </header>

        <main className="flex-1 overflow-y-auto pb-20 px-4 pt-1">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t flex items-stretch z-30" style={{ height: "64px" }}>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors"
              >
                <div className={`flex items-center justify-center w-10 h-7 rounded-full transition-all ${isActive ? "bg-primary/12" : ""}`}>
                  <item.icon
                    className={`h-5 w-5 transition-all ${isActive ? "text-primary stroke-[2.5]" : "text-muted-foreground"}`}
                  />
                </div>
                <span className={`text-[10px] font-medium leading-none ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        <AIChatBubble />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h1 className="text-xl font-bold text-primary">NaturHome Hub</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-2">
              <UserButton />
              <span className="text-sm font-medium">Account</span>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b bg-card/60 backdrop-blur-sm px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{activeItem?.title ?? "NaturHome Hub"}</h2>
            </div>
            <UserButton />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>

        <AIChatBubble />
      </div>
    </SidebarProvider>
  );
}
