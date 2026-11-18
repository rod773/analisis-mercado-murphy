"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const TOC = [
  { title: "Sobre el autor", page: 15 },
  { title: "Sobre los colaboradores", page: 17 },
  { title: "Introducción", page: 19 },
  { title: "Agradecimientos", page: 23 },
  { title: "1. Filosofía del análisis técnico", page: 27 },
  { title: "2. Teoría de Dow", page: 51 },
  { title: "3. Construcción de gráficos", page: 65 },
  { title: "4. Conceptos básicos de tendencia", page: 79 },
  { title: "5. Los modelos de cambio más importantes", page: 135 },
  { title: "6. Modelos de continuidad", page: 167 },
  { title: "7. Volumen e interés abierto", page: 197 },
  { title: "8. Gráficos a largo plazo", page: 223 },
  { title: "9. Medias móviles", page: 237 },
  { title: "10. Osciladores e indicadores", page: 267 },
  { title: "11. Los gráficos de puntos y figuras", page: 309 },
  { title: "12. Velas japonesas", page: 343 },
  { title: "13. Teoría de las ondas de Elliott", page: 365 },
  { title: "14. Ciclos temporales", page: 391 },
  { title: "15. Ordenadores y sistemas de contratación", page: 427 },
];

export default function Home() {
  const [page, setPage] = useState(1);
  const [text, setText] = useState("");
  const [textPage, setTextPage] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const total = 547;
  const autoReadRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopScroll = () => {
    if (scrollTimerRef.current) {
      clearInterval(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
  };

  const startScroll = () => {
    stopScroll();
    scrollTimerRef.current = setInterval(() => {
      window.scrollBy({ top: 1, behavior: "auto" });
    }, 30);
  };

  const stopReading = () => {
    autoReadRef.current = false;
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    stopScroll();
    setIsReading(false);
  };

  const pickSpanishMaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const esVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
    const maleHints =
      /male|hombre|mascul|pablo|jorge|enrique|miguel|raul|raúl|carlos|diego|alvaro|álvaro|andres|andrés|juan|david|sergio|jordi/i;
    return (
      esVoices.find((v) => maleHints.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("es") && maleHints.test(v.name)) ||
      esVoices[0] ||
      voices[0]
    );
  };

  const goToNextPageAuto = () => {
    setPage((p) => {
      if (p < total) return p + 1;
      autoReadRef.current = false;
      return p;
    });
  };

  const speakText = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      stopScroll();
      setIsReading(false);
      if (autoReadRef.current) {
        setTimeout(goToNextPageAuto, 300);
      }
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(trimmed);
    const voice = pickSpanishMaleVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || "es-ES";
    u.onstart = () => {
      setIsReading(true);
      startScroll();
    };
    u.onend = () => {
      stopScroll();
      setIsReading(false);
      if (autoReadRef.current) {
        goToNextPageAuto();
      }
    };
    u.onerror = () => {
      stopScroll();
      setIsReading(false);
      if (autoReadRef.current) {
        setTimeout(goToNextPageAuto, 300);
      }
    };
    synth.speak(u);
  };

  const startReading = () => {
    autoReadRef.current = true;
    window.scrollTo({ top: 0, behavior: "auto" });
    if (textPage === page) {
      speakText(text);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/textos/${page}.txt`)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) {
          setText(t);
          setTextPage(page);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setText("");
          setTextPage(page);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [page]);

  useEffect(() => {
    if (autoReadRef.current && textPage === page) {
      speakText(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, textPage, page]);

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      autoReadRef.current = false;
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
        window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
      }
      stopScroll();
    };
  }, []);

  const goPrev = () => {
    stopReading();
    setPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    stopReading();
    setPage((p) => Math.min(total, p + 1));
  };

  const goToPage = (p: number) => {
    stopReading();
    setPage(p);
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 h-screen w-72 overflow-y-auto border-r border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <h2 className="mb-3 text-lg font-semibold">Índice</h2>
        <nav className="flex flex-col gap-1">
          {TOC.map((item) => (
            <button
              key={`${item.page}-${item.title}`}
              onClick={() => goToPage(item.page)}
              className={`rounded px-2 py-1 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 ${page === item.page ? "bg-black/10 font-medium dark:bg-white/15" : ""}`}
            >
              {item.title} <span className="opacity-60">({item.page})</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="ml-72 min-h-screen p-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-4"
        >
          Análisis técnico de los mercados financieros - J. J. Murphy
        </motion.h1>
        <div className="sticky top-0 z-10 flex gap-2 mb-4 items-center flex-wrap bg-white/90 py-2 backdrop-blur dark:bg-black/90">
          <button onClick={goPrev} className="px-3 py-1 border rounded">
            Anterior
          </button>
          <span>
            Página {page} / {total}
          </span>
          <button onClick={goNext} className="px-3 py-1 border rounded">
            Siguiente
          </button>
          <button onClick={startReading} className="px-3 py-1 border rounded ml-auto">
            {isReading ? "Leyendo..." : "Leer (TTS)"}
          </button>
          <button onClick={stopReading} className="px-3 py-1 border rounded">
            Detener
          </button>
        </div>
        <motion.img
          key={page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={`/pages/${page}.jpg`}
          alt={`Página ${page}`}
          className="w-full h-auto rounded shadow"
        />
      </main>
    </div>
  );
}
