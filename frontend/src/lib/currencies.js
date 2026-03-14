// Comprehensive currency list with symbols
export const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "QAR", name: "Qatari Riyal", symbol: "﷼", flag: "🇶🇦" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", flag: "🇰🇼" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب", flag: "🇧🇭" },
  { code: "OMR", name: "Omani Rial", symbol: "﷼", flag: "🇴🇲" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£", flag: "🇪🇬" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", flag: "🇯🇴" },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", flag: "🇱🇧" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", flag: "🇲🇦" },
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", flag: "🇩🇿" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", flag: "🇹🇳" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", flag: "🇮🇶" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱" },
  { code: "AFN", name: "Afghan Afghani", symbol: "؋", flag: "🇦🇫" },
  { code: "IRR", name: "Iranian Rial", symbol: "﷼", flag: "🇮🇷" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", flag: "🇺🇦" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", flag: "🇷🇴" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", flag: "🇲🇽" },
  { code: "ARS", name: "Argentine Peso", symbol: "$", flag: "🇦🇷" },
  { code: "CLP", name: "Chilean Peso", symbol: "$", flag: "🇨🇱" },
  { code: "COP", name: "Colombian Peso", symbol: "$", flag: "🇨🇴" },
];

// Country to currency mapping
export const countryToCurrency = {
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  PT: "EUR",
  GR: "EUR",
  FI: "EUR",
  SA: "SAR",
  AE: "AED",
  QA: "QAR",
  KW: "KWD",
  BH: "BHD",
  OM: "OMR",
  EG: "EGP",
  JO: "JOD",
  LB: "LBP",
  TR: "TRY",
  IN: "INR",
  PK: "PKR",
  BD: "BDT",
  ID: "IDR",
  MY: "MYR",
  SG: "SGD",
  CN: "CNY",
  JP: "JPY",
  AU: "AUD",
  NZ: "NZD",
  ZA: "ZAR",
  NG: "NGN",
  KE: "KES",
  MA: "MAD",
  DZ: "DZD",
  TN: "TND",
  IQ: "IQD",
  IL: "ILS",
  AF: "AFN",
  IR: "IRR",
  PH: "PHP",
  TH: "THB",
  VN: "VND",
  KR: "KRW",
  RU: "RUB",
  UA: "UAH",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  CH: "CHF",
  BR: "BRL",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
};

// Get currency by code
export const getCurrencyByCode = (code) => {
  return currencies.find((c) => c.code === code) || currencies[0];
};

// Get country code from coordinates using reverse geocoding
export const getCountryFromCoords = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3`
    );
    const data = await response.json();
    return data.address?.country_code?.toUpperCase();
  } catch (error) {
    console.error("Error getting country from coordinates:", error);
    return null;
  }
};

// Get exchange rates from USD
export const getExchangeRates = async (baseCurrency = "USD") => {
  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return null;
  }
};

// Get current gold price per gram in USD
export const getGoldPrice = async () => {
  try {
    // Gold price APIs - using goldapi.io alternative or fallback
    // Free alternative: metalpriceapi.com or goldprice.org
    // For now, return approximate price (you can integrate a real API)
    return 65; // Approximate USD per gram (as of 2026)
  } catch (error) {
    console.error("Error fetching gold price:", error);
    return 65; // Fallback
  }
};

// Get current silver price per gram in USD
export const getSilverPrice = async () => {
  try {
    return 0.85; // Approximate USD per gram (as of 2026)
  } catch (error) {
    console.error("Error fetching silver price:", error);
    return 0.85; // Fallback
  }
};
