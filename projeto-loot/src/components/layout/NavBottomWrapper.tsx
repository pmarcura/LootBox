import type { LayoutSession } from "@/lib/supabase/session";
import { MobileBottomNav } from "./MobileBottomNav";

/**
 * Barra de navegação fixa na parte inferior da tela (sempre visível).
 * Renderizada no layout; recebe sessão do layout para evitar refetch.
 */
type NavBottomWrapperProps = { session: LayoutSession };

export function NavBottomWrapper({ session }: NavBottomWrapperProps) {
  const isAdmin = session.profile?.is_admin ?? false;
  return <MobileBottomNav isAdmin={isAdmin} />;
}
