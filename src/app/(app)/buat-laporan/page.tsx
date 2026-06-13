"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api, District } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { Select } from "@/components/ui/Select";
import type { MapPickerProps } from "@/components/MapPicker";

// Dynamic import to avoid SSR issues with Leaflet
const MapPicker = dynamic<MapPickerProps>(
  () => import("@/components/MapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-surface-variant rounded-xl flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

const WATER_DEPTHS = [
  { value: 10, label: "Mata Kaki (~10cm)" },
  { value: 30, label: "Betis (~30cm)" },
  { value: 50, label: "Lutut (~50cm)" },
  { value: 100, label: "Pinggang (~100cm)" },
  { value: 150, label: "Lebih dari 1 Meter" },
];

const ROAD_ACCESS = [
  { value: "passable", label: "Bisa dilalui semua kendaraan" },
  { value: "motorcycle_only", label: "Motor saja yang bisa lewat" },
  { value: "difficult", label: "Sulit dilalui" },
  { value: "impassable", label: "Tidak bisa lewat sama sekali" },
];

const MAX_PHOTOS = 10;
const MAX_SIZE_MB = 5;

interface PhotoPreview {
  file: File;
  url: string;
}

export default function BuatLaporan() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", description: "", latitude: 0, longitude: 0,
    address: "", districtId: "", waterDepthCm: 0, roadAccess: "", waterCurrent: "calm",
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [geoStatus, setGeoStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [authLoading, user, router]);
  useEffect(() => { api.getDistricts().then(r => setDistricts(r.data)).catch(console.error); }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => { photos.forEach(p => URL.revokeObjectURL(p.url)); };
  }, [photos]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setForm(f => ({ ...f, latitude: lat, longitude: lng }));
    setGeoStatus("success");
    if (districts.length) {
      let min = Infinity, nid = "";
      districts.forEach(d => {
        const dist = Math.hypot(d.latitude - lat, d.longitude - lng);
        if (dist < min) { min = dist; nid = String(d.id); }
      });
      setForm(f => ({ ...f, latitude: lat, longitude: lng, districtId: nid }));
    }
  }, [districts]);

  const handleGeo = () => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGeoStatus("success");
        if (districts.length) {
          let min = Infinity, nid = "";
          districts.forEach(d => {
            const dist = Math.hypot(d.latitude - pos.coords.latitude, d.longitude - pos.coords.longitude);
            if (dist < min) { min = dist; nid = String(d.id); }
          });
          setForm(f => ({ ...f, districtId: nid }));
        }
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addFiles = (fileList: FileList | File[]) => {
    setPhotoError("");
    const incoming = Array.from(fileList);
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    const filtered: File[] = [];
    for (const f of incoming) {
      if (!validTypes.includes(f.type)) {
        setPhotoError("Hanya file JPEG, PNG, atau WebP yang diizinkan.");
        continue;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setPhotoError(`Ukuran file maks ${MAX_SIZE_MB}MB per foto.`);
        continue;
      }
      filtered.push(f);
    }

    setPhotos(prev => {
      const available = MAX_PHOTOS - prev.length;
      if (available <= 0) {
        setPhotoError(`Maksimal ${MAX_PHOTOS} foto.`);
        return prev;
      }
      const toAdd = filtered.slice(0, available);
      if (filtered.length > available) {
        setPhotoError(`Hanya ${available} foto lagi yang bisa ditambahkan (maks ${MAX_PHOTOS}).`);
      }
      return [...prev, ...toAdd.map(f => ({ file: f, url: URL.createObjectURL(f) }))];
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setPhotoError("");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.title.trim()) { setError("Judul wajib diisi"); return; }
    if (!form.description.trim()) { setError("Deskripsi wajib diisi"); return; }
    if (!form.latitude && !form.longitude) { setError("Lokasi belum ditentukan"); return; }
    if (!form.waterDepthCm) { setError("Pilih tinggi air"); return; }
    if (!form.roadAccess) { setError("Pilih akses kendaraan"); return; }
    setSubmitting(true);
    try {
      const res = await api.createReport({
        title: form.title, description: form.description,
        latitude: form.latitude, longitude: form.longitude,
        address: form.address || undefined, districtId: form.districtId ? Number(form.districtId) : undefined,
        waterDepthCm: form.waterDepthCm, roadAccess: form.roadAccess, waterCurrent: form.waterCurrent,
      });

      const reportId = res.data.id;

      // Upload photos if any
      if (photos.length > 0) {
        try {
          await api.uploadReportPhotos(reportId, photos.map(p => p.file));
        } catch {
          // Photos failed but report created — still navigate
        }
      }

      setSuccess(true);
      setTimeout(() => router.push(`/laporan/${reportId}`), 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal mengirim"); }
    finally { setSubmitting(false); }
  };

  if (authLoading) return <div className="bg-surface-container-low min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-surface-container-low min-h-screen text-on-surface pb-20 md:pb-0">
      <form onSubmit={handleSubmit}>
        <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-8">
          {success && <div className="bg-primary-container text-on-primary-container rounded-xl px-md py-sm flex items-center gap-2 text-body-sm"><span className="material-symbols-outlined text-[18px]">check_circle</span>Laporan berhasil dikirim! Mengalihkan...</div>}
          {error && <div className="bg-error-container text-on-error-container rounded-xl px-md py-sm flex items-center gap-2 text-body-sm"><span className="material-symbols-outlined text-[18px]">error</span>{error}</div>}

          {/* Step 1: Lokasi */}
          <section className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-bold font-bold">1</div>
              <h2 className="text-h3 font-semibold text-on-surface">Lokasi Banjir</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Interactive Map */}
              <div className="rounded-xl overflow-hidden border border-outline-variant">
                <MapPicker
                  latitude={form.latitude || undefined}
                  longitude={form.longitude || undefined}
                  onMapClick={handleMapClick}
                />
              </div>
              {geoStatus === "success" && (
                <div className="flex items-center gap-2 text-body-sm text-primary bg-primary-container/10 px-3 py-2 rounded-lg border border-primary/20">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  <span className="font-medium">Lokasi dipilih:</span>
                  <span className="font-mono">{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</span>
                </div>
              )}
              <button type="button" onClick={handleGeo} disabled={geoStatus === "loading"} className="w-full py-3 px-4 rounded-lg border border-outline-variant flex items-center justify-center gap-2 text-primary text-label-bold font-bold hover:bg-surface-container transition-colors disabled:opacity-60">
                {geoStatus === "loading" ? <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />Mencari...</> : <><span className="material-symbols-outlined text-lg">my_location</span>{geoStatus === "success" ? "Ubah Lokasi" : "Gunakan Lokasi Saat Ini"}</>}
              </button>
              {geoStatus === "error" && <p className="text-body-sm text-error">Tidak bisa mengakses lokasi. Pastikan GPS aktif.</p>}
              <div>
                <label className="text-label-bold font-bold text-on-surface-variant block mb-1">Judul Laporan</label>
                <input type="text" placeholder="Cth: Banjir 50cm di Jl. Sudirman" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md" />
              </div>
              <div>
                <label className="text-label-bold font-bold text-on-surface-variant block mb-1">Alamat Detail (Opsional)</label>
                <input type="text" placeholder="Cth: Jl. Sudirman depan Bank Mandiri" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md" />
              </div>
              <div>
                <label className="text-label-bold font-bold text-on-surface-variant block mb-1">Kecamatan</label>
                <Select
                  value={String(form.districtId || "")}
                  onChange={val => setForm({...form, districtId: val})}
                  placeholder="Pilih kecamatan..."
                  options={districts.map(d => ({ value: String(d.id), label: d.name }))}
                />
              </div>
            </div>
          </section>

          {/* Step 2: Detail */}
          <section className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-bold font-bold">2</div>
              <h2 className="text-h3 font-semibold text-on-surface">Detail Kondisi</h2>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <label className="text-label-bold font-bold text-on-surface-variant block mb-2">Tinggi Air</label>
                <Select
                  value={String(form.waterDepthCm || "")}
                  onChange={val => setForm({...form, waterDepthCm: Number(val)})}
                  placeholder="Pilih estimasi tinggi air..."
                  options={WATER_DEPTHS.map(d => ({ value: String(d.value), label: d.label }))}
                />
              </div>
              <div>
                <label className="text-label-bold font-bold text-on-surface-variant block mb-2">Akses Kendaraan</label>
                <div className="space-y-3">
                  {ROAD_ACCESS.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-surface-container transition-colors ${form.roadAccess === opt.value ? "border-primary bg-primary-container/5" : "border-outline-variant"}`}>
                      <input type="radio" name="roadAccess" value={opt.value} checked={form.roadAccess === opt.value} onChange={() => setForm({...form, roadAccess: opt.value})} className="w-5 h-5 text-primary" />
                      <span className="text-body-md text-on-surface">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label-bold font-bold text-on-surface-variant block mb-2">Arus Air</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:"calm",l:"Tenang"},{v:"slow",l:"Lambat"},{v:"moderate",l:"Sedang"},{v:"fast",l:"Deras"}].map(o => (
                    <button key={o.v} type="button" onClick={() => setForm({...form, waterCurrent: o.v})} className={`p-3 rounded-lg border text-body-md font-medium transition-colors ${form.waterCurrent === o.v ? "border-primary bg-primary-container/10 text-primary" : "border-outline-variant text-on-surface hover:bg-surface-container"}`}>{o.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label-bold font-bold text-on-surface-variant block mb-2">Deskripsi Kondisi</label>
                <textarea rows={3} placeholder="Tuliskan detail kondisi banjir..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md resize-none" />
              </div>
            </div>
          </section>

          {/* Step 3: Foto */}
          <section className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-bold font-bold">3</div>
              <div className="flex-1">
                <h2 className="text-h3 font-semibold text-on-surface">Foto Banjir</h2>
                <p className="text-body-sm text-on-surface-variant">Opsional · Maks {MAX_PHOTOS} foto · JPEG/PNG/WebP · {MAX_SIZE_MB}MB per foto</p>
              </div>
              <span className={`text-label-bold font-bold px-2 py-0.5 rounded-full text-sm ${photos.length >= MAX_PHOTOS ? "bg-error-container text-on-error-container" : "bg-primary-container text-on-primary-container"}`}>
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Drop zone */}
              {photos.length < MAX_PHOTOS && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-8 cursor-pointer transition-all
                    ${dragOver
                      ? "border-primary bg-primary-container/10 scale-[1.01]"
                      : "border-outline-variant hover:border-primary hover:bg-surface-container"
                    }`}
                >
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>add_photo_alternate</span>
                  <div className="text-center">
                    <p className="text-body-md font-medium text-on-surface">Klik atau seret foto ke sini</p>
                    <p className="text-body-sm text-on-surface-variant">Bisa pilih beberapa foto sekaligus</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              )}

              {/* Error */}
              {photoError && (
                <div className="flex items-center gap-2 text-error text-body-sm bg-error-container/40 px-3 py-2 rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  {photoError}
                </div>
              )}

              {/* Preview grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-outline-variant bg-surface-container">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="w-8 h-8 bg-error text-white rounded-full flex items-center justify-center hover:bg-error/90 transition-colors"
                          title="Hapus foto"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                      {/* Index badge */}
                      <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-[10px] font-bold pointer-events-none">
                        {i + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add more button (inside grid) */}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-surface-container transition-all text-on-surface-variant hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-2xl">add</span>
                      <span className="text-[10px] font-medium">{MAX_PHOTOS - photos.length} lagi</span>
                    </button>
                  )}
                </div>
              )}

              {photos.length === MAX_PHOTOS && (
                <div className="flex items-center gap-2 text-body-sm text-on-surface-variant bg-surface-container rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                  Batas {MAX_PHOTOS} foto tercapai. Hapus salah satu untuk menambah foto baru.
                </div>
              )}
            </div>
          </section>

          <button type="submit" disabled={submitting || success} className="w-full bg-primary text-on-primary py-4 rounded-xl text-h3 font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <><div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              {photos.length > 0 ? "Mengirim & Upload Foto..." : "Mengirim..."}
            </> : success ? <><span className="material-symbols-outlined">check_circle</span>Berhasil!</> : <><span className="material-symbols-outlined">send</span>Kirim Laporan{photos.length > 0 ? ` + ${photos.length} Foto` : ""}</>}
          </button>
        </main>
      </form>
      <BottomNav active="buat" />
    </div>
  );
}
