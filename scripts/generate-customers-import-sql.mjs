import fs from "node:fs";
import path from "node:path";

const [, , csvPathArg, tenantId, outputPathArg] = process.argv;

if (!csvPathArg || !tenantId || !outputPathArg) {
  console.error("Uso: node scripts/generate-customers-import-sql.mjs <csvPath> <tenantId> <outputPath>");
  process.exit(1);
}

const csvPath = path.resolve(csvPathArg);
const outputPath = path.resolve(outputPathArg);
const rawInput = fs.readFileSync(csvPath, "utf8");

const headerAliases = {
  tipo: ["tipo"],
  nome: ["nome", "nome fantasia", "nome/nome fantasia", "cliente", "name"],
  razaoSocial: ["razao social", "nome social", "razao social/nome social"],
  cnpj: ["cnpj", "documento"],
  inscricaoEstadual: ["i.e.", "ie", "inscricao estadual"],
  inscricaoMunicipal: ["i.m.", "im", "inscricao municipal"],
  cpf: ["cpf"],
  rg: ["rg"],
  nascimento: ["nascimento", "data nascimento", "data de nascimento"],
  status: ["status", "situacao", "situacao cadastral"],
  telefone: ["telefone", "fone", "phone"],
  celular: ["celular", "whatsapp", "telefone celular"],
  fax: ["fax"],
  email: ["email", "e-mail", "mail"],
  canal: ["canal"],
  cep: ["cep"],
  endereco: ["endereco", "logradouro", "rua"],
  bairro: ["bairro"],
  complemento: ["complemento"],
  cidade: ["cidade"],
  estado: ["estado", "uf"],
  vendedor: ["vendedor", "responsavel", "vendedor/responsavel"],
  observacoes: ["observacoes", "observacao", "obs"],
  cadastradoEm: ["cadastrado em", "data cadastro", "criado em"],
  perfil: ["perfil", "profile"],
  rota: ["rota", "route"],
  ultimoPedido: ["ultimo pedido", "ultimo_pedido", "last order"],
  ticketMedio: ["ticket medio", "ticket medio rs", "ticket medio r$", "ticket medio (r$)", "ticket"],
  frequenciaCompra: ["frequencia compra", "frequencia_compra", "frequencia"],
  totalGasto: ["total gasto", "total_gasto", "faturamento", "spent"],
};

function normalizeHeader(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
}

function cleanCell(value) {
  return value.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
}

function detectDelimiter(input) {
  const sample = input.slice(0, 4000);
  const semicolonCount = (sample.match(/;/g) ?? []).length;
  const commaCount = (sample.match(/,/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsvTable(input, delimiter) {
  const rows = [];
  let currentRow = [];
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

function findHeaderRowIndex(rows) {
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

  return bestIndex;
}

function getHeaderIndex(headers, key) {
  const aliases = headerAliases[key];
  return headers.findIndex((header) => aliases.includes(header));
}

function parseNumber(value) {
  if (!value.trim()) {
    return 0;
  }

  const normalizedValue = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeStatus(value) {
  const normalizedValue = normalizeHeader(value);
  if (normalizedValue.includes("bloque")) {
    return "bloqueado";
  }

  if (normalizedValue.includes("inativ")) {
    return "inativo";
  }

  return "ativo";
}

function normalizeDateOnly(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const brazilianDateMatch = trimmedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brazilianDateMatch) {
    const [, day, month, year] = brazilianDateMatch;
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmedValue)) {
    return trimmedValue.slice(0, 10);
  }

  return "";
}

function normalizePhone(rawPhone) {
  const rawDigits = rawPhone.replace(/\D/g, "");
  if (!rawDigits) {
    return { digits: "", e164: "", jid: "" };
  }

  const digits = (() => {
    const normalizeNationalDigits = (value) => {
      const nationalDigits = value.length > 11 ? value.slice(-11) : value;
      return nationalDigits.length >= 10 ? nationalDigits : "";
    };

    if (rawDigits.startsWith("55")) {
      const nationalDigits = normalizeNationalDigits(rawDigits.slice(2));
      return nationalDigits ? `55${nationalDigits}` : "";
    }

    const nationalDigits = normalizeNationalDigits(rawDigits.replace(/^0+/, ""));
    return nationalDigits ? `55${nationalDigits}` : "";
  })();

  if (!digits) {
    return { digits: "", e164: "", jid: "" };
  }

  return {
    digits,
    e164: `+${digits}`,
    jid: `${digits}@s.whatsapp.net`,
  };
}

function buildSourceColumns(rawHeaders, rawRow) {
  return rawHeaders.reduce((columns, header, index) => {
    const key = cleanCell(header);
    if (!key) {
      return columns;
    }

    columns[key] = cleanCell(rawRow[index] ?? "");
    return columns;
  }, {});
}

const delimiter = detectDelimiter(rawInput);
const table = parseCsvTable(rawInput, delimiter);
const headerRowIndex = findHeaderRowIndex(table);
const rawHeaders = table[headerRowIndex];
const headers = rawHeaders.map(normalizeHeader);

const recordsByPhone = new Map();
const recordsWithoutPhone = [];

table.slice(headerRowIndex + 1).forEach((rawRow) => {
  const getValue = (key) => {
    const index = getHeaderIndex(headers, key);
    return index >= 0 ? cleanCell(rawRow[index] ?? "") : "";
  };

  const nome = getValue("nome");
  if (!nome) {
    return;
  }

  const telefone = getValue("celular") || getValue("telefone");
  const normalizedPhone = normalizePhone(telefone);
  const cadastradoEm = getValue("cadastradoEm");
  const ultimoPedido = normalizeDateOnly(getValue("ultimoPedido")) || normalizeDateOnly(cadastradoEm);

  const record = {
    tenant_id: tenantId,
    nome,
    telefone,
    phone_e164: normalizedPhone.e164,
    phone_digits: normalizedPhone.digits,
    phone_jid: normalizedPhone.jid,
    perfil: getValue("perfil").trim().toUpperCase() || "B",
    rota: getValue("rota"),
    ultimo_pedido: ultimoPedido || new Date().toISOString().slice(0, 10),
    status: normalizeStatus(getValue("status")),
    email: getValue("email"),
    cnpj: getValue("cnpj"),
    endereco: getValue("endereco"),
    vendedor: getValue("vendedor"),
    ticket_medio: parseNumber(getValue("ticketMedio")),
    frequencia_compra: getValue("frequenciaCompra") || "Quinzenal",
    total_gasto: parseNumber(getValue("totalGasto")),
    tipo: getValue("tipo"),
    razao_social: getValue("razaoSocial"),
    inscricao_estadual: getValue("inscricaoEstadual"),
    inscricao_municipal: getValue("inscricaoMunicipal"),
    cpf: getValue("cpf"),
    rg: getValue("rg"),
    nascimento: getValue("nascimento"),
    fax: getValue("fax"),
    canal: getValue("canal"),
    cep: getValue("cep"),
    bairro: getValue("bairro"),
    complemento: getValue("complemento"),
    cidade: getValue("cidade"),
    estado: getValue("estado"),
    observacoes: getValue("observacoes"),
    cadastrado_em: cadastradoEm,
    source_columns: buildSourceColumns(rawHeaders, rawRow),
  };

  if (normalizedPhone.jid) {
    recordsByPhone.set(normalizedPhone.jid, record);
  } else {
    recordsWithoutPhone.push(record);
  }
});

const records = [...recordsWithoutPhone, ...recordsByPhone.values()];

const payload = JSON.stringify(records);
const sql = `begin;
insert into public.customers (
  tenant_id,
  nome,
  telefone,
  phone_e164,
  phone_digits,
  phone_jid,
  perfil,
  rota,
  ultimo_pedido,
  status,
  email,
  cnpj,
  endereco,
  vendedor,
  ticket_medio,
  frequencia_compra,
  total_gasto,
  tipo,
  razao_social,
  inscricao_estadual,
  inscricao_municipal,
  cpf,
  rg,
  nascimento,
  fax,
  canal,
  cep,
  bairro,
  complemento,
  cidade,
  estado,
  observacoes,
  cadastrado_em,
  source_columns
)
select
  x.tenant_id::uuid,
  coalesce(x.nome, ''),
  coalesce(x.telefone, ''),
  nullif(x.phone_e164, ''),
  nullif(x.phone_digits, ''),
  nullif(x.phone_jid, ''),
  case when x.perfil in ('A', 'B', 'C') then x.perfil else 'B' end,
  coalesce(x.rota, ''),
  coalesce(nullif(x.ultimo_pedido, ''), current_date::text)::date,
  case
    when x.status in ('ativo', 'inativo', 'bloqueado') then x.status
    else 'ativo'
  end,
  coalesce(x.email, ''),
  coalesce(x.cnpj, ''),
  coalesce(x.endereco, ''),
  coalesce(x.vendedor, ''),
  coalesce(x.ticket_medio, 0),
  coalesce(nullif(x.frequencia_compra, ''), 'Quinzenal'),
  coalesce(x.total_gasto, 0),
  nullif(x.tipo, ''),
  nullif(x.razao_social, ''),
  nullif(x.inscricao_estadual, ''),
  nullif(x.inscricao_municipal, ''),
  nullif(x.cpf, ''),
  nullif(x.rg, ''),
  nullif(x.nascimento, ''),
  nullif(x.fax, ''),
  nullif(x.canal, ''),
  nullif(x.cep, ''),
  nullif(x.bairro, ''),
  nullif(x.complemento, ''),
  nullif(x.cidade, ''),
  nullif(x.estado, ''),
  nullif(x.observacoes, ''),
  nullif(x.cadastrado_em, ''),
  coalesce(x.source_columns, '{}'::jsonb)
from jsonb_to_recordset($json$${payload}$json$::jsonb) as x(
  tenant_id text,
  nome text,
  telefone text,
  phone_e164 text,
  phone_digits text,
  phone_jid text,
  perfil text,
  rota text,
  ultimo_pedido text,
  status text,
  email text,
  cnpj text,
  endereco text,
  vendedor text,
  ticket_medio numeric,
  frequencia_compra text,
  total_gasto numeric,
  tipo text,
  razao_social text,
  inscricao_estadual text,
  inscricao_municipal text,
  cpf text,
  rg text,
  nascimento text,
  fax text,
  canal text,
  cep text,
  bairro text,
  complemento text,
  cidade text,
  estado text,
  observacoes text,
  cadastrado_em text,
  source_columns jsonb
)
on conflict (tenant_id, phone_jid) do update set
  nome = excluded.nome,
  telefone = excluded.telefone,
  phone_e164 = excluded.phone_e164,
  phone_digits = excluded.phone_digits,
  perfil = excluded.perfil,
  rota = excluded.rota,
  ultimo_pedido = excluded.ultimo_pedido,
  status = excluded.status,
  email = excluded.email,
  cnpj = excluded.cnpj,
  endereco = excluded.endereco,
  vendedor = excluded.vendedor,
  ticket_medio = excluded.ticket_medio,
  frequencia_compra = excluded.frequencia_compra,
  total_gasto = excluded.total_gasto,
  tipo = excluded.tipo,
  razao_social = excluded.razao_social,
  inscricao_estadual = excluded.inscricao_estadual,
  inscricao_municipal = excluded.inscricao_municipal,
  cpf = excluded.cpf,
  rg = excluded.rg,
  nascimento = excluded.nascimento,
  fax = excluded.fax,
  canal = excluded.canal,
  cep = excluded.cep,
  bairro = excluded.bairro,
  complemento = excluded.complemento,
  cidade = excluded.cidade,
  estado = excluded.estado,
  observacoes = excluded.observacoes,
  cadastrado_em = excluded.cadastrado_em,
  source_columns = excluded.source_columns;
commit;

select count(*)::int as imported_total
from public.customers
where tenant_id = '${tenantId}';`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sql);
console.log(`SQL gerado em ${outputPath} com ${records.length} cliente(s).`);
