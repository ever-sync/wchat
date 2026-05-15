import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { getAppUrl } from "@/lib/app-url";
import { requireSupabase } from "@/lib/supabase";

export default function RecuperarSenha() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const supabase = requireSupabase();
      const redirectTo = `${getAppUrl()}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

      if (error) {
        throw error;
      }

      const okDesc = "Se o e-mail existir, enviamos um link para redefinir sua senha.";
      toast({ title: "Link enviado", description: okDesc });
      useAppStore.getState().addNotification({ tipo: "info", titulo: "Link enviado", descricao: okDesc });
      setEmail("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Tente novamente.";
      toast({ title: "Nao foi possivel enviar o link", description: msg, variant: "destructive" });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Nao foi possivel enviar o link",
        descricao: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6FD] p-2 md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[520px] items-center justify-center rounded-[28px] border border-[#d9e0d3] bg-white px-6 py-10 shadow-[0_20px_70px_rgba(84,95,101,0.08)] sm:px-10 md:min-h-[calc(100vh-2rem)]">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce3d6] bg-[#f3f7ef] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#4E1BB1]">
              <Mail className="h-3.5 w-3.5" />
              Recuperacao
            </p>
            <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[#514E5F]">
              Recuperar senha
            </h1>
            <p className="mt-3 text-[18px] text-[#7d8784]">
              Digite seu e-mail para receber o link de redefinicao.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <label className="block text-[15px] font-medium text-[#514E5F]">
                E-mail
              </label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Digite seu e-mail"
                className="h-[50px] rounded-[12px] border-[#dbe2d5] bg-[#fbfcf9] px-4 text-[15px] text-[#514E5F] shadow-none placeholder:text-[#a4aeab] focus-visible:ring-1 focus-visible:ring-[#4E1BB1]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="h-[52px] w-full rounded-[12px] bg-[#4E1BB1] text-[17px] font-medium text-[#e9edef] shadow-[0_14px_30px_rgba(13,59,102,0.35)] hover:bg-[#4015A5]"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar link
            </Button>
          </form>

          <p className="mt-8 text-center text-[15px] text-[#74807d]">
            <Link to="/login" className="inline-flex items-center gap-2 font-medium text-[#4E1BB1] underline underline-offset-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
