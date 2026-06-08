# Diretrizes de Desenvolvimento e Workflow de IA (Lei do DRY)

Esta pasta `.ref` atua como o **AI Service Registry** (Catálogo de Serviços da Inteligência Artificial) do projeto LakeTokeniza.

## Regra Permanente de Workflow (Lei do DRY)

> [!IMPORTANT]
> **Antes de propor a criação** de qualquer nova funcionalidade, hook customizado, utilitário ou serviço global, o Agente de IA **DEVE obrigatoriamente ler e consultar os arquivos de catálogo desta pasta `.ref`** ([contexts.md](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/.ref/contexts.md), [hooks.md](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/.ref/hooks.md), [services.md](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/.ref/services.md)) para verificar se a funcionalidade ou um mecanismo equivalente já existe.
>
> Se criarmos ou expandirmos um componente, hook ou serviço global que seja altamente reutilizável, o Agente **DEVE obrigatoriamente atualizar os índices correspondentes nesta pasta** para catalogá-lo para interações futuras.

## Práticas de Design no Ecossistema LakeTokeniza

1.  **Não duplicar RPCs e Endpoints:** Consuma sempre do `useNetworkHub()` para obter os caminhos e estados derivados da rede atual (`solanaRpcUrl`, `isMainnet`, etc.).
2.  **Não custodiar fundos em transações de terceiros:** Siga estritamente o padrão de Split Atômico on-chain demonstrado no mercado primário e secundário de `marketplace/page.tsx` para qualquer transação P2P ou taxas operacionais.
3.  **UI Premium Sem Diálogos Bloqueantes:** Use `toast` da biblioteca `sonner` para todos os feedbacks operacionais. Para confirmações de exclusão/aprovação de RWA, implemente o fluxo de callbacks interativos (`action`/`cancel`) diretamente no toast.
4.  **SBTs Permanentes no Arweave:** Ao cunhar imagens ou metadados de identidades digitais ou RWAs, envie sempre para a rede Arweave via relayer backend `/api/upload` que interage com o SDK do Irys de forma segura e não-custodial.
