import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { readSignUpDraft, writeSignUpDraft } from "@/lib/signup-storage";
import { useAppStore } from "@/store/useAppStore";

const steps = ["Conta", "Plano", "Pagamento"];

export default function Cadastro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(() => readSignUpDraft());

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      writeSignUpDraft(next);
      return next;
    });

  const formatCNPJ = (v: string) => {
    const nums = v.replace(/\D/g, "").slice(0, 14);
    return nums.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatPhone = (v: string) => {
    const nums = v.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const email = form.email.trim();
    const phoneDigits = form.telefone.replace(/\D/g, "");
    const cnpjDigits = form.cnpj.replace(/\D/g, "");

    if (!form.nome.trim() || !email || !form.empresa.trim()) {
      const d = "Nome, e-mail e empresa sao obrigatorios para continuar.";
      toast({ title: "Preencha os campos obrigatorios", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({
        tipo: "aviso",
        titulo: "Preencha os campos obrigatorios",
        descricao: d,
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const d = "Digite um e-mail corporativo valido.";
      toast({ title: "E-mail invalido", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({ tipo: "aviso", titulo: "E-mail invalido", descricao: d });
      return;
    }

    if (phoneDigits.length < 10) {
      const d = "Informe um WhatsApp com DDD.";
      toast({ title: "Telefone incompleto", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({ tipo: "aviso", titulo: "Telefone incompleto", descricao: d });
      return;
    }

    if (cnpjDigits.length !== 14) {
      const d = "Digite um CNPJ com 14 numeros.";
      toast({ title: "CNPJ invalido", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({ tipo: "aviso", titulo: "CNPJ invalido", descricao: d });
      return;
    }

    if (form.senha.length < 6) {
      const d = "Use pelo menos 6 caracteres.";
      toast({ title: "Senha muito curta", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({ tipo: "aviso", titulo: "Senha muito curta", descricao: d });
      return;
    }

    if (form.senha !== form.confirmar) {
      const d = "Confirme a mesma senha nos dois campos.";
      toast({ title: "Senhas diferentes", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({ tipo: "aviso", titulo: "Senhas diferentes", descricao: d });
      return;
    }

    if (!form.termos) {
      const d = "Voce precisa aceitar os termos para continuar.";
      toast({ title: "Aceite os termos", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({ tipo: "aviso", titulo: "Aceite os termos", descricao: d });
      return;
    }

    writeSignUpDraft(form);
    navigate("/cadastro/plano");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">DistribuiBot</span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i === 0 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
            Criar sua conta
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
              <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Seu nome" className="bg-secondary border-border h-11" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail corporativo</label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="seu@empresa.com" className="bg-secondary border-border h-11" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone (WhatsApp)</label>
              <Input value={form.telefone} onChange={(e) => update("telefone", formatPhone(e.target.value))} placeholder="(11) 99999-9999" className="bg-secondary border-border h-11" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da empresa</label>
              <Input value={form.empresa} onChange={(e) => update("empresa", e.target.value)} placeholder="Distribuidora XYZ" className="bg-secondary border-border h-11" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">CNPJ</label>
              <Input value={form.cnpj} onChange={(e) => update("cnpj", formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" className="bg-secondary border-border h-11" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
                <Input type="password" value={form.senha} onChange={(e) => update("senha", e.target.value)} placeholder="••••••••" className="bg-secondary border-border h-11" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirmar senha</label>
                <Input type="password" value={form.confirmar} onChange={(e) => update("confirmar", e.target.value)} placeholder="••••••••" className="bg-secondary border-border h-11" />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="termos"
                checked={form.termos}
                onCheckedChange={(v) => update("termos", !!v)}
                className="mt-0.5 border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
              <label htmlFor="termos" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                Aceito os <span className="text-accent">Termos de Uso</span> e{" "}
                <span className="text-accent">Política de Privacidade</span>
              </label>
            </div>

            <Button type="submit" className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg mt-2">
              Continuar
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Já tem conta?{" "}
            <Link to="/login" className="text-accent hover:text-accent/80 font-medium">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
