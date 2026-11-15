import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Contexto, type Estado, type Paneles, type Tema } from "./contexto";
import type { Polygon } from "geojson";
import {
  esCodigoIdioma,
  fechaLarga,
  fijarIdioma,
  IDIOMAS,
  t,
  textoSemana,
  type CodigoIdioma,
} from "@/i18n";
import { DEPARTAMENTOS, nombreDepartamento } from "@/lib/departamentos";
import {
  cargarAnio,
  cargarManifiesto,
  indicePorDia,
  totalesPorDepartamento,
  type Foco,
  type IndiceDias,
  type Manifiesto,
} from "@/lib/datos";
import {
  alternarNivel,
  filtrarFocos,
  focosDelArea,
  nivelesPorDia,
  TODOS_LOS_NIVELES,
  type Area,
  type NivelesActivos,
} from "@/lib/filtros";
import { calcularResumen, type Resumen } from "@/lib/indicadores";
import { limitesDelAnio, type Limites, type Nivel } from "@/lib/niveles";
import {
  anioDe,
  calcularPeriodo,
  claveFecha,
  diasDelMes,
  mesDe,
  periodoAnterior,
  recortar,
  type Granularidad,
  type Periodo,
} from "@/lib/periodos";

function etiquetaDePeriodo(p: Periodo): string {
  const anio = anioDe(p.inicio);
  switch (p.gran) {
    case "anio":
      return String(anio);
    case "mes":
      return t.mesAnio(mesDe(p.inicio), anio);
    case "semana":
      return textoSemana(p.inicio, p.fin);
    case "dia":
      return fechaLarga(p.inicio);
  }
}

function etiquetaDeArea(area: Area): string {
  if (area.modo === "dibujo") return area.poligono ? t.areaDibujada : t.dibujar;
  const n = area.departamentos.length;
  if (n === DEPARTAMENTOS.length) return t.todoPeru;
  if (n === 0) return t.sinArea;
  if (n <= 3) return area.departamentos.map(nombreDepartamento).join(", ");
  return t.nDepartamentos(n);
}

export function ProveedorEstado({ children }: { children: ReactNode }) {
  const [manifiesto, setManifiesto] = useState<Manifiesto | null>(null);
  const [cargados, setCargados] = useState<Map<number, Foco[]>>(new Map());
  const [pendientes, setPendientes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [area, setArea] = useState<Area>({
    modo: "departamentos",
    departamentos: [...DEPARTAMENTOS],
    poligono: null,
  });
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [gran, setGran] = useState<Granularidad>("mes");
  const [mes, setMes] = useState(new Date().getMonth());
  const [dia, setDia] = useState(claveFecha(new Date().getFullYear(), new Date().getMonth(), 1));
  const [activos, setActivos] = useState<NivelesActivos>(TODOS_LOS_NIVELES);
  const [paneles, setPaneles] = useState<Paneles>({ area: true, resumen: true, fechas: true });
  const [escala, setEscala] = useState<0 | 1 | 2>(0);
  const [idioma, setIdioma] = useState<CodigoIdioma>("es");
  // Fijar el idioma antes de calcular etiquetas y renderizar los paneles.
  fijarIdioma(idioma);
  const [tema, setTema] = useState<Tema>("oscuro");
  // Aplicar el tema antes de que el mapa lea los colores (sus efectos corren antes que los nuestros).
  if (typeof document !== "undefined") document.documentElement.dataset["tema"] = tema;
  useEffect(() => {
    const deUrl = new URLSearchParams(window.location.search).get("tema");
    if (deUrl === "claro" || deUrl === "oscuro") {
      setTema(deUrl);
      return;
    }
    try {
      const guardado = localStorage.getItem("tema");
      if (guardado === "claro" || guardado === "oscuro") setTema(guardado);
    } catch {
      // Sin almacenamiento: tema oscuro.
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("tema", tema);
    } catch {
      // Ignorar.
    }
  }, [tema]);
  const [dibujoVersion, setDibujoVersion] = useState(0);

  // Recuperar el idioma elegido antes (solo en el navegador, para no romper la hidratación).
  useEffect(() => {
    // Un enlace con ?lang=qu (o ay, en, es) tiene prioridad sobre lo guardado.
    const deUrl = new URLSearchParams(window.location.search).get("lang");
    if (esCodigoIdioma(deUrl)) {
      setIdioma(deUrl);
      return;
    }
    try {
      const guardado = localStorage.getItem("idioma");
      if (esCodigoIdioma(guardado)) setIdioma(guardado);
    } catch {
      // Sin almacenamiento: se queda en español.
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = IDIOMAS.find((i) => i.codigo === idioma)?.lang ?? "es";
    document.title = `${t.titulo} | Junior FC`;
    try {
      localStorage.setItem("idioma", idioma);
    } catch {
      // Ignorar: el idioma solo no se recordará.
    }
  }, [idioma]);

  // En pantallas pequeñas, empezar con los paneles laterales cerrados.
  useEffect(() => {
    if (window.matchMedia("(max-width: 900px)").matches)
      setPaneles({ area: false, resumen: true, fechas: false });
  }, []);

  useEffect(() => {
    cargarManifiesto()
      .then(setManifiesto)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const anios = useMemo(
    () =>
      manifiesto
        ? Object.keys(manifiesto)
            .map(Number)
            .sort((a, b) => a - b)
        : [],
    [manifiesto],
  );
  const anioMax = anios.at(-1) ?? null;

  // Al conocer los años disponibles, ir al más reciente.
  useEffect(() => {
    if (anioMax !== null && !anios.includes(anio)) setAnio(anioMax);
  }, [anioMax, anios, anio]);

  // Cargar el año elegido y sus vecinos (fechas locales que cruzan el año y periodo anterior).
  useEffect(() => {
    if (!manifiesto) return;
    const faltan = [anio - 1, anio, anio + 1].filter((a) => manifiesto[a] && !cargados.has(a));
    if (!faltan.length) return;
    setPendientes((p) => p + faltan.length);
    for (const a of faltan) {
      cargarAnio(manifiesto[a] ?? [])
        .then((focos) => setCargados((prev) => new Map(prev).set(a, focos)))
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setPendientes((p) => p - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifiesto, anio]);

  const ultimaFecha = useMemo(() => {
    const focos = anioMax !== null ? cargados.get(anioMax) : undefined;
    if (!focos?.length) return null;
    let max = "";
    for (const f of focos) if (f.fecha > max) max = f.fecha;
    return max;
  }, [cargados, anioMax]);

  // Al tener la última fecha, mostrar ese mes y ese día.
  const [inicializado, setInicializado] = useState(false);
  useEffect(() => {
    if (inicializado || !ultimaFecha || anio !== anioMax) return;
    setMes(mesDe(ultimaFecha));
    setDia(ultimaFecha);
    setInicializado(true);
  }, [inicializado, ultimaFecha, anio, anioMax]);

  const todos = useMemo(() => [...cargados.values()].flat(), [cargados]);
  const focosArea = useMemo(() => focosDelArea(todos, area), [todos, area]);
  const indiceArea = useMemo(() => indicePorDia(focosArea), [focosArea]);
  const limites = useMemo(() => limitesDelAnio(indiceArea, anio), [indiceArea, anio]);
  const niveles = useMemo(() => nivelesPorDia(indiceArea, limites), [indiceArea, limites]);
  const periodo = useMemo(() => calcularPeriodo(gran, anio, mes, dia), [gran, anio, mes, dia]);
  const focosVisibles = useMemo(
    () => filtrarFocos(focosArea, periodo, niveles, activos),
    [focosArea, periodo, niveles, activos],
  );

  const resumen = useMemo(() => {
    const comparable = recortar(periodo, ultimaFecha);
    const anterior = periodoAnterior(comparable);
    const disponible = [anioDe(anterior.inicio), anioDe(anterior.fin)].every((a) =>
      cargados.has(a),
    );
    return calcularResumen({
      focos: filtrarFocos(focosArea, comparable, niveles, activos),
      anteriores: disponible ? filtrarFocos(focosArea, anterior, niveles, activos) : null,
      periodo,
      niveles,
      ultimaFecha,
      mostrarDepartamento: area.modo === "departamentos" && area.departamentos.length > 1,
    });
  }, [periodo, ultimaFecha, cargados, focosArea, niveles, activos, area]);

  const totalesDepartamento = useMemo(() => totalesPorDepartamento(todos, anio), [todos, anio]);

  const elegirModo = useCallback((modo: Area["modo"]) => {
    setArea((a) => ({ ...a, modo, poligono: null }));
    if (modo === "dibujo") setDibujoVersion((v) => v + 1);
  }, []);
  const alternarDepartamento = useCallback((clave: string) => {
    setArea((a) =>
      a.modo !== "departamentos"
        ? a
        : {
            ...a,
            departamentos: a.departamentos.includes(clave)
              ? a.departamentos.filter((d) => d !== clave)
              : [...a.departamentos, clave],
          },
    );
  }, []);
  const fijarDepartamentos = useCallback(
    (claves: string[]) => setArea((a) => ({ ...a, departamentos: claves })),
    [],
  );
  const fijarPoligono = useCallback(
    (poligono: Polygon | null) => setArea((a) => ({ ...a, poligono })),
    [],
  );
  const redibujar = useCallback(() => {
    setArea((a) => ({ ...a, modo: "dibujo", poligono: null }));
    setDibujoVersion((v) => v + 1);
  }, []);
  const elegirAnio = useCallback(
    (a: number) => {
      setAnio(a);
      const m = a === anioMax && ultimaFecha ? Math.min(mes, mesDe(ultimaFecha)) : mes;
      setMes(m);
      const d = Math.min(Number(dia.slice(8)), diasDelMes(a, m));
      let nuevo = claveFecha(a, m, d);
      if (ultimaFecha && nuevo > ultimaFecha) nuevo = ultimaFecha;
      setDia(nuevo);
    },
    [anioMax, ultimaFecha, mes, dia],
  );

  const irAMes = useCallback(
    (m: number) => {
      const limite = Math.max(0, Math.min(11, m));
      setMes(limite);
      // En Semana/Día el periodo sigue al día elegido; si el usuario cambia de mes, elegimos el primer día con datos.
      if (gran === "semana" || gran === "dia") {
        let d = claveFecha(anio, limite, 1);
        if (ultimaFecha && d > ultimaFecha) d = ultimaFecha;
        setDia(d);
      }
    },
    [gran, anio, ultimaFecha],
  );
  const moverMes = useCallback((delta: number) => irAMes(mes + delta), [irAMes, mes]);

  const elegirGran = useCallback(
    (g: Granularidad) => {
      setGran(g);
      if ((g === "semana" || g === "dia") && mesDe(dia) !== mes) {
        let d = claveFecha(anio, mes, 1);
        if (ultimaFecha && d > ultimaFecha) d = ultimaFecha;
        setDia(d);
      }
    },
    [dia, mes, anio, ultimaFecha],
  );

  const elegirDia = useCallback((d: string) => {
    setDia(d);
    setMes(mesDe(d));
    // En Año y Mes, tocar un día lleva a ver ese día.
    setGran((g) => (g === "anio" || g === "mes" ? "dia" : g));
  }, []);

  const valor: Estado = {
    cargando:
      !manifiesto || pendientes > 0 || (!!manifiesto && !cargados.has(anio) && !!manifiesto[anio]),
    error,
    anios,
    ultimaFecha,
    area,
    anio,
    gran,
    mes,
    dia,
    activos,
    paneles,
    escala,
    idioma,
    tema,
    dibujoVersion,
    periodo,
    etiquetaPeriodo: etiquetaDePeriodo(periodo),
    etiquetaArea: etiquetaDeArea(area),
    indiceArea,
    limites,
    niveles,
    focosVisibles,
    resumen,
    totalesDepartamento,
    elegirModo,
    alternarDepartamento,
    fijarDepartamentos,
    fijarPoligono,
    redibujar,
    elegirAnio,
    elegirGran,
    moverMes,
    irAMes,
    elegirDia,
    alternarNivel: (n) => setActivos((a) => alternarNivel(a, n)),
    alternarPanel: (p) =>
      setPaneles((s) => {
        const sig = { ...s, [p]: !s[p] };
        // En pantallas angostas, solo un panel lateral abierto a la vez.
        if (sig[p] && p !== "resumen" && window.matchMedia("(max-width: 900px)").matches)
          sig[p === "area" ? "fechas" : "area"] = false;
        return sig;
      }),
    fijarEscala: setEscala,
    elegirIdioma: setIdioma,
    alternarTema: () => setTema((x) => (x === "oscuro" ? "claro" : "oscuro")),
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
