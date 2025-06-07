
'use client';

// useEffect, useRouter, usePathname, useAuth não são mais necessários aqui para lógica de redirecionamento.
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  // A lógica de redirecionamento foi removida deste componente.
  // O AuthProvider já lida com o redirecionamento da rota raiz (/)
  // com base no estado de autenticação do usuário.
  // Este componente agora serve principalmente como um placeholder de carregamento
  // caso o AuthProvider ainda esteja processando ou se houver um acesso direto à rota "/".

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg">Carregando Tubarões da Bolsa...</p>
    </div>
  );
}
