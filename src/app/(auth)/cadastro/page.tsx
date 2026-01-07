import { Suspense } from "react";
import Cadastro from "@/pages/auth/Cadastro";

export default function CadastroPage() {
  return (
    <Suspense>
      <Cadastro />
    </Suspense>
  );
}
