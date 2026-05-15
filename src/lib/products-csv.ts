import type { Product, ProductStatus, ProductUpsertInput } from "@/types/domain";

export type ParsedProductsSpreadsheet = {
  rows: ProductUpsertInput[];
  errors: string[];
};

type ProductCsvColumnKey =
  | "codigo"
  | "qtdEstoque"
  | "nome"
  | "precoCompra"
  | "precoVenda"
  | "codigoBarras"
  | "unidade"
  | "ncm"
  | "cest"
  | "grupo"
  | "pesoBruto"
  | "pesoLiquido"
  | "comissao"
  | "status";

const headerAliases: Record<ProductCsvColumnKey, string[]> = {
  codigo: ["codigo", "codigo produto", "cod", "sku"],
  qtdEstoque: ["qtd estoque", "qtd. estoque", "quantidade estoque", "estoque"],
  nome: ["nome do produto", "nome produto", "produto", "nome"],
  precoCompra: ["preco de compra", "preco compra", "custo", "valor compra"],
  precoVenda: ["preco de venda", "preco venda", "valor venda"],
  codigoBarras: ["codigo de barras (gtin/ean)", "codigo de barras", "gtin", "ean"],
  unidade: ["unidade", "un"],
  ncm: ["ncm"],
  cest: ["cest"],
  grupo: ["grupo do produto", "grupo", "categoria"],
  pesoBruto: ["peso bruto (quilos)", "peso bruto", "peso bruto kg"],
  pesoLiquido: ["peso liquido (quilos)", "peso liquido", "peso liquido kg"],
  comissao: ["comissao (%)", "comissao", "comissao %"],
  status: ["status", "situacao"],
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCell(value: string) {
  return value.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
}

function detectDelimiter(input: string) {
  const sample = input.slice(0, 4000);
  const semicolonCount = (sample.match(/;/g) ?? []).length;
  const commaCount = (sample.match(/,/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsvTable(input: string, delimiter: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      currentRow.push(cleanCell(currentCell));
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(cleanCell(currentCell));
      currentCell = "";

      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(cleanCell(currentCell));
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseNumber(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const sanitizedValue = value.replace(/[^\d,.-]/g, "").trim();
  const lastComma = sanitizedValue.lastIndexOf(",");
  const lastDot = sanitizedValue.lastIndexOf(".");
  let normalizedValue = sanitizedValue;

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalizedValue = sanitizedValue.replace(/\./g, "").replace(",", ".");
    } else {
      normalizedValue = sanitizedValue.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    normalizedValue = sanitizedValue.replace(/\./g, "").replace(",", ".");
  } else {
    normalizedValue = sanitizedValue.replace(/,/g, "");
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeStatus(value: string): ProductStatus {
  const normalizedValue = normalizeHeader(value);
  if (normalizedValue.includes("inativ")) {
    return "inativo";
  }

  return "ativo";
}

function findHeaderRowIndex(rows: string[][]) {
  let bestIndex = 0;
  let bestScore = -1;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const normalizedCells = rows[rowIndex].map(normalizeHeader);
    let score = 0;

    for (const aliases of Object.values(headerAliases)) {
      if (normalizedCells.some((cell) => aliases.includes(cell))) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = rowIndex;
    }
  }

  return bestScore >= 3 ? bestIndex : 0;
}

function getHeaderIndex(headers: string[], key: ProductCsvColumnKey) {
  const aliases = headerAliases[key];
  return headers.findIndex((header) => aliases.includes(header));
}

/** Cabeçalhos oficiais do import/export (PT-BR), mesma ordem de `buildProductsCsv`. */
export const PRODUCT_IMPORT_TEMPLATE_HEADERS = [
  "Codigo",
  "Qtd. Estoque",
  "Nome do produto",
  "Preco de compra",
  "Preco de venda",
  "Codigo de barras (GTIN/EAN)",
  "Unidade",
  "NCM",
  "CEST",
  "Grupo do produto",
  "Peso Bruto (quilos)",
  "Peso Liquido (quilos)",
  "Comissao (%)",
  "Status",
] as const;

function validateProductImportHeaders(headers: string[], errors: string[]) {
  if (getHeaderIndex(headers, "codigo") < 0) {
    errors.push(
      'Coluna obrigatoria ausente: codigo (aceita "Codigo", "SKU", "Cod", etc.). Use o botao Baixar modelo.',
    );
  }
  if (getHeaderIndex(headers, "nome") < 0) {
    errors.push(
      'Coluna obrigatoria ausente: nome do produto (aceita "Nome", "Produto", etc.). Use o botao Baixar modelo.',
    );
  }
}

function parseProductsTable(table: string[][]): ParsedProductsSpreadsheet {
  if (table.length === 0) {
    return { rows: [], errors: ["O arquivo esta vazio."] };
  }

  const headerRowIndex = findHeaderRowIndex(table);
  const headers = table[headerRowIndex].map(normalizeHeader);
  const rows: ProductUpsertInput[] = [];
  const errors: string[] = [];

  validateProductImportHeaders(headers, errors);
  if (errors.length) {
    return { rows: [], errors };
  }

  for (let rowIndex = headerRowIndex + 1; rowIndex < table.length; rowIndex += 1) {
    const rawRow = table[rowIndex];
    if (rawRow.every((cell) => !cleanCell(String(cell ?? "")))) {
      continue;
    }
    const getValue = (key: ProductCsvColumnKey) => {
      const index = getHeaderIndex(headers, key);
      return index >= 0 ? cleanCell(rawRow[index] ?? "") : "";
    };

    const codigo = getValue("codigo");
    const nome = getValue("nome");

    if (!codigo) {
      errors.push(`Linha ${rowIndex + 1}: codigo e obrigatorio.`);
      continue;
    }

    if (!nome) {
      errors.push(`Linha ${rowIndex + 1}: nome do produto e obrigatorio.`);
      continue;
    }

    rows.push({
      codigo,
      qtdEstoque: parseNumber(getValue("qtdEstoque")),
      nome,
      precoCompra: parseNumber(getValue("precoCompra")),
      precoVenda: parseNumber(getValue("precoVenda")),
      codigoBarras: getValue("codigoBarras"),
      unidade: getValue("unidade") || "UN",
      ncm: getValue("ncm"),
      cest: getValue("cest"),
      grupo: getValue("grupo") || "Outros",
      pesoBruto: parseNumber(getValue("pesoBruto")),
      pesoLiquido: parseNumber(getValue("pesoLiquido")),
      comissao: parseNumber(getValue("comissao")),
      status: normalizeStatus(getValue("status")),
    });
  }

  return { rows, errors };
}

export function parseProductsCsv(input: string): ParsedProductsSpreadsheet {
  const delimiter = detectDelimiter(input);
  const table = parseCsvTable(input, delimiter);
  return parseProductsTable(table);
}

export async function parseProductsSpreadsheet(file: File): Promise<ParsedProductsSpreadsheet> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const text = await file.text();
    return parseProductsCsv(text);
  }

  const buffer = await file.arrayBuffer();
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return { rows: [], errors: ["A planilha nao possui abas validas."] };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  const table = jsonRows.map((row) => row.map((cell) => cleanCell(String(cell ?? ""))));
  return parseProductsTable(table);
}

function escapeCsvCell(value: string | number) {
  const text = String(value ?? "");
  if (/[",;\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Planilha modelo (CSV) com uma linha de exemplo. Separador `;` (exportacao padrao do app).
 */
export function buildProductImportTemplateCsv(): string {
  const exampleRow = [
    "EX-001",
    10,
    "Produto exemplo (substitua ou apague)",
    5.5,
    12.9,
    "",
    "UN",
    "",
    "",
    "Outros",
    0,
    0,
    0,
    "ativo",
  ];
  return [[...PRODUCT_IMPORT_TEMPLATE_HEADERS], exampleRow]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(";"))
    .join("\n");
}

export function buildProductsCsv(products: Product[]) {
  const rows = products.map((product) => [
    product.codigo,
    product.qtdEstoque,
    product.nome,
    product.precoCompra,
    product.precoVenda,
    product.codigoBarras,
    product.unidade,
    product.ncm,
    product.cest,
    product.grupo,
    product.pesoBruto,
    product.pesoLiquido,
    product.comissao,
    product.status,
  ]);

  return [[...PRODUCT_IMPORT_TEMPLATE_HEADERS], ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(";"))
    .join("\n");
}
