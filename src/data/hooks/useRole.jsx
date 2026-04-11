import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

/**
 * Hook de conveniência para verificar permissões do usuário logado.
 *
 * Roles disponíveis:
 *   adm      → acesso total
 *   viewer   → somente leitura (sem editar/excluir)
 *   scanner  → apenas credenciamento (Scanner)
 *   vendedor → apenas pagamento manual, sempre vinculado a um seller
 */
const useRole = () => {
  const { role } = useContext(AuthContext);

  return {
    role,
    isAdm: role === "adm",
    isViewer: role === "viewer",
    isScanner: role === "scanner",
    isVendedor: role === "vendedor",
    canEdit: role === "adm",
    canDelete: role === "adm",
    canSeeCheckouts: role === "adm" || role === "viewer" || role === "vendedor",
    canSeeDashboard: role === "adm" || role === "viewer",
    canSeeManualPayment: role === "adm" || role === "vendedor",
    canSeeSellers: role === "adm",
    canSeeCertificates: role === "adm" || role === "viewer",
    canSeeAccreditation: role === "adm" || role === "scanner",
    canSeeEmails: role === "adm",
    canSeeUserManagement: role === "adm",
    canSeeCaixa: role === "adm",
  };
};

export default useRole;
