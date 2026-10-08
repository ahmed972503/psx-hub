import type { CompanyRecord, SectorRecord, Sensitivity } from "@/lib/intelligence/types";

type Exposure = CompanyRecord["exposures"][number];

function x(
  factor: Exposure["factor"],
  sensitivity: Sensitivity,
  weight: number,
  note: string,
): Exposure {
  return { factor, sensitivity, weight, note };
}

const bank: Exposure[] = [
  x(
    "INTEREST_RATE",
    "BENEFITS_WHEN_FACTOR_RISES",
    68,
    "Higher policy rates can support net interest margins, and can also raise credit-risk pressure. This is not a price forecast.",
  ),
  x(
    "IMF",
    "MIXED",
    42,
    "IMF developments can move banks through rates, the rupee, and sovereign risk. The direction depends on the specific decision.",
  ),
  x(
    "USD_PKR",
    "MIXED",
    35,
    "Currency moves can affect banks through trade finance, dollar liquidity, and macroeconomic risk.",
  ),
];

const ep: Exposure[] = [
  x(
    "OIL",
    "BENEFITS_WHEN_FACTOR_RISES",
    82,
    "Exploration companies can see higher realized prices when international oil rises, depending on contracts and local pricing rules.",
  ),
  x(
    "GAS",
    "BENEFITS_WHEN_FACTOR_RISES",
    58,
    "Gas price moves can affect producer realization.",
  ),
  x(
    "USD_PKR",
    "BENEFITS_WHEN_FACTOR_RISES",
    62,
    "A weaker rupee can support the rupee value of dollar-linked revenue.",
  ),
];

const omc: Exposure[] = [
  x(
    "OIL",
    "MIXED",
    60,
    "Oil price moves can change inventory gains or losses and working capital. Regulated margins may not move one-for-one with crude.",
  ),
  x(
    "USD_PKR",
    "HURT_WHEN_FACTOR_RISES",
    70,
    "A weaker rupee raises the rupee cost of imported fuel.",
  ),
  x(
    "TAX",
    "HURT_WHEN_FACTOR_RISES",
    48,
    "Higher petroleum levies can pressure volumes even when the company collects the levy.",
  ),
];

const refinery: Exposure[] = [
  x(
    "OIL",
    "MIXED",
    64,
    "Crude and product prices can move refinery margins in either direction. The text alone does not establish the crack spread.",
  ),
  x(
    "USD_PKR",
    "HURT_WHEN_FACTOR_RISES",
    58,
    "A weaker rupee raises the cost of imported crude.",
  ),
];

const cement: Exposure[] = [
  x(
    "COAL",
    "HURT_WHEN_FACTOR_RISES",
    78,
    "Coal is a major fuel and cost input for cement kilns.",
  ),
  x(
    "ELECTRICITY",
    "HURT_WHEN_FACTOR_RISES",
    50,
    "Higher power tariffs raise operating cost.",
  ),
  x(
    "INTEREST_RATE",
    "HURT_WHEN_FACTOR_RISES",
    55,
    "Higher rates can slow construction demand and raise financing cost.",
  ),
  x(
    "USD_PKR",
    "HURT_WHEN_FACTOR_RISES",
    40,
    "A weaker rupee can raise the cost of imported coal and spare parts.",
  ),
];

const fertilizer: Exposure[] = [
  x(
    "GAS",
    "HURT_WHEN_FACTOR_RISES",
    80,
    "Gas is the main feedstock. A higher gas price can compress margins if selling prices do not adjust.",
  ),
  x(
    "TAX",
    "MIXED",
    40,
    "Subsidy, GST, or agricultural-tax changes can alter demand or netbacks. Direction depends on the measure.",
  ),
];

const textile: Exposure[] = [
  x(
    "USD_PKR",
    "BENEFITS_WHEN_FACTOR_RISES",
    72,
    "Exporters can receive more rupees per dollar of export revenue when the rupee weakens, before cost inflation.",
  ),
  x(
    "ELECTRICITY",
    "HURT_WHEN_FACTOR_RISES",
    62,
    "Power tariffs are a large operating cost for mills.",
  ),
  x(
    "INTEREST_RATE",
    "HURT_WHEN_FACTOR_RISES",
    48,
    "Higher rates raise working-capital cost.",
  ),
  x(
    "GAS",
    "HURT_WHEN_FACTOR_RISES",
    45,
    "Higher gas tariffs raise energy cost.",
  ),
];

const auto: Exposure[] = [
  x(
    "USD_PKR",
    "HURT_WHEN_FACTOR_RISES",
    75,
    "Assemblers import kits and parts. A weaker rupee raises those costs.",
  ),
  x(
    "INTEREST_RATE",
    "HURT_WHEN_FACTOR_RISES",
    66,
    "Higher rates can slow auto financing and demand.",
  ),
];

const power: Exposure[] = [
  x(
    "ELECTRICITY",
    "MIXED",
    50,
    "Tariff decisions can change revenue, receivables, and demand. The direction depends on the decision.",
  ),
  x(
    "USD_PKR",
    "MIXED",
    48,
    "Some power contracts have dollar-linked components. Receivables and fuel cost can move differently.",
  ),
  x(
    "INTEREST_RATE",
    "HURT_WHEN_FACTOR_RISES",
    40,
    "Higher rates raise financing cost on leveraged power companies.",
  ),
  x(
    "OIL",
    "MIXED",
    35,
    "Fuel cost pass-through depends on the contract. Do not assume a uniform benefit or loss.",
  ),
];

const pharma: Exposure[] = [
  x(
    "USD_PKR",
    "HURT_WHEN_FACTOR_RISES",
    70,
    "A weaker rupee raises the cost of imported active ingredients.",
  ),
  x(
    "TAX",
    "MIXED",
    30,
    "Tax or pricing-policy changes can affect net prices. Direction depends on the measure.",
  ),
];

const tech: Exposure[] = [
  x(
    "USD_PKR",
    "BENEFITS_WHEN_FACTOR_RISES",
    70,
    "Export revenue in dollars can translate into more rupees when the rupee weakens.",
  ),
  x(
    "INTEREST_RATE",
    "HURT_WHEN_FACTOR_RISES",
    30,
    "Higher rates can pressure valuations and financing, with less direct impact on export revenue.",
  ),
];

export const SECTORS: SectorRecord[] = [
  { slug: "commercial-banks", name: "Commercial Banks", summary: "Listed deposit-taking banks.", phrases: ["banking sector", "bank stocks", "commercial banks"] },
  { slug: "exploration-production", name: "Oil & Gas Exploration", summary: "Listed exploration and production companies.", phrases: ["exploration companies", "e&p sector", "oil and gas producers"] },
  { slug: "oil-marketing", name: "Oil Marketing", summary: "Listed oil marketing companies.", phrases: ["oil marketing", "omc sector", "omcs"] },
  { slug: "refinery", name: "Refinery", summary: "Listed oil refineries.", phrases: ["refinery sector", "refineries"] },
  { slug: "fertilizer", name: "Fertilizer", summary: "Listed fertilizer producers.", phrases: ["fertilizer sector", "fertiliser sector"] },
  { slug: "cement", name: "Cement", summary: "Listed cement manufacturers.", phrases: ["cement sector", "cement stocks"] },
  { slug: "power", name: "Power", summary: "Listed power producers and utilities.", phrases: ["power sector", "ipps"] },
  { slug: "gas-utilities", name: "Gas Utilities", summary: "Listed gas distribution companies.", phrases: ["gas utilities", "sui companies"] },
  { slug: "technology", name: "Technology", summary: "Listed technology and export services companies.", phrases: ["technology sector", "it exporters"] },
  { slug: "textile", name: "Textile", summary: "Listed textile manufacturers and exporters.", phrases: ["textile sector", "textile exporters"] },
  { slug: "automobile", name: "Automobile", summary: "Listed auto assemblers and tractor makers.", phrases: ["auto sector", "automobile sector", "car assemblers"] },
  { slug: "chemicals", name: "Chemicals", summary: "Listed chemical producers.", phrases: ["chemical sector"] },
  { slug: "pharma", name: "Pharmaceuticals", summary: "Listed pharmaceutical companies.", phrases: ["pharma sector", "pharmaceutical sector"] },
  { slug: "engineering", name: "Engineering", summary: "Listed steel and engineering companies.", phrases: ["steel sector", "engineering sector"] },
  { slug: "food", name: "Food", summary: "Listed food producers.", phrases: ["food sector"] },
  { slug: "conglomerate", name: "Conglomerate", summary: "Listed holding companies with several businesses.", phrases: ["conglomerates"] },
  { slug: "insurance", name: "Insurance", summary: "Listed insurers.", phrases: ["insurance sector"] },
];

function c(
  ticker: string,
  name: string,
  sectorSlug: string,
  aliases: string[],
  exposures: Exposure[],
): CompanyRecord {
  return { ticker, name, sectorSlug, aliases, exposures };
}

export const COMPANIES: CompanyRecord[] = [
  c("HBL", "Habib Bank", "commercial-banks", ["habib bank limited", "habib bank"], bank),
  c("UBL", "United Bank", "commercial-banks", ["united bank limited", "united bank"], bank),
  c("MCB", "MCB Bank", "commercial-banks", ["mcb bank"], bank),
  c("MEBL", "Meezan Bank", "commercial-banks", ["meezan bank", "meezan"], bank),
  c("BAFL", "Bank Alfalah", "commercial-banks", ["bank alfalah"], bank),
  c("BAHL", "Bank AL Habib", "commercial-banks", ["bank al habib", "bank alhabib"], bank),
  c("ABL", "Allied Bank", "commercial-banks", ["allied bank"], bank),
  c("NBP", "National Bank of Pakistan", "commercial-banks", ["national bank of pakistan", "national bank"], bank),
  c("OGDC", "Oil and Gas Development Company", "exploration-production", ["oil and gas development", "ogdcl"], ep),
  c("PPL", "Pakistan Petroleum", "exploration-production", ["pakistan petroleum"], ep),
  c("POL", "Pakistan Oilfields", "exploration-production", ["pakistan oilfields"], ep),
  c("MARI", "Mari Energies", "exploration-production", ["mari energies", "mari petroleum"], ep),
  c("PSO", "Pakistan State Oil", "oil-marketing", ["pakistan state oil"], omc),
  c("APL", "Attock Petroleum", "oil-marketing", ["attock petroleum"], omc),
  c("ATRL", "Attock Refinery", "refinery", ["attock refinery"], refinery),
  c("NRL", "National Refinery", "refinery", ["national refinery"], refinery),
  c("PRL", "Pakistan Refinery", "refinery", ["pakistan refinery"], refinery),
  c("CNERGY", "Cnergyico", "refinery", ["cnergyico", "byco"], refinery),
  c("FFC", "Fauji Fertilizer Company", "fertilizer", ["fauji fertilizer company", "fauji fertilizer"], fertilizer),
  c("EFERT", "Engro Fertilizers", "fertilizer", ["engro fertilizers", "engro fertilisers"], fertilizer),
  c("FATIMA", "Fatima Fertilizer", "fertilizer", ["fatima fertilizer"], fertilizer),
  c("LUCK", "Lucky Cement", "cement", ["lucky cement"], cement),
  c("DGKC", "D.G. Khan Cement", "cement", ["d.g. khan cement", "dg khan cement", "d g khan cement"], cement),
  c("MLCF", "Maple Leaf Cement", "cement", ["maple leaf cement"], cement),
  c("FCCL", "Fauji Cement", "cement", ["fauji cement"], cement),
  c("CHCC", "Cherat Cement", "cement", ["cherat cement"], cement),
  c("KOHC", "Kohat Cement", "cement", ["kohat cement"], cement),
  c("PIOC", "Pioneer Cement", "cement", ["pioneer cement"], cement),
  c("HUBC", "The Hub Power Company", "power", ["hub power", "hubco"], power),
  c("KAPCO", "Kot Addu Power", "power", ["kot addu power", "kot addu"], power),
  c("KEL", "K-Electric", "power", ["k-electric", "k electric"], power),
  c("SNGP", "Sui Northern Gas Pipelines", "gas-utilities", ["sui northern", "sngpl"], [
    x("GAS", "MIXED", 70, "Gas tariff decisions affect both the cost of gas and the company's regulated return. Direction depends on the decision."),
  ]),
  c("SSGC", "Sui Southern Gas Company", "gas-utilities", ["sui southern"], [
    x("GAS", "MIXED", 70, "Gas tariff decisions affect both the cost of gas and the company's regulated return. Direction depends on the decision."),
  ]),
  c("SYS", "Systems Limited", "technology", ["systems limited"], tech),
  c("TRG", "TRG Pakistan", "technology", ["trg pakistan"], tech),
  c("NETSOL", "NetSol Technologies", "technology", ["netsol"], tech),
  c("AVN", "Avanceon", "technology", ["avanceon"], tech),
  c("NML", "Nishat Mills", "textile", ["nishat mills"], textile),
  c("ILP", "Interloop", "textile", ["interloop"], textile),
  c("INDU", "Indus Motor Company", "automobile", ["indus motor", "toyota indus"], auto),
  c("HCAR", "Honda Atlas Cars", "automobile", ["honda atlas"], auto),
  c("PSMC", "Pak Suzuki Motor", "automobile", ["pak suzuki"], auto),
  c("MTL", "Millat Tractors", "automobile", ["millat tractors"], [
    x("INTEREST_RATE", "HURT_WHEN_FACTOR_RISES", 55, "Higher rates can slow tractor and farm-equipment financing."),
    x("TAX", "MIXED", 35, "Agricultural tax or subsidy changes can affect demand. Direction depends on the measure."),
  ]),
  c("EPCL", "Engro Polymer & Chemicals", "chemicals", ["engro polymer"], [
    x("USD_PKR", "HURT_WHEN_FACTOR_RISES", 50, "Imported feedstock costs can rise when the rupee weakens."),
    x("GAS", "HURT_WHEN_FACTOR_RISES", 40, "Higher energy costs can pressure chemical margins."),
  ]),
  c("LOTCHEM", "Lotte Chemical Pakistan", "chemicals", ["lotte chemical"], [
    x("USD_PKR", "HURT_WHEN_FACTOR_RISES", 48, "Imported inputs can cost more when the rupee weakens."),
  ]),
  c("ENGRO", "Engro Holdings", "conglomerate", ["engro holdings", "engro corporation", "engro corp"], [
    x("GAS", "MIXED", 40, "Engro's fertilizer and chemical interests can be affected by gas pricing. The holding company is not a single-commodity bet."),
    x("INTEREST_RATE", "MIXED", 35, "Rate moves can affect several Engro businesses in different directions."),
  ]),
  c("SEARL", "The Searle Company", "pharma", ["searle company", "the searle"], pharma),
  c("GLAXO", "GlaxoSmithKline Pakistan", "pharma", ["glaxosmithkline", "gsk pakistan"], pharma),
  c("AGP", "AGP Limited", "pharma", ["agp limited"], pharma),
  c("MUGHAL", "Mughal Iron & Steel", "engineering", ["mughal iron", "mughal steel"], [
    x("ELECTRICITY", "HURT_WHEN_FACTOR_RISES", 60, "Power is a major cost for steelmaking."),
    x("USD_PKR", "HURT_WHEN_FACTOR_RISES", 45, "Imported scrap or inputs can cost more when the rupee weakens."),
    x("INTEREST_RATE", "HURT_WHEN_FACTOR_RISES", 40, "Higher rates can slow construction demand."),
  ]),
  c("ISL", "International Steels", "engineering", ["international steels"], [
    x("USD_PKR", "HURT_WHEN_FACTOR_RISES", 55, "Imported raw material can cost more when the rupee weakens."),
    x("INTEREST_RATE", "HURT_WHEN_FACTOR_RISES", 35, "Higher rates can slow industrial demand."),
  ]),
  c("NESTLE", "Nestle Pakistan", "food", ["nestle pakistan"], [
    x("USD_PKR", "HURT_WHEN_FACTOR_RISES", 40, "Imported inputs can cost more when the rupee weakens."),
    x("INFLATION", "MIXED", 35, "Food inflation can lift selling prices and also squeeze volumes. Direction is not automatic."),
  ]),
  c("UNITY", "Unity Foods", "food", ["unity foods"], [
    x("USD_PKR", "HURT_WHEN_FACTOR_RISES", 55, "Edible-oil imports cost more when the rupee weakens."),
  ]),
  c("EFUG", "EFU General Insurance", "insurance", ["efu general"], [
    x("INTEREST_RATE", "MIXED", 30, "Rates can affect investment income and claims costs in different directions."),
  ]),
];
