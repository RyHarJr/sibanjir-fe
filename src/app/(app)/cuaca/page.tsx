"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import { api, WeatherData } from "@/lib/api";
import { Select } from "@/components/ui/Select";

type Region = { id: string; name: string };

export default function CuacaPage() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customAdm, setCustomAdm] = useState("");

  // Cascading Region States
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  const [selectedProv, setSelectedProv] = useState("");
  const [selectedReg, setSelectedReg] = useState("");
  const [selectedDist, setSelectedDist] = useState("");
  const [selectedVill, setSelectedVill] = useState("");

  const fetchWeather = (admCode: string) => {
    setLoading(true);
    api.getWeather(admCode)
      .then((res) => setData(res.data))
      .catch((err) => {
         console.error("Failed to fetch weather", err);
         setData(null);
      })
      .finally(() => setLoading(false));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAdm.trim()) {
      fetchWeather(customAdm.trim());
    }
  };

  // Convert Emsifa ID to Kemendagri BMKG adm4 code
  const buildAdm4 = (villageId: string) => {
    // 1671011001 -> 16.71.01.1001
    if (villageId.length !== 10) return villageId;
    return `${villageId.slice(0,2)}.${villageId.slice(2,4)}.${villageId.slice(4,6)}.${villageId.slice(6,10)}`;
  }

  // Load Provinces on mount
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then(r => r.json())
      .then(setProvinces)
      .catch(console.error);

    // Initial weather load for Palembang / Kemayoran
    fetchWeather("16.71.01.1001");
  }, []);

  // Load Regencies when Province changes
  useEffect(() => {
    setRegencies([]); setDistricts([]); setVillages([]);
    setSelectedReg(""); setSelectedDist(""); setSelectedVill("");
    if (!selectedProv) return;
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProv}.json`)
      .then(r => r.json()).then(setRegencies).catch(console.error);
  }, [selectedProv]);

  // Load Districts when Regency changes
  useEffect(() => {
    setDistricts([]); setVillages([]);
    setSelectedDist(""); setSelectedVill("");
    if (!selectedReg) return;
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedReg}.json`)
      .then(r => r.json()).then(setDistricts).catch(console.error);
  }, [selectedReg]);

  // Load Villages when District changes
  useEffect(() => {
    setVillages([]); setSelectedVill("");
    if (!selectedDist) return;
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDist}.json`)
      .then(r => r.json()).then(setVillages).catch(console.error);
  }, [selectedDist]);

  // When Village changes, query weather
  useEffect(() => {
    if (!selectedVill) return;
    const adm4 = buildAdm4(selectedVill);
    fetchWeather(adm4);
  }, [selectedVill]);

  const parseBMKGDate = (datetimeStr: string) => {
    const safeStr = datetimeStr.replace(" ", "T"); 
    const d = new Date(safeStr);
    return {
      day: d.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'short' }),
      time: d.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-[90px] md:pb-lg antialiased">
      <main className="px-margin-mobile md:px-margin-desktop max-w-[1000px] mx-auto space-y-lg pt-lg">
        
        <section className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow-sm border border-outline-variant text-center selection-area">
          <span className="material-symbols-outlined text-[48px] text-primary mb-2 transform -translate-y-1">partly_cloudy_day</span>
          <h1 className="text-h1 font-bold text-on-surface mb-2">Prakiraan Cuaca BMKG</h1>
          
          <div className="max-w-xl mx-auto space-y-4 pt-4">
            <div className="flex bg-surface-container rounded-lg p-1 max-w-sm mx-auto">
              <button 
                onClick={() => setIsCustom(false)} 
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${!isCustom ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
              >
                Pilih Dari Daftar
              </button>
              <button 
                onClick={() => setIsCustom(true)} 
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${isCustom ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
              >
                Input ADM4
              </button>
            </div>

            {!isCustom ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1 ml-1 uppercase">Provinsi</label>
                  <Select
                    value={selectedProv}
                    onChange={setSelectedProv}
                    placeholder="-- Pilih Provinsi --"
                    options={provinces.map(p => ({ value: p.id, label: p.name }))}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1 ml-1 uppercase">Kota / Kabupaten</label>
                  <Select
                    value={selectedReg}
                    onChange={setSelectedReg}
                    placeholder="-- Pilih Kota/Kab --"
                    options={regencies.map(p => ({ value: p.id, label: p.name }))}
                    disabled={!selectedProv}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1 ml-1 uppercase">Kecamatan</label>
                  <Select
                    value={selectedDist}
                    onChange={setSelectedDist}
                    placeholder="-- Pilih Kecamatan --"
                    options={districts.map(p => ({ value: p.id, label: p.name }))}
                    disabled={!selectedReg}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1 ml-1 uppercase">Desa / Kelurahan</label>
                  <Select
                    value={selectedVill}
                    onChange={setSelectedVill}
                    placeholder="-- Pilih Kelurahan --"
                    options={villages.map(p => ({ value: p.id, label: p.name }))}
                    disabled={!selectedDist}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="flex gap-2 max-w-sm mx-auto">
                <input 
                  type="text" 
                  value={customAdm} 
                  onChange={(e) => setCustomAdm(e.target.value)}
                  placeholder="Contoh: 16.71.01.1001"
                  className="flex-1 px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
                <button type="submit" className="bg-primary text-on-primary px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">Cari</button>
              </form>
            )}
          </div>
          
          <p className="text-body-md text-on-surface-variant mt-6">
            Menampilkan prediksi untuk wilayah <strong className="text-primary">{loading ? "..." : data ? `${data.kecamatan ?? ""}, ${data.city}` : "Tidak Ditemukan"}</strong>
          </p>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-[120px] bg-surface-container animate-pulse rounded-xl" />)}
          </div>
        ) : !data || data.forecasts.length === 0 ? (
          <div className="text-center p-8 bg-surface-container-lowest rounded-xl border border-outline-variant">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 mb-3 block">cloud_off</span>
            <p className="text-on-surface-variant font-medium">Data cuaca BMKG untuk wilayah ini belum tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.forecasts.map((f, i) => {
              const { day, time } = parseBMKGDate(f.datetime);
              return (
                <div key={i} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant flex flex-col gap-3 ambient-shadow-sm transform hover:-translate-y-1 transition duration-200">
                  <div className="flex justify-between items-start border-b border-surface-variant pb-2">
                    <div>
                      <h3 className="font-bold text-on-surface text-[15px]">{day}</h3>
                      <p className="text-primary text-label-bold font-black tracking-widest">{time}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] text-on-surface-variant mb-0 font-semibold uppercase tracking-wider">Suhu</p>
                       <span className="font-black text-on-surface text-[20px] tabular-nums">{f.temp}°C</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 py-1">
                    <div className="w-14 h-14 bg-primary-container/20 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-primary-container/30">
                      <Image src={f.image} alt={f.weatherDesc} width={42} height={42} className="drop-shadow-md transition-transform hover:scale-110" unoptimized />
                    </div>
                    <div>
                      <p className="font-extrabold text-on-surface text-[15px] leading-tight mb-1">{f.weatherDesc}</p>
                      <div className="flex flex-col gap-0.5 text-[12px] text-on-surface-variant font-medium">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">humidity_percentage</span> Kelembapan: {f.humidity ?? "-"}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav active="cuaca" />
    </div>
  );
}
