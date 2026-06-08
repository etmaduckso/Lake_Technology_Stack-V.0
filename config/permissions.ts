export const ROLE_PERMISSIONS = {
  Admin: {
    description: "Acesso total ao sistema.",
    capabilities: ["ALL"],
  },
  Editor: {
    description: "Gerir Conteúdo",
    capabilities: ["CONTENT_CREATE", "CONTENT_EDIT", "CONTENT_DELETE"],
  },
  Supervisor: {
    description: "Aprovar Ativos",
    capabilities: ["ASSET_APPROVE", "ASSET_REJECT", "ASSET_REVIEW"],
  },
  Operador: {
    description: "Suporte N1",
    capabilities: ["SUPPORT_READ", "SUPPORT_REPLY"],
  },
  Juridico: {
    description: "Compliance",
    capabilities: ["KYC_REVIEW", "KYC_APPROVE", "KYC_REJECT", "COMPLIANCE_AUDIT"],
  },
  Suporte: {
    description: "Suporte ao Cliente",
    capabilities: ["TICKET_READ", "TICKET_REPLY"],
  }
};
