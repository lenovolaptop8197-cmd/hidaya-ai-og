import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateZakat } from "@/lib/api";
import {
  currencies,
  getCurrencyByCode,
  getCountryFromCoords,
  countryToCurrency,
  getExchangeRates,
  getGoldPrice,
  getSilverPrice,
} from "@/lib/currencies";

export default function ZakatPage() {
  const [form, setForm] = useState({
    gold_14k_price_per_gram: "",
    gold_16k_price_per_gram: "",
    gold_18k_price_per_gram: "",
    gold_21k_price_per_gram: "",
    gold_22k_price_per_gram: "",
    gold_24k_price_per_gram: "",
    silver_price_per_gram: "",
    silver_weight_grams: "0",
    gold_14k_grams: "0",
    gold_16k_grams: "0",
    gold_18k_grams: "0",
    gold_21k_grams: "0",
    gold_22k_grams: "0",
    gold_24k_grams: "0",
    bank_balance: "0",
    cash: "0",
    investment_property: "0",
    business_assets: "0",
    liabilities: "0",
    nisab_method: "lower_of_both",
  });
  const [result, setResult] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Get user's location and currency on mount
  useEffect(() => {
    detectLocationAndCurrency();
    fetchExchangeRates();
    // Don't fetch metal prices automatically - user should enter manually
  }, []);

  // Update prices when currency changes - only if user has entered prices
  useEffect(() => {
    // Don't auto-fill prices, user should enter them manually
  }, [selectedCurrency, exchangeRates]);

  const detectLocationAndCurrency = async () => {
    setLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast.info("Location not supported. Please select your currency manually.");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const countryCode = await getCountryFromCoords(latitude, longitude);
        
        if (countryCode && countryToCurrency[countryCode]) {
          const currencyCode = countryToCurrency[countryCode];
          setSelectedCurrency(currencyCode);
          setLocationDetected(true);
          const currency = getCurrencyByCode(currencyCode);
          toast.success(`Location detected! Currency set to ${currency.name} (${currency.symbol})`);
        } else {
          toast.info("Could not determine currency from location. Please select manually.");
        }
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.info("Location access denied. Please select your currency manually.");
        setLoadingLocation(false);
      }
    );
  };

  const fetchExchangeRates = async () => {
    const rates = await getExchangeRates("USD");
    if (rates) {
      setExchangeRates(rates);
    }
  };

  const fetchMetalPrices = async () => {
    const gold24kPrice = await getGoldPrice(); // 65 USD
    const silverPrice = await getSilverPrice(); // 0.85 USD
    
    // Calculate prices for different karats based on purity
    const gold18kPrice = (gold24kPrice * 18 / 24).toFixed(2); // 75% purity
    const gold21kPrice = (gold24kPrice * 21 / 24).toFixed(2); // 87.5% purity
    const gold22kPrice = (gold24kPrice * 22 / 24).toFixed(2); // 91.67% purity
    
    setForm((prev) => ({
      ...prev,
      gold_18k_price_per_gram: gold18kPrice,
      gold_21k_price_per_gram: gold21kPrice,
      gold_22k_price_per_gram: gold22kPrice,
      gold_24k_price_per_gram: gold24kPrice.toString(),
      silver_price_per_gram: silverPrice.toString(),
    }));
  };

  const updatePricesForCurrency = (currencyCode) => {
    if (!exchangeRates || !exchangeRates[currencyCode]) return;

    const rate = exchangeRates[currencyCode];
    const gold24kUSD = 65;
    const silverPriceUSD = 0.85;

    setForm((prev) => ({
      ...prev,
      gold_18k_price_per_gram: (gold24kUSD * 18 / 24 * rate).toFixed(2),
      gold_21k_price_per_gram: (gold24kUSD * 21 / 24 * rate).toFixed(2),
      gold_22k_price_per_gram: (gold24kUSD * 22 / 24 * rate).toFixed(2),
      gold_24k_price_per_gram: (gold24kUSD * rate).toFixed(2),
      silver_price_per_gram: (silverPriceUSD * rate).toFixed(2),
    }));
  };

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onCalculate = async (event) => {
    event.preventDefault();
    try {
      // Calculate gold values for each karat
      const gold18kValue = Number(form.gold_18k_grams || 0) * Number(form.gold_18k_price_per_gram || 0);
      const gold21kValue = Number(form.gold_21k_grams || 0) * Number(form.gold_21k_price_per_gram || 0);
      const gold22kValue = Number(form.gold_22k_grams || 0) * Number(form.gold_22k_price_per_gram || 0);
      const gold24kValue = Number(form.gold_24k_grams || 0) * Number(form.gold_24k_price_per_gram || 0);
      
      const totalGoldValue = gold18kValue + gold21kValue + gold22kValue + gold24kValue;
      
      // Calculate 24k equivalent weight
      const gold24kEquivalent = 
        (Number(form.gold_18k_grams || 0) * 18 / 24) +
        (Number(form.gold_21k_grams || 0) * 21 / 24) +
        (Number(form.gold_22k_grams || 0) * 22 / 24) +
        Number(form.gold_24k_grams || 0);
      
      // Silver value
      const silverValue = Number(form.silver_weight_grams || 0) * Number(form.silver_price_per_gram || 0);
      
      // Total assets
      const totalAssets = 
        totalGoldValue +
        silverValue +
        Number(form.bank_balance || 0) +
        Number(form.cash || 0) +
        Number(form.investment_property || 0) +
        Number(form.business_assets || 0);
      
      // Net wealth
      const netWealth = totalAssets - Number(form.liabilities || 0);
      
      // Calculate nisab threshold
      const gold24kPrice = Number(form.gold_24k_price_per_gram || 0);
      const silverPrice = Number(form.silver_price_per_gram || 0);
      
      const goldNisab = 85 * gold24kPrice; // 85 grams of 24k gold
      const silverNisab = 595 * silverPrice; // 595 grams of silver
      
      let nisabThreshold;
      let nisabMethod = form.nisab_method;
      
      if (nisabMethod === "gold") {
        nisabThreshold = goldNisab;
      } else if (nisabMethod === "silver") {
        nisabThreshold = silverNisab;
      } else {
        nisabThreshold = Math.min(goldNisab, silverNisab);
      }
      
      // Check eligibility
      const eligible = netWealth >= nisabThreshold;
      
      // Calculate zakat (2.5% of net wealth if eligible)
      const zakatDue = eligible ? netWealth * 0.025 : 0;
      
      // Create result object
      const result = {
        gold_24k_equivalent_grams: gold24kEquivalent,
        gold_value: totalGoldValue,
        silver_value: silverValue,
        total_assets: totalAssets,
        net_wealth: netWealth,
        nisab_method: nisabMethod,
        nisab_threshold: nisabThreshold,
        gold_nisab_value: goldNisab,
        silver_nisab_value: silverNisab,
        eligible: eligible,
        zakat_due: zakatDue,
      };
      
      setResult(result);
      toast.success("Zakat calculated successfully!");
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("Could not calculate zakat. Please check your inputs.");
    }
  };

  const currentCurrency = getCurrencyByCode(selectedCurrency);

  return (
    <section className="space-y-6">
      <Card className="border-[#23B574]/10 bg-white/90" data-testid="zakat-calculator-card">
        <CardHeader>
          <CardTitle data-testid="zakat-page-title" className="text-2xl text-[#1a202c]">
            Zakat Calculator Pro
          </CardTitle>
          <div className="flex items-center gap-3 pt-2">
            <label className="flex-1 space-y-2">
              <span className="text-sm text-[#4a5568]">
                {loadingLocation ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Detecting location...
                  </span>
                ) : locationDetected ? (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-[#23B574]" />
                    Currency (Auto-detected)
                  </span>
                ) : (
                  "Select Currency"
                )}
              </span>
              <select
                className="h-11 w-full rounded-lg border border-[#23B574]/20 px-3 text-sm"
                data-testid="currency-select"
                onChange={(e) => setSelectedCurrency(e.target.value)}
                value={selectedCurrency}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.flag} {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </label>
            
            {!locationDetected && (
              <Button
                type="button"
                onClick={detectLocationAndCurrency}
                disabled={loadingLocation}
                className="mt-7 h-11 rounded-lg bg-[#23B574]/10 text-[#23B574] hover:bg-[#23B574]/20"
                data-testid="detect-location-button"
              >
                {loadingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" data-testid="zakat-form" onSubmit={onCalculate}>
            
            {/* Gold Prices Section */}
            <div className="md:col-span-2 mb-2">
              <h3 className="text-sm font-semibold text-[#1a202c] mb-3">Gold Market Rates ({currentCurrency.symbol}/gram)</h3>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <label className="space-y-2" data-testid="gold-14k-price-group">
                  <span className="text-sm text-[#4a5568]">14k Gold Price</span>
                  <Input
                    data-testid="gold-14k-price-input"
                    onChange={(event) => setValue("gold_14k_price_per_gram", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.gold_14k_price_per_gram}
                  />
                </label>

                <label className="space-y-2" data-testid="gold-16k-price-group">
                  <span className="text-sm text-[#4a5568]">16k Gold Price</span>
                  <Input
                    data-testid="gold-16k-price-input"
                    onChange={(event) => setValue("gold_16k_price_per_gram", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.gold_16k_price_per_gram}
                  />
                </label>

                <label className="space-y-2" data-testid="gold-18k-price-group">
                  <span className="text-sm text-[#4a5568]">18k Gold Price</span>
                  <Input
                    data-testid="gold-18k-price-input"
                    onChange={(event) => setValue("gold_18k_price_per_gram", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.gold_18k_price_per_gram}
                  />
                </label>

                <label className="space-y-2" data-testid="gold-21k-price-group">
                  <span className="text-sm text-[#4a5568]">21k Gold Price</span>
                  <Input
                    data-testid="gold-21k-price-input"
                    onChange={(event) => setValue("gold_21k_price_per_gram", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.gold_21k_price_per_gram}
                  />
                </label>

                <label className="space-y-2" data-testid="gold-22k-price-group">
                  <span className="text-sm text-[#4a5568]">22k Gold Price</span>
                  <Input
                    data-testid="gold-22k-price-input"
                    onChange={(event) => setValue("gold_22k_price_per_gram", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.gold_22k_price_per_gram}
                  />
                </label>

                <label className="space-y-2" data-testid="gold-24k-price-group">
                  <span className="text-sm text-[#4a5568]">24k Gold Price</span>
                  <Input
                    data-testid="gold-24k-price-input"
                    onChange={(event) => setValue("gold_24k_price_per_gram", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.gold_24k_price_per_gram}
                  />
                </label>
              </div>
            </div>

            {/* Silver Price and Weight */}
            <div className="md:col-span-2 mb-2">
              <h3 className="text-sm font-semibold text-[#1a202c] mb-3">Silver Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2" data-testid="silver-rate-input-group">
                  <span className="text-sm text-[#4a5568]">
                    Silver Price / Gram ({currentCurrency.symbol})
                  </span>
                  <Input
                    data-testid="silver-rate-input"
                    onChange={(event) => setValue("silver_price_per_gram", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.silver_price_per_gram}
                  />
                </label>

                <label className="space-y-2" data-testid="silver-weight-input-group">
                  <span className="text-sm text-[#4a5568]">Silver Weight (grams)</span>
                  <Input
                    data-testid="silver-weight-input"
                    onChange={(event) => setValue("silver_weight_grams", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.silver_weight_grams}
                  />
                </label>
              </div>
            </div>

            {/* Gold Weights Section */}
            <div className="md:col-span-2 mb-2">
              <h3 className="text-sm font-semibold text-[#1a202c] mb-3">Gold Holdings (grams)</h3>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <label className="space-y-2" data-testid="gold-14k-input-group">
                  <span className="text-sm text-[#4a5568]">14k Gold</span>
                  <Input data-testid="gold-14k-input" onChange={(event) => setValue("gold_14k_grams", event.target.value)} type="number" step="0.01" value={form.gold_14k_grams} />
                </label>
                <label className="space-y-2" data-testid="gold-16k-input-group">
                  <span className="text-sm text-[#4a5568]">16k Gold</span>
                  <Input data-testid="gold-16k-input" onChange={(event) => setValue("gold_16k_grams", event.target.value)} type="number" step="0.01" value={form.gold_16k_grams} />
                </label>
                <label className="space-y-2" data-testid="gold-18k-input-group">
                  <span className="text-sm text-[#4a5568]">18k Gold</span>
                  <Input data-testid="gold-18k-input" onChange={(event) => setValue("gold_18k_grams", event.target.value)} type="number" step="0.01" value={form.gold_18k_grams} />
                </label>
                <label className="space-y-2" data-testid="gold-21k-input-group">
                  <span className="text-sm text-[#4a5568]">21k Gold</span>
                  <Input data-testid="gold-21k-input" onChange={(event) => setValue("gold_21k_grams", event.target.value)} type="number" step="0.01" value={form.gold_21k_grams} />
                </label>
                <label className="space-y-2" data-testid="gold-22k-input-group">
                  <span className="text-sm text-[#4a5568]">22k Gold</span>
                  <Input data-testid="gold-22k-input" onChange={(event) => setValue("gold_22k_grams", event.target.value)} type="number" step="0.01" value={form.gold_22k_grams} />
                </label>
                <label className="space-y-2" data-testid="gold-24k-input-group">
                  <span className="text-sm text-[#4a5568]">24k Gold</span>
                  <Input data-testid="gold-24k-input" onChange={(event) => setValue("gold_24k_grams", event.target.value)} type="number" step="0.01" value={form.gold_24k_grams} />
                </label>
              </div>
            </div>

            {/* Other Assets Section */}
            <div className="md:col-span-2 mb-2">
              <h3 className="text-sm font-semibold text-[#1a202c] mb-3">Other Assets ({currentCurrency.symbol})</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2" data-testid="bank-balance-input-group">
                  <span className="text-sm text-[#4a5568]">Bank Balances</span>
                  <Input
                    data-testid="bank-balance-input"
                    onChange={(event) => setValue("bank_balance", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.bank_balance}
                  />
                </label>
                <label className="space-y-2" data-testid="cash-input-group">
                  <span className="text-sm text-[#4a5568]">Cash</span>
                  <Input data-testid="cash-input" onChange={(event) => setValue("cash", event.target.value)} type="number" step="0.01" value={form.cash} />
                </label>
                <label className="space-y-2" data-testid="investment-property-input-group">
                  <span className="text-sm text-[#4a5568]">Investment Property</span>
                  <Input
                    data-testid="investment-property-input"
                    onChange={(event) => setValue("investment_property", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.investment_property}
                  />
                </label>
                <label className="space-y-2" data-testid="business-assets-input-group">
                  <span className="text-sm text-[#4a5568]">Business Assets</span>
                  <Input
                    data-testid="business-assets-input"
                    onChange={(event) => setValue("business_assets", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.business_assets}
                  />
                </label>
                <label className="space-y-2" data-testid="liabilities-input-group">
                  <span className="text-sm text-[#4a5568]">Immediate Debts / Bills</span>
                  <Input
                    data-testid="liabilities-input"
                    onChange={(event) => setValue("liabilities", event.target.value)}
                    type="number"
                    step="0.01"
                    value={form.liabilities}
                  />
                </label>
              </div>
            </div>

            <label className="space-y-2 md:col-span-2" data-testid="nisab-method-group">
              <span className="text-sm text-[#4a5568]">Nisab Method</span>
              <select
                className="h-10 rounded-lg border border-[#23B574]/20 px-3 w-full"
                data-testid="nisab-method-select"
                onChange={(event) => setValue("nisab_method", event.target.value)}
                value={form.nisab_method}
              >
                <option value="lower_of_both">Lower of Gold/Silver</option>
                <option value="gold">Gold Only (87.48g)</option>
                <option value="silver">Silver Only (612.36g)</option>
              </select>
            </label>

            <div className="md:col-span-2" data-testid="zakat-formula-note">
              <p className="rounded-xl bg-[#f9f7f2] p-3 text-sm text-[#4a5568]">
                💡 Purity formula: 24k equivalent = (18k × 18/24) + (21k × 21/24) + (22k × 22/24) + 24k. Silver value is added as (Silver Weight × Silver Rate). All amounts in {currentCurrency.name}.
              </p>
            </div>

            <div className="md:col-span-2">
              <Button
                className="rounded-full bg-[#23B574] px-6 text-white hover:bg-[#1d9560]"
                data-testid="calculate-zakat-button"
                type="submit"
              >
                Calculate Zakat
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-[#23B574]/10 bg-white" data-testid="zakat-result-card">
          <CardContent className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-[#fcfbf8] p-4" data-testid="zakat-24k-equivalent">
              <p className="text-xs uppercase tracking-wide text-[#4a5568]">24k Equivalent (g)</p>
              <p className="text-2xl font-semibold text-[#1a202c]">{result.gold_24k_equivalent_grams.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-[#fcfbf8] p-4" data-testid="zakat-gold-value">
              <p className="text-xs uppercase tracking-wide text-[#4a5568]">Gold Value ({currentCurrency.symbol})</p>
              <p className="text-2xl font-semibold text-[#1a202c]">{currentCurrency.symbol}{result.gold_value.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-[#fcfbf8] p-4" data-testid="zakat-silver-value">
              <p className="text-xs uppercase tracking-wide text-[#4a5568]">Silver Value ({currentCurrency.symbol})</p>
              <p className="text-2xl font-semibold text-[#1a202c]">{currentCurrency.symbol}{result.silver_value.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-[#fcfbf8] p-4" data-testid="zakat-total-assets">
              <p className="text-xs uppercase tracking-wide text-[#4a5568]">Total Assets ({currentCurrency.symbol})</p>
              <p className="text-2xl font-semibold text-[#1a202c]">{currentCurrency.symbol}{result.total_assets.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-[#fcfbf8] p-4" data-testid="zakat-net-wealth">
              <p className="text-xs uppercase tracking-wide text-[#4a5568]">Net Wealth ({currentCurrency.symbol})</p>
              <p className="text-2xl font-semibold text-[#1a202c]">{currentCurrency.symbol}{result.net_wealth.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-[#fcfbf8] p-4" data-testid="zakat-due">
              <p className="text-xs uppercase tracking-wide text-[#4a5568]">Zakat Due ({currentCurrency.symbol})</p>
              <p className="text-2xl font-semibold text-[#23B574]">{currentCurrency.symbol}{result.zakat_due.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-[#fcfbf8] p-4" data-testid="zakat-nisab-threshold">
              <p className="text-xs uppercase tracking-wide text-[#4a5568]">Applied Nisab ({currentCurrency.symbol})</p>
              <p className="text-2xl font-semibold text-[#1a202c]">{currentCurrency.symbol}{result.nisab_threshold.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-[#fcfbf8] p-4 sm:col-span-2 lg:col-span-3" data-testid="zakat-eligibility">
              <p className="text-sm text-[#1a202c]">
                Eligibility: <strong className={result.eligible ? "text-[#23B574]" : "text-[#f59e0b]"}>{result.eligible ? "✓ Above Nisab" : "⚠ Below Nisab"}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
