import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, CreditCard, ArrowRight, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Ahorra cada semana",
    description:
      "Deposita una parte de tus ganancias semanales en tu cuenta Vínculo. Cada depósito se registra de forma segura en la blockchain de Stellar.",
    accent: "bg-accent/15 text-accent",
  },
  {
    icon: TrendingUp,
    title: "Construye tu reputación",
    description:
      "Cada depósito constante sube tu nivel de reputación. Al completar 3 depósitos consecutivos alcanzas el Nivel Plata y demuestras que eres confiable.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: CreditCard,
    title: "Desbloquea tu crédito",
    description:
      "Al alcanzar el Nivel Plata se te otorga un microcrédito de hasta 300 XLM. Sin papeleo, sin filas, directo a tu wallet.",
    accent: "bg-emerald-500/15 text-emerald-600",
  },
];

const Onboarding = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const isLast = current === steps.length - 1;
  const step = steps[current];
  const Icon = step.icon;

  const next = () => {
    if (isLast) {
      localStorage.setItem("vinculo_onboarded", "1");
      navigate("/", { replace: true });
    } else {
      setCurrent((p) => p + 1);
    }
  };

  const skip = () => {
    localStorage.setItem("vinculo_onboarded", "1");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-between px-6 py-10 text-primary-foreground overflow-hidden">
      {/* Skip */}
      <div className="w-full flex justify-end">
        {!isLast && (
          <button
            onClick={skip}
            className="text-sm font-medium text-primary-foreground/60 hover:text-primary-foreground/90 transition-colors active:scale-95"
          >
            Omitir
          </button>
        )}
      </div>

      {/* Illustration area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm w-full">
        <div
          key={current}
          className="flex flex-col items-center text-center opacity-0 animate-fade-up"
          style={{ animationFillMode: "forwards" }}
        >
          {/* Icon bubble */}
          <div
            className={`w-28 h-28 rounded-3xl ${step.accent} flex items-center justify-center mb-10 shadow-lg`}
          >
            <Icon className="w-14 h-14" strokeWidth={1.5} />
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-4 text-balance leading-tight">
            {step.title}
          </h2>
          <p className="text-base text-primary-foreground/70 leading-relaxed text-pretty">
            {step.description}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full max-w-sm space-y-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-accent"
                  : "w-1.5 bg-primary-foreground/25"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="btn-emerald w-full flex items-center justify-center gap-2 py-4 text-base"
        >
          {isLast ? (
            <>
              <Sparkles className="w-5 h-5" />
              Comenzar
            </>
          ) : (
            <>
              Siguiente
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
