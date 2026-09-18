import { requireUser } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Checagem de autenticação/autorização feita no servidor: nenhuma página
  // dentro deste grupo de rotas renderiza sem uma sessão válida, independente
  // do que o cliente tente esconder ou forjar no navegador.
  const user = await requireUser();

  return <AdminShell userName={user.name}>{children}</AdminShell>;
}
