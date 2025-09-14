import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Zap,
  Settings,
  User,
  CreditCard,
  Bell,
  HelpCircle,
  UtensilsCrossed,
  LogOut,
  Calendar,
  ShoppingBag,
  ChefHat,
  Book,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Réservations",
    url: "/reservations",
    icon: Calendar,
  },
  {
    title: "Commandes",
    url: "/orders",
    icon: ShoppingBag,
  },
];

const restaurantItems = [
  {
    title: "Dashboard Restaurant",
    url: "/restaurant-dashboard",
    icon: ChefHat,
  },
  {
    title: "Gestion du Menu",
    url: "/menu-management",
    icon: Book,
  },
];

const accountItems = [
  {
    title: "Recharge Minutes",
    url: "/minutes/recharge",
    icon: Zap,
    badge: "urgent",
  },
  {
    title: "Paramètres",
    url: "/account",
    icon: Settings,
  },
  {
    title: "Mon Compte",
    url: "/account",
    icon: User,
  },
  {
    title: "Abonnement",
    url: "/pricing",
    icon: CreditCard,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "Aide",
    url: "/help",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, subscription, signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground glow-primary font-medium" 
      : "hover:bg-accent hover:text-accent-foreground transition-all duration-200";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar-background/95 backdrop-blur-sm">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground gradient-primary">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          {open && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">mind.line</h2>
              <p className="text-xs text-muted-foreground">AI Restaurant SaaS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Restaurant AI Features */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Restaurant IA
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {restaurantItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Management */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Compte
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="h-5 w-5" />
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{item.title}</span>
                        {item.badge === "urgent" && (
                          <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                            !
                          </Badge>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {open && (
          <div className="space-y-3">
            {/* User Profile */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {subscription.subscription_tier ? `Plan ${subscription.subscription_tier}` : "Gratuit"}
                </p>
              </div>
            </div>

            {/* Minutes Remaining */}
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Minutes restantes</span>
                <Badge variant="outline" className="bg-warning/20 text-foreground border-warning/30">
                  0
                </Badge>
              </div>
            </div>

            {/* Sign Out */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}