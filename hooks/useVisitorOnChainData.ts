import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

interface VisitorMetadata {
  nickname: string;
  avatarUrl: string;
}

export function useVisitorOnChainData(programId: string): {
  metadata: VisitorMetadata | null;
  loading: boolean;
  error: string | null;
} {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [metadata, setMetadata] = useState<VisitorMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setMetadata(null);
      return;
    }

    const fetchVisitorData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Tentar buscar on-chain (Devnet)
        const VISITOR_PROGRAM_ID = new PublicKey(programId);
        const [visitorPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('visitor'), publicKey.toBuffer()],
          VISITOR_PROGRAM_ID
        );

        let sbtAccount = null;
        try {
          sbtAccount = await connection.getParsedAccountInfo(visitorPDA);
        } catch (blockchainErr) {
          console.warn("[Blockchain Error] Falha ao obter conta do vir do PDA on-chain:", blockchainErr);
        }

        if (sbtAccount?.value) {
          // 2. Se encontrou on-chain, extrair URI
          const sbtData = sbtAccount.value.data as any;
          const metadataUri = sbtData.parsed?.info?.uri || sbtData.parsed?.info?.metadata_uri;

          if (metadataUri) {
            const response = await fetch(metadataUri);
            const arweaveData = await response.json();

            if (arweaveData.nickname && arweaveData.avatarUrl) {
              setMetadata({
                nickname: arweaveData.nickname,
                avatarUrl: arweaveData.avatarUrl,
              });
              return;
            }
          }
        }

        // 3. Fallback: buscar do banco (Supabase)
        const response = await fetch(`/api/users/profile?wallet=${publicKey.toBase58()}`);
        const profileData = await response.json();

        if (profileData.sbtImageUrl) {
          const arweaveResponse = await fetch(profileData.sbtImageUrl);
          const arweaveData = await arweaveResponse.json();

          if (arweaveData.nickname && arweaveData.avatarUrl) {
            setMetadata({
              nickname: arweaveData.nickname,
              avatarUrl: arweaveData.avatarUrl,
            });
            return;
          }
        }

        setError('Nenhum visto de visitante encontrado');
        setMetadata(null);
      } catch (err: any) {
        setError(`Erro ao buscar dados: ${err.message}`);
        setMetadata(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorData();
  }, [publicKey, connection, programId]);

  return { metadata, loading, error };
}
