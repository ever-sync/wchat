export const BRAZIL_STATES = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapa" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceara" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espirito Santo" },
  { uf: "GO", nome: "Goias" },
  { uf: "MA", nome: "Maranhao" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Para" },
  { uf: "PB", nome: "Paraiba" },
  { uf: "PR", nome: "Parana" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piaui" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondonia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "Sao Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
] as const;

export const ZONE_OPTIONS = [
  "Centro",
  "Zona Norte",
  "Zona Sul",
  "Zona Leste",
  "Zona Oeste",
  "Regiao Metropolitana",
  "Litoral",
  "Interior",
  "Area Rural",
] as const;

export async function fetchCitiesByState(stateUf: string) {
  if (!stateUf) {
    return [] as string[];
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${stateUf}?providers=dados-abertos-br,gov,wikipedia`);
    if (!response.ok) {
      throw new Error("Falha ao consultar cidades.");
    }

    const payload = (await response.json()) as Array<{ nome?: string }>;
    return payload
      .map((item) => item.nome?.trim() ?? "")
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, "pt-BR"));
  } catch {
    return [];
  }
}

export function buildRouteRegion(estado?: string, cidade?: string, zona?: string) {
  const parts = [zona, cidade, estado].filter(Boolean);
  return parts.join(" · ");
}
