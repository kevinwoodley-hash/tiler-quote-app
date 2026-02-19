import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// PWA Service Worker Registration
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      console.log("Service Worker registration failed");
    });
  });
}

// Extracted clips panel to avoid IIFE in JSX
function ClipsPanel({ room, updateRoom, roomIndex, getRoomClipsPerM2, areaKey }) {
  const area = areaKey === "floor"
    ? room.floorAreas.reduce((s,a) => s+(Number(a.length)||0)*(Number(a.width)||0), 0)
    : (room.walls||[]).reduce((s,w) => s+(Number(w.length)||0)*(Number(w.height)||0)-(Number(w.deduct)||0), 0);
  const clipsPerM2 = getRoomClipsPerM2(room);
  const autoQty = clipsPerM2 > 0 ? Math.ceil(area * clipsPerM2) : null;
  const manualQty = Number(room.levellingClipsQty) || 0;
  return (
    <div className="col-span-2 bg-gray-50 border rounded p-2 space-y-1.5 text-xs">
      {autoQty !== null ? (
        <>
          <div className="text-green-700 font-medium">Auto-calculated from tile size</div>
          <div className="text-gray-600">{Math.ceil(clipsPerM2)} clips/m² × {area.toFixed(2)} m² = <strong>{autoQty} clips</strong></div>
          <div className="text-gray-400">= {Math.ceil(autoQty/100)} pack{Math.ceil(autoQty/100)!==1?"s":""} of 100</div>
        </>
      ) : (
        <>
          <div className="text-amber-600">⚠ Select a tile size ≥ 300×300 for auto-calc</div>
          <label className="text-gray-600">Enter quantity manually</label>
          <input
            type="number" placeholder="e.g. 200"
            value={room.levellingClipsQty || ""}
            onChange={e => updateRoom(roomIndex, "levellingClipsQty", Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          {manualQty > 0 && <div className="text-gray-400">= {Math.ceil(manualQty/100)} pack{Math.ceil(manualQty/100)!==1?"s":""} of 100</div>}
        </>
      )}
    </div>
  );
}

// ── Voice helpers ────────────────────────────────────────────────────────
const SPEECH_SUPPORTED = typeof window !== "undefined" &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

function parseSpokenValue(raw, isNumeric) {
  if (!isNumeric) return raw.trim();
  const w2n = {zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
    ten:10,eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30,forty:40,fifty:50,hundred:100};
  let t = raw.toLowerCase()
    .replace(/metres?|meters?|\bm\b/g, "")
    .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred)\b/g,
      (_,m) => w2n[m] !== undefined ? w2n[m] : m)
    .replace(/\bpoint\b/g, ".").replace(/\band\b/g, "").replace(/\s+/g, "");
  const n = parseFloat(t);
  return isNaN(n) ? null : String(n);
}

function useSpeech(onResult, isNumeric) {
  const [listening, setListening] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!SPEECH_SUPPORTED) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "en-GB"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => {
      const raw = e.results[0][0].transcript.trim();
      const val = parseSpokenValue(raw, isNumeric);
      if (val !== null) onResult(val);
      setListening(false);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    ref.current = r;
  }, []);
  const toggle = () => {
    if (listening) { ref.current?.abort(); setListening(false); }
    else { ref.current?.start(); setListening(true); }
  };
  return { listening, toggle };
}

function MicBtn({ listening, toggle }) {
  if (!SPEECH_SUPPORTED) return null;
  return (
    <button type="button" onClick={toggle} title={listening ? "Stop" : "Speak"}
      style={{background:listening?"#EF4444":"#F3F4F6",border:`2px solid ${listening?"#EF4444":"#D1D5DB"}`,
        borderRadius:"8px",padding:"0 8px",height:"40px",minWidth:"38px",cursor:"pointer",
        display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,
        transition:"all 0.15s",animation:listening?"micPulse 1s infinite":"none"}}>
      {listening
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="8"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>
          </svg>}
    </button>
  );
}

// VI = drop-in replacement for <Input> with voice mic built in
function VI({ onChange, value, type, className = "", style, ...rest }) {
  const isNumeric = type === "number";
  const cb = React.useCallback((v) => {
    if (onChange) onChange({ target: { value: isNumeric ? Number(v) : v } });
  }, [onChange, isNumeric]);
  const { listening, toggle } = useSpeech(cb, isNumeric);
  return (
    <div style={{display:"flex",gap:4,width:"100%"}}>
      <Input type={type} value={value} onChange={onChange} className={className} style={{flex:1,...(style||{})}} {...rest} />
      <MicBtn listening={listening} toggle={toggle} />
    </div>
  );
}

// Legacy standalone mic button
function VoiceInput({ onResult }) {
  const cb = React.useCallback(onResult, [onResult]);
  const { listening, toggle } = useSpeech(cb, true);
  return <MicBtn listening={listening} toggle={toggle} />;
}
// ── UFH Panel Component ──────────────────────────────────────────────────
function UFHPanel({ room, roomIndex, updateRoom }) {
  const fa = room.floorAreas.reduce((s, a) => s + (Number(a.length)||0) * (Number(a.width)||0), 0);
  const watts = (room.ufhWattsPerM2 || 150) * fa;
  return (
    <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded p-3 space-y-2 text-xs">
      <div className="font-semibold text-yellow-800">⚡ UFH Details</div>
      <div className="text-gray-600">Coverage: <strong>{fa.toFixed(2)} m²</strong></div>
      <div>
        <label className="text-gray-600 block mb-1">Heating output (W/m²)</label>
        <div className="flex gap-2">
          {[100, 150, 200].map(w => (
            <button key={w}
              className={"flex-1 py-1 rounded border text-xs font-medium " + ((room.ufhWattsPerM2||150) === w ? "bg-yellow-500 text-white border-yellow-500" : "bg-white text-gray-700 border-gray-300")}
              onClick={() => updateRoom(roomIndex, "ufhWattsPerM2", w)}>
              {w}W
            </button>
          ))}
        </div>
      </div>
      <div className="text-gray-600">Total output: <strong>{watts}W ({(watts/1000).toFixed(2)}kW)</strong></div>
      <div className="text-gray-600">Thermostat: <strong>1 required per room</strong></div>
      <div className="bg-yellow-100 rounded p-2 text-yellow-800">⚠ UFH must be installed by a qualified electrician. Tile over with flexible adhesive only.</div>
    </div>
  );
}


export default function TilerQuoteApp() {
  const [page, setPage] = useState("measure");
  const [summaryView, setSummaryView] = useState("trader");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [presetName, setPresetName] = useState("");
  const [ratePresets, setRatePresets] = useState(() => {
    const saved = localStorage.getItem("ratePresets");
    return saved ? JSON.parse(saved) : {};
  });

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const updated = { ...ratePresets, [name]: { ...rates } };
    setRatePresets(updated);
    localStorage.setItem("ratePresets", JSON.stringify(updated));
    setPresetName("");
  };

  const loadPreset = (name) => {
    if (ratePresets[name]) setRates({ ...ratePresets[name] });
  };

  const deletePreset = (name) => {
    const updated = { ...ratePresets };
    delete updated[name];
    setRatePresets(updated);
    localStorage.setItem("ratePresets", JSON.stringify(updated));
  };

  /* ---------------- SAVED QUOTES ---------------- */
  const [savedQuotes, setSavedQuotes] = useState(() => {
    const saved = localStorage.getItem("savedQuotes");
    return saved ? JSON.parse(saved) : [];
  });

  const saveQuote = () => {
    const date = new Date().toLocaleDateString("en-GB");
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const quote = {
      id: Date.now(),
      savedAt: `${date} ${time}`,
      customer: { ...customer },
      rooms: JSON.parse(JSON.stringify(rooms)),
      rates: { ...rates },
      groutSpec: { ...groutSpec },
    };
    const updated = [quote, ...savedQuotes];
    setSavedQuotes(updated);
    localStorage.setItem("savedQuotes", JSON.stringify(updated));
    alert(`Quote saved for ${customer.name || "this job"}`);
  };

  const loadQuote = (quote) => {
    setCustomer({ ...quote.customer });
    setRooms(JSON.parse(JSON.stringify(quote.rooms)));
    setRates({ ...quote.rates });
    if (quote.groutSpec) setGroutSpec({ ...quote.groutSpec });
    setPage("measure");
  };

  const deleteQuote = (id) => {
    const updated = savedQuotes.filter(q => q.id !== id);
    setSavedQuotes(updated);
    localStorage.setItem("savedQuotes", JSON.stringify(updated));
  };

  const buildQuoteMessage = () => {
    const date = new Date().toLocaleDateString("en-GB");
    const lines = [];
    lines.push(`TILING QUOTE — ${date}`);
    lines.push(`${"─".repeat(28)}`);
    if (customer.name) lines.push(`Customer: ${customer.name}`);
    if (customer.address) lines.push(`Address: ${customer.address}`);
    lines.push("");
    if (totalFloorArea > 0) lines.push(`Floor area: ${totalFloorArea.toFixed(2)} m²`);
    if (totalWallArea > 0) lines.push(`Wall area: ${totalWallArea.toFixed(2)} m²`);
    lines.push("");
    lines.push(`Labour: £${labourCost.toFixed(2)}`);
    lines.push(`Materials: £${(materialsTotal + marginAmount).toFixed(2)}`);
    if (rates.vatEnabled) lines.push(`VAT (${rates.vatRate}%): £${vatAmount.toFixed(2)}`);
    lines.push(`${"─".repeat(28)}`);
    lines.push(`TOTAL: £${grandTotal.toFixed(2)}`);
    lines.push("");
    lines.push("This quote is valid for 30 days.");
    return lines.join("\n");
  };

  const sendWhatsApp = () => {
    const msg = buildQuoteMessage();
    let phone = customer.phone.replace(/[^0-9+]/g, "");
    // Apply UK country code: strip leading 0 and prepend +44
    if (phone.startsWith("0")) phone = "+44" + phone.slice(1);
    else if (phone && !phone.startsWith("+")) phone = "+44" + phone;
    const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendEmail = () => {
    const msg = buildQuoteMessage();
    const subject = encodeURIComponent(`Tiling Quote${customer.name ? " for " + customer.name : ""}`);
    const body = encodeURIComponent(msg);
    window.open(`mailto:${customer.email || ""}?subject=${subject}&body=${body}`, "_blank");
  };

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  /* ---------------- CUSTOMER STATE ---------------- */
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("customer");
    return saved
      ? JSON.parse(saved)
      : { name: "", address: "", email: "", phone: "" };
  });

  useEffect(() => {
    localStorage.setItem("customer", JSON.stringify(customer));
  }, [customer]);

  /* ---------------- PRICING STATE ---------------- */
  const [rates, setRates] = useState(() => {
    const saved = localStorage.getItem("rates");
    return saved
      ? JSON.parse(saved)
      : {
          labourMode: "m2",
          floorRate: 45,
          wallRate: 55,
          dayRate: 250,
          daysEstimate: 1,
          adhesivePricePerBag: 15,
          adhesiveCoveragePerBag: 4,
          adhesiveCoveragePerBag: 4,
          groutPricePerBag: 8.50,
          cementBoardPricePerSheet: 8,
          levellingCompoundPricePerBag: 12,
          ufhMatPricePerM2: 35,
          ufhThermostatPrice: 120,
          ufhLabourPerM2: 8,
          levellingCompoundLabourPerM2: 4,
          levellingClipsPricePer100: 18,
          cementBoardLabourPerM2: 5,
          antiCrackPerM2: 8,
          antiCrackLabourPerM2: 4,
          tankingPerTub: 85,
          tankingLabourPerM2: 6,
          sealerPerM2: 6,
          sealerLabourPerM2: 3,
          trimPricePerLength: 3.50,
          vatEnabled: false,
          vatRate: 20,
        };
  });

  useEffect(() => {
    localStorage.setItem("rates", JSON.stringify(rates));
  }, [rates]);

  /* ---------------- GROUT / TILE SIZE STATE ---------------- */
  const [groutSpec, setGroutSpec] = useState(() => {
    const saved = localStorage.getItem("groutSpec");
    return saved
      ? JSON.parse(saved)
      : {
          tileLength: 600,   // mm
          tileWidth: 300,    // mm
          tileThickness: 10, // mm
          jointWidth: 2,     // mm
          wastePercent: 10,  // %
        };
  });

  useEffect(() => {
    localStorage.setItem("groutSpec", JSON.stringify(groutSpec));
  }, [groutSpec]);

  /* ---------------- ROOMS STATE ---------------- */
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem("rooms");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("rooms", JSON.stringify(rooms));
  }, [rooms]);

  const DEFAULT_HEIGHT = 2.4;

  /* ---------------- ROOM HELPERS ---------------- */

  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        name: `Room ${rooms.length + 1}`,
        tileType: "floor",
        activeFloorIndex: 0,
        activeWallIndex: 0,
        floorAreas: [],
        walls: [],
        useFourWallCalc: false,
        roomLength: 0,
        roomWidth: 0,
        roomHeight: DEFAULT_HEIGHT,
        fourWallDeduct: 0,
        useCementBoard: false,
        useAntiCrack: false,
        useLevellingCompound: false,
        levellingDepthMm: 3,
        useUnderfloorHeating: false,
        ufhWattsPerM2: 150,
        useLevellingClips: false,
        levellingClipsQty: 0,
        useTankingWalls: false,
        useTankingFloor: false,
        isNaturalStone: false,
        trimLength: 0,
        tileSizePreset: "",
        useModularPattern: false,
        modularTiles: [
          { preset: "600×600", proportion: 25 },
          { preset: "600×300", proportion: 50 },
          { preset: "300×300", proportion: 25 },
        ],
      },
    ]);
  };

  const deleteRoom = (index) => {
    const updated = [...rooms];
    updated.splice(index, 1);
    setRooms(updated);
  };

  const updateRoom = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    setRooms(updated);
  };

  const addFloorArea = (roomIndex) => {
    const updated = [...rooms];
    updated[roomIndex].floorAreas.push({ length: 0, width: 0 });
    updated[roomIndex].activeFloorIndex = updated[roomIndex].floorAreas.length - 1;
    setRooms(updated);
  };

  const updateFloorArea = (roomIndex, field, value) => {
    const updated = [...rooms];
    const active = updated[roomIndex].activeFloorIndex;
    if (!updated[roomIndex].floorAreas[active]) return;
    updated[roomIndex].floorAreas[active][field] = value;
    setRooms(updated);
  };

  const addWall = (roomIndex) => {
    const updated = [...rooms];
    updated[roomIndex].walls.push({ length: 0, height: DEFAULT_HEIGHT, deduct: 0 });
    updated[roomIndex].activeWallIndex = updated[roomIndex].walls.length - 1;
    setRooms(updated);
  };

  const updateWall = (roomIndex, field, value) => {
    const updated = [...rooms];
    const active = updated[roomIndex].activeWallIndex;
    if (!updated[roomIndex].walls[active]) return;
    updated[roomIndex].walls[active][field] = value;
    setRooms(updated);
  };

  const setHalfHeight = (roomIndex) => {
    const updated = [...rooms];
    const active = updated[roomIndex].activeWallIndex;
    if (!updated[roomIndex].walls[active]) return;
    updated[roomIndex].walls[active].height = DEFAULT_HEIGHT / 2;
    setRooms(updated);
  };

  const updateModularTile = (roomIndex, tileIndex, field, value) => {
    const updated = [...rooms];
    if (!updated[roomIndex].modularTiles) return;
    updated[roomIndex].modularTiles[tileIndex][field] = value;
    setRooms(updated);
  };

  const addModularTile = (roomIndex) => {
    const updated = [...rooms];
    if (!updated[roomIndex].modularTiles) updated[roomIndex].modularTiles = [];
    updated[roomIndex].modularTiles.push({ preset: "300×300", proportion: 0 });
    setRooms(updated);
  };

  const removeModularTile = (roomIndex, tileIndex) => {
    const updated = [...rooms];
    if (!updated[roomIndex].modularTiles) return;
    updated[roomIndex].modularTiles.splice(tileIndex, 1);
    setRooms(updated);
  };

  const resetDefaultHeight = (roomIndex) => {
    const updated = [...rooms];
    const active = updated[roomIndex].activeWallIndex;
    if (!updated[roomIndex].walls[active]) return;
    updated[roomIndex].walls[active].height = DEFAULT_HEIGHT;
    setRooms(updated);
  };

  const tilePresets = [
    { label: "25×25 Mosaic", l: 25, w: 25 },
    { label: "48×48 Mosaic", l: 48, w: 48 },
    { label: "100×100", l: 100, w: 100 },
    { label: "150×150", l: 150, w: 150 },
    { label: "200×100", l: 200, w: 100 },
    { label: "300×300", l: 300, w: 300 },
    { label: "600×300", l: 600, w: 300 },
    { label: "600×600", l: 600, w: 600 },
    { label: "900×600", l: 900, w: 600 },
    { label: "1200×600", l: 1200, w: 600 },
  ];

  /* ---- CLIPS CALCULATION HELPERS ---- */
  const calcClipsPerM2 = (lMm, wMm) => {
    if (lMm < 300 || wMm < 300) return 0;
    return Math.ceil((3 / ((lMm/1000) * (wMm/1000))) * 1.1);
  };

  const getRoomClipsPerM2 = (room) => {
    if (room.useModularPattern && (room.modularTiles||[]).length > 0) {
      const totalProp = (room.modularTiles||[]).reduce((s,t) => s+(Number(t.proportion)||0), 0);
      if (totalProp <= 0) return 0;
      return (room.modularTiles||[]).reduce((sum, t) => {
        const tp = tilePresets.find(p => p.label === t.preset);
        if (!tp) return sum;
        return sum + ((Number(t.proportion)||0) / totalProp) * calcClipsPerM2(tp.l, tp.w);
      }, 0);
    }
    if (room.tileSizePreset) {
      const tp = tilePresets.find(p => p.label === room.tileSizePreset);
      if (tp) return calcClipsPerM2(tp.l, tp.w);
    }
    return calcClipsPerM2(Number(groutSpec.tileLength)||0, Number(groutSpec.tileWidth)||0);
  };

  /* ---------------- CALCULATIONS ---------------- */

  let totalFloorArea = 0;
  let totalWallArea = 0;

  rooms.forEach((room) => {
    room.floorAreas.forEach((area) => {
      totalFloorArea += Number(area.length || 0) * Number(area.width || 0);
    });
    if (room.useFourWallCalc) {
      const length = Number(room.roomLength || 0);
      const width = Number(room.roomWidth || 0);
      const height = Number(room.roomHeight || DEFAULT_HEIGHT);
      totalWallArea += Math.max(0, 2 * (length + width) * height - Number(room.fourWallDeduct || 0));
    } else {
      room.walls.forEach((wall) => {
        totalWallArea += Math.max(0,
          Number(wall.length || 0) * Number(wall.height || DEFAULT_HEIGHT) - Number(wall.deduct || 0)
        );
      });
    }
  });

  const labourCost = rates.labourMode === "day"
    ? (Number(rates.dayRate) || 0) * (Number(rates.daysEstimate) || 0)
    : totalFloorArea * (Number(rates.floorRate) || 0) + totalWallArea * (Number(rates.wallRate) || 0);

  const totalTileArea = totalFloorArea + totalWallArea;

  /* ---- PER-ROOM OPTION COSTS ---- */
  let cementBoardCost = 0, cementBoardSheets = 0;
  let cementBoardAdhesiveKg = 0, cementBoardAdhesiveBags = 0, cementBoardAdhesiveCost = 0, cementBoardLabourCost = 0;
  let antiCrackCost = 0, antiCrackAdhesiveKg = 0, antiCrackAdhesiveBags = 0, antiCrackAdhesiveCost = 0, antiCrackLabourCost = 0;
  let levellingCompoundCost = 0, levellingCompoundBags = 0, levellingCompoundLabourCost = 0;
  let ufhM2 = 0, ufhMatCost = 0, ufhLabourCost = 0, ufhThermostatCount = 0;
  let levellingClipsCost = 0, levellingClipsPacks = 0;
  let tankingWallCost = 0, tankingFloorCost = 0, tankingLabourCost = 0;
  let sealerCost = 0, sealerLabourCost = 0;
  let trimCost = 0, trimLengths = 0;

  rooms.forEach((room) => {
    // Per-room area calculations
    const roomFloor = room.floorAreas.reduce((s, a) =>
      s + Number(a.length || 0) * Number(a.width || 0), 0);
    const roomWall = room.useFourWallCalc
      ? Math.max(0, 2 * ((Number(room.roomLength)||0) + (Number(room.roomWidth)||0)) * (Number(room.roomHeight)||DEFAULT_HEIGHT) - (Number(room.fourWallDeduct)||0))
      : room.walls.reduce((s, w) => s + Math.max(0, (Number(w.length)||0)*(Number(w.height)||DEFAULT_HEIGHT)-(Number(w.deduct)||0)), 0);

    if (room.useCementBoard) {
      const SHEET_AREA = 0.72;
      const sheets = Math.ceil(roomFloor / SHEET_AREA);
      cementBoardSheets += sheets;
      cementBoardCost += sheets * (Number(rates.cementBoardPricePerSheet) || 0);
      const cbAdhKg = roomFloor * 3;
      cementBoardAdhesiveKg += cbAdhKg;
      cementBoardAdhesiveBags += Math.ceil(cbAdhKg / 20);
      cementBoardAdhesiveCost += Math.ceil(cbAdhKg / 20) * (Number(rates.adhesivePricePerBag) || 0);
      cementBoardLabourCost += roomFloor * (Number(rates.cementBoardLabourPerM2) || 0);
    }
    if (room.useAntiCrack) {
      antiCrackCost += roomFloor * (Number(rates.antiCrackPerM2) || 0);
      const acAdhKg = roomFloor * 3;
      antiCrackAdhesiveKg += acAdhKg;
      antiCrackAdhesiveBags += Math.ceil(acAdhKg / 20);
      antiCrackAdhesiveCost += Math.ceil(acAdhKg / 20) * (Number(rates.adhesivePricePerBag) || 0);
      antiCrackLabourCost += roomFloor * (Number(rates.antiCrackLabourPerM2) || 0);
    }
    if (room.useLevellingCompound) {
      const depthMm = Number(room.levellingDepthMm) || 3;
      const coveragePerBag = (5 * 3) / depthMm;
      const bags = Math.ceil(roomFloor / coveragePerBag);
      levellingCompoundBags += bags;
      levellingCompoundCost += bags * (Number(rates.levellingCompoundPricePerBag) || 0);
      levellingCompoundLabourCost += roomFloor * (Number(rates.levellingCompoundLabourPerM2) || 0);
    }
    if (room.useUnderfloorHeating) {
      ufhM2 += roomFloor;
      ufhMatCost += roomFloor * (Number(rates.ufhMatPricePerM2) || 0);
      ufhLabourCost += roomFloor * (Number(rates.ufhLabourPerM2) || 0);
      ufhThermostatCount += 1;
    }
    if (room.useLevellingClips) {
      const clipsPerM2 = getRoomClipsPerM2(room);
      const clipArea = (room.tileType === "wall" ? roomWall : roomFloor);
      const qty = clipsPerM2 > 0 ? Math.ceil(clipArea * clipsPerM2) : (Number(room.levellingClipsQty) || 0);
      const packs = Math.ceil(qty / 100);
      levellingClipsPacks += packs;
      levellingClipsCost += packs * (Number(rates.levellingClipsPricePer100) || 0);
    }
    if (room.useTankingWalls) {
      const tubs = Math.ceil(roomWall / 4);
      tankingWallCost += tubs * (Number(rates.tankingPerTub) || 0);
      tankingLabourCost += roomWall * (Number(rates.tankingLabourPerM2) || 0);
    }
    if (room.useTankingFloor) {
      const tubs = Math.ceil(roomFloor / 4);
      tankingFloorCost += tubs * (Number(rates.tankingPerTub) || 0);
      tankingLabourCost += roomFloor * (Number(rates.tankingLabourPerM2) || 0);
    }
    if (room.isNaturalStone) {
      const roomArea = roomFloor + roomWall;
      sealerCost += roomArea * (Number(rates.sealerPerM2) || 0);
      sealerLabourCost += roomArea * (Number(rates.sealerLabourPerM2) || 0);
    }
    if (room.trimLength > 0) {
      const lengths = Math.ceil(Number(room.trimLength) / 2.5);
      trimLengths += lengths;
      trimCost += lengths * (Number(rates.trimPricePerLength) || 0);
    }
  });

  /* ---- ADHESIVE ---- */
  const ADHESIVE_BAG_KG = 20;
  const adhesiveCoveragePerBag = Number(rates.adhesiveCoveragePerBag) || 4;
  const ufhAdhesiveCoverage = 3; // UFH needs flexible S1 @ reduced coverage
  const ufhAdhesiveBags = ufhM2 > 0 ? Math.ceil(ufhM2 / ufhAdhesiveCoverage) : 0;
  const standardAdhesiveBags = Math.ceil(Math.max(0, totalTileArea - ufhM2) / adhesiveCoveragePerBag);
  const adhesiveBags = standardAdhesiveBags + ufhAdhesiveBags;
  const adhesiveCost = adhesiveBags * (Number(rates.adhesivePricePerBag) || 0);

  /* ---- GROUT ---- */
  const groutDensity = 1.7;
  const groutWasteMultiplier = 1 + (Number(groutSpec.wastePercent) || 0) / 100;
  const gL = Math.max(Number(groutSpec.tileLength) || 1, 1);
  const gW = Math.max(Number(groutSpec.tileWidth) || 1, 1);
  const J = Math.max(Number(groutSpec.jointWidth) || 1, 1);
  const T = Math.max(Number(groutSpec.tileThickness) || 1, 1);
  const groutKgPerM2 = ((gL + gW) / (gL * gW)) * J * T * groutDensity;

  let totalGroutKg = 0;
  rooms.forEach(room => {
    const roomFloor = room.floorAreas.reduce((s, a) => s + (Number(a.length)||0) * (Number(a.width)||0), 0);
    const roomWall = room.useFourWallCalc
      ? Math.max(0, 2*((Number(room.roomLength)||0)+(Number(room.roomWidth)||0))*(Number(room.roomHeight)||DEFAULT_HEIGHT)-(Number(room.fourWallDeduct)||0))
      : room.walls.reduce((s, w) => s + Math.max(0, (Number(w.length)||0)*(Number(w.height)||DEFAULT_HEIGHT)-(Number(w.deduct)||0)), 0);
    const roomArea = roomFloor + roomWall;
    let rKgPerM2;
    if (room.useModularPattern && room.modularTiles && room.modularTiles.length > 0) {
      const totalProportion = room.modularTiles.reduce((sum, t) => sum + (Number(t.proportion) || 0), 0);
      if (totalProportion > 0) {
        rKgPerM2 = room.modularTiles.reduce((sum, t) => {
          const tp = tilePresets.find(p => p.label === t.preset);
          const tL = tp ? tp.l : gL, tW = tp ? tp.w : gW;
          return sum + ((Number(t.proportion) || 0) / totalProportion) * ((tL + tW) / (tL * tW)) * J * T * groutDensity;
        }, 0);
      } else {
        rKgPerM2 = groutKgPerM2;
      }
    } else {
      const preset = room.tileSizePreset ? tilePresets.find(p => p.label === room.tileSizePreset) : null;
      const rL = preset ? preset.l : gL;
      const rW = preset ? preset.w : gW;
      rKgPerM2 = ((rL + rW) / (rL * rW)) * J * T * groutDensity;
    }
    totalGroutKg += roomArea * rKgPerM2 * groutWasteMultiplier;
  });

  const groutBags = Math.ceil(totalGroutKg / 2.5);
  const groutCost = groutBags * (Number(rates.groutPricePerBag) || 0);

  const installLabourTotal = cementBoardLabourCost + antiCrackLabourCost + tankingLabourCost + sealerLabourCost + levellingCompoundLabourCost + ufhLabourCost;

  const materialsTotal =
    adhesiveCost +
    groutCost +
    cementBoardCost +
    cementBoardAdhesiveCost +
    antiCrackCost +
    antiCrackAdhesiveCost +
    tankingWallCost +
    tankingFloorCost +
    sealerCost +
    trimCost +
    levellingCompoundCost +
    levellingClipsCost +
    ufhMatCost +
    (ufhThermostatCount * (Number(rates.ufhThermostatPrice) || 0));

  const totalLabourCost = labourCost + installLabourTotal;
  const subTotal = totalLabourCost + materialsTotal;
  const marginPercent = 20;
  const marginAmount = (subTotal * marginPercent) / 100;
  const totalWithMargin = subTotal + marginAmount;
  const vatAmount = rates.vatEnabled ? (totalWithMargin * (Number(rates.vatRate) || 0)) / 100 : 0;
  const grandTotal = totalWithMargin + vatAmount;

  const hasCalculations =
    rooms.length > 0 &&
    (totalFloorArea > 0 || totalWallArea > 0);

  const handleExport = () => {
    alert("PDF Export feature coming next phase 🚀");
  };


  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <style>{`@keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }`}</style>
      <div className="w-full max-w-md space-y-4">

        <h1 className="text-2xl font-bold text-center">Tiler Quote App</h1>

        {installPrompt && (
          <Button onClick={handleInstall} className="w-full">
            Install App
          </Button>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant={page === "measure" ? "default" : "outline"} onClick={() => setPage("measure")}>Measure</Button>
          <Button variant={page === "quotes" ? "default" : "outline"} onClick={() => setPage("quotes")}>
            Quotes {savedQuotes.length > 0 && <span className="ml-1 bg-white text-gray-800 rounded-full text-xs px-1.5">{savedQuotes.length}</span>}
          </Button>
          <Button variant={page === "settings" ? "default" : "outline"} onClick={() => setPage("settings")}>Settings</Button>
        </div>

        <AnimatePresence mode="wait">
          {page === "measure" && (
            <motion.div key="measure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h2 className="font-semibold">Customer Details</h2>
                  <VI placeholder="Customer Name" value={customer.name} onChange={(e)=>setCustomer({...customer,name:e.target.value})}/>
                  <VI placeholder="Address" value={customer.address} onChange={(e)=>setCustomer({...customer,address:e.target.value})}/>
                  <VI placeholder="Email" value={customer.email} onChange={(e)=>setCustomer({...customer,email:e.target.value})}/>
                  <VI placeholder="Phone" value={customer.phone} onChange={(e)=>setCustomer({...customer,phone:e.target.value})}/>
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1" onClick={saveQuote}>💾 Save Quote</Button>
                    <Button variant="outline" className="flex-1" onClick={() => { setCustomer({ name:"",address:"",email:"",phone:"" }); setRooms([]); }}>🗑 Clear</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold">Rooms</h2>
                    <Button size="sm" onClick={addRoom}>+ Add Room</Button>
                  </div>

                  {rooms.map((room, i) => {
                    const activeFloor = room.floorAreas[room.activeFloorIndex];
                    const activeWall = room.walls[room.activeWallIndex];
                    const isFloor = (room.tileType || "floor") === "floor";
                    const isWall = (room.tileType || "floor") === "wall";

                    return (
                      <div key={i} className="border rounded p-3 bg-white shadow-sm space-y-3">

                        {/* Room name + delete */}
                        <div className="flex justify-between items-center gap-2">
                          <VI value={room.name} onChange={(e)=>updateRoom(i,"name",e.target.value)} />
                          <Button variant="ghost" size="icon" onClick={()=>deleteRoom(i)}>
                            <Trash2 size={16}/>
                          </Button>
                        </div>

                        {/* Floor / Wall selector */}
                        <div>
                          <label className="text-xs font-medium text-gray-600">Tile Type</label>
                          <select
                            className="w-full mt-1 border rounded px-3 py-2 text-sm bg-white"
                            value={room.tileType || "floor"}
                            onChange={(e) => updateRoom(i, "tileType", e.target.value)}
                          >
                            <option value="floor">Floor</option>
                            <option value="wall">Wall</option>
                          </select>
                        </div>

                        {/* Tile size / modular */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-600">Tile Size <span className="font-normal text-gray-400">(optional)</span></label>
                            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                              <input type="checkbox" checked={room.useModularPattern || false}
                                onChange={(e) => updateRoom(i, "useModularPattern", e.target.checked)} />
                              Modular pattern
                            </label>
                          </div>

                          {!room.useModularPattern && (
                            <select
                              className="w-full border rounded px-3 py-2 text-sm bg-white"
                              value={room.tileSizePreset || ""}
                              onChange={(e) => updateRoom(i, "tileSizePreset", e.target.value)}
                            >
                              <option value="">Choose tile size to calculate grout needed</option>
                              {tilePresets.map(p => (
                                <option key={p.label} value={p.label}>{p.label} mm</option>
                              ))}
                            </select>
                          )}

                          {room.useModularPattern && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2">
                              <div className="text-xs text-amber-700 font-medium">Mixed pattern — set tile sizes and proportions (%) </div>
                              {(room.modularTiles || []).map((mt, ti) => {
                                const totalProp = (room.modularTiles || []).reduce((s, t) => s + (Number(t.proportion)||0), 0);
                                return (
                                  <div key={ti} className="flex items-center gap-2">
                                    <select
                                      className="flex-1 border rounded px-2 py-1.5 text-xs bg-white"
                                      value={mt.preset}
                                      onChange={e => updateModularTile(i, ti, "preset", e.target.value)}
                                    >
                                      {tilePresets.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                    </select>
                                    <Input
                                      type="number" min="0" max="100"
                                      className="w-16 text-xs text-center"
                                      value={mt.proportion || ""}
                                      placeholder="%"
                                      onChange={e => updateModularTile(i, ti, "proportion", Number(e.target.value))}
                                    />
                                    <span className="text-xs text-gray-400">%</span>
                                    {(room.modularTiles||[]).length > 2 && (
                                      <button className="text-red-400 hover:text-red-600 text-xs px-1"
                                        onClick={() => removeModularTile(i, ti)}>✕</button>
                                    )}
                                  </div>
                                );
                              })}
                              <div className="flex items-center justify-between pt-1">
                                <button className="text-xs text-amber-700 underline" onClick={() => addModularTile(i)}>+ Add tile size</button>
                                {(function() {
                                  const total = (room.modularTiles||[]).reduce((s,t) => s+(Number(t.proportion)||0), 0);
                                  return <span className={"text-xs font-medium " + (total === 100 ? "text-green-600" : "text-red-500")}>{total}% {total === 100 ? "✓" : "(must = 100%)"}</span>;
                                }())}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ---- FLOOR MODE ---- */}
                        {isFloor && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Floor Measurements</span>
                              <Button size="sm" onClick={()=>addFloorArea(i)}>+ Add Area</Button>
                            </div>
                            {activeFloor && (
                              <div className="space-y-2">
                                <label className="text-xs text-gray-600">Length (m)</label>
                                <div className="flex gap-1"><VI type="number" placeholder="e.g. 3.2" value={activeFloor.length || ""} onChange={(e)=>updateFloorArea(i,"length",Number(e.target.value))}/><VoiceInput onResult={v=>updateFloorArea(i,"length",Number(v))}/></div>
                                <label className="text-xs text-gray-600">Width (m)</label>
                                <div className="flex gap-1"><VI type="number" placeholder="e.g. 2.4" value={activeFloor.width || ""} onChange={(e)=>updateFloorArea(i,"width",Number(e.target.value))}/><VoiceInput onResult={v=>updateFloorArea(i,"width",Number(v))}/></div>
                                <div className="text-xs text-gray-500">Area: {(activeFloor.length * activeFloor.width).toFixed(2)} m²</div>
                              </div>
                            )}

                            {/* Floor options */}
                            <div className="border-t pt-2">
                              <span className="text-xs font-medium text-gray-600">Floor Options</span>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <label className="flex items-center gap-1">
                                  <input type="checkbox" checked={room.useCementBoard||false}
                                    onChange={(e)=>updateRoom(i,"useCementBoard",e.target.checked)}/>
                                  Cement Board
                                </label>
                                <label className="flex items-center gap-1">
                                  <input type="checkbox" checked={room.useAntiCrack||false}
                                    onChange={(e)=>updateRoom(i,"useAntiCrack",e.target.checked)}/>
                                  Anti-Crack Membrane
                                </label>
                                <label className="flex items-center gap-1 col-span-2">
                                  <input type="checkbox" checked={room.useLevellingCompound||false}
                                    onChange={(e)=>updateRoom(i,"useLevellingCompound",e.target.checked)}/>
                                  Levelling Compound
                                </label>
                                {room.useLevellingCompound && (
                                  <div className="col-span-2 bg-orange-50 border border-orange-200 rounded p-2 space-y-2">
                                    <div className="font-medium text-orange-700">Levelling depth</div>
                                    <div className="flex gap-2">
                                      {[2,3].map(d => (
                                        <button key={d}
                                          className={`flex-1 py-1.5 rounded border text-xs font-medium ${(room.levellingDepthMm||3) === d ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-300"}`}
                                          onClick={() => updateRoom(i,"levellingDepthMm",d)}>
                                          {d}mm
                                        </button>
                                      ))}
                                    </div>
                                    <div className="text-gray-500">
                                      ≈ {Math.ceil(totalFloorArea / ((5 * 3) / (room.levellingDepthMm||3)))} bag{Math.ceil(totalFloorArea / ((5 * 3) / (room.levellingDepthMm||3))) !== 1 ? "s" : ""} (25kg)
                                    </div>
                                  </div>
                                )}
                                <label className="flex items-center gap-1 col-span-2">
                                  <input type="checkbox" checked={room.useLevellingClips||false}
                                    onChange={(e)=>updateRoom(i,"useLevellingClips",e.target.checked)}/>
                                  Levelling Clips
                                </label>
                                {room.useLevellingClips && <ClipsPanel room={room} updateRoom={updateRoom} roomIndex={i} getRoomClipsPerM2={getRoomClipsPerM2} areaKey="floor" />}
                                <label className="flex items-center gap-1 col-span-2">
                                  <input type="checkbox" checked={room.isNaturalStone||false}
                                    onChange={(e)=>updateRoom(i,"isNaturalStone",e.target.checked)}/>
                                  Natural Stone (Apply Sealer)
                                </label>
                                <label className="flex items-center gap-1 col-span-2">
                                  <input type="checkbox" checked={room.useUnderfloorHeating||false}
                                    onChange={(e)=>updateRoom(i,"useUnderfloorHeating",e.target.checked)}/>
                                  ⚡ Electric Underfloor Heating
                                </label>
                                {room.useUnderfloorHeating && <UFHPanel room={room} roomIndex={i} updateRoom={updateRoom} />}
                              </div>
                              <div className="mt-2">
                                <label className="text-xs text-gray-600">Tile Trim Length (m)</label>
                                <VI type="number" placeholder="0" value={room.trimLength || ""}
                                  onChange={(e)=>updateRoom(i,"trimLength",Number(e.target.value))}/>
                                {room.trimLength > 0 && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    = {Math.ceil(room.trimLength / 2.5)} length{Math.ceil(room.trimLength / 2.5) !== 1 ? "s" : ""} @ 2.5m
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ---- WALL MODE ---- */}
                        {isWall && (
                          <div className="space-y-3">

                            {/* 4-Wall Auto Calculator toggle */}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={room.useFourWallCalc || false}
                                onChange={(e)=>updateRoom(i,"useFourWallCalc",e.target.checked)}
                              />
                              <span className="text-xs font-medium">Use 4-Wall Auto Calculator</span>
                            </div>

                            {/* 4-Wall inputs */}
                            {room.useFourWallCalc && (
                              <div className="space-y-2">
                                <label className="text-xs">Room Length (m)</label>
                                <div className="flex gap-1"><VI type="number" value={room.roomLength || ""}
                                  onChange={(e)=>updateRoom(i,"roomLength",Number(e.target.value))}/><VoiceInput onResult={v=>updateRoom(i,"roomLength",Number(v))}/></div>
                                <label className="text-xs">Room Width (m)</label>
                                <div className="flex gap-1"><VI type="number" value={room.roomWidth || ""}
                                  onChange={(e)=>updateRoom(i,"roomWidth",Number(e.target.value))}/><VoiceInput onResult={v=>updateRoom(i,"roomWidth",Number(v))}/></div>
                                <label className="text-xs">Wall Height (m)</label>
                                <VI type="number" value={room.roomHeight || ""}
                                  onChange={(e)=>updateRoom(i,"roomHeight",Number(e.target.value))}/>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={()=>updateRoom(i,"roomHeight",DEFAULT_HEIGHT)}>2.4m</Button>
                                  <Button size="sm" variant="outline" onClick={()=>updateRoom(i,"roomHeight",DEFAULT_HEIGHT/2)}>Half</Button>
                                </div>
                                <label className="text-xs">Total Deductions (m²) — doors, windows</label>
                                <VI type="number" placeholder="0" value={room.fourWallDeduct || ""}
                                  onChange={(e)=>updateRoom(i,"fourWallDeduct",Number(e.target.value))}/>
                                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 space-y-1">
                                  <div>Wall area: {(2*(room.roomLength+room.roomWidth)*room.roomHeight - (room.fourWallDeduct||0)).toFixed(2)} m²</div>
                                </div>
                                <Button size="sm" className="w-full" onClick={()=>{
                                  const updated=[...rooms];
                                  updated[i].floorAreas=[{length:room.roomLength,width:room.roomWidth}];
                                  setRooms(updated);
                                }}>
                                  Also Add Floor Area Automatically
                                </Button>
                              </div>
                            )}

                            {/* Manual wall inputs */}
                            {!room.useFourWallCalc && (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Wall Measurements</span>
                                  <Button size="sm" onClick={()=>addWall(i)}>+ Add Wall</Button>
                                </div>
                                {activeWall && (
                                  <div className="space-y-2">
                                    <label className="text-xs text-gray-600">Length (m)</label>
                                    <div className="flex gap-1"><VI type="number" placeholder="e.g. 3.2" value={activeWall.length || ""} onChange={(e)=>updateWall(i,"length",Number(e.target.value))}/><VoiceInput onResult={v=>updateWall(i,"length",Number(v))}/></div>
                                    <label className="text-xs text-gray-600">Height (m)</label>
                                    <div className="flex gap-1"><VI type="number" placeholder="e.g. 2.4" value={activeWall.height || ""} onChange={(e)=>updateWall(i,"height",Number(e.target.value))}/><VoiceInput onResult={v=>updateWall(i,"height",Number(v))}/></div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" onClick={()=>resetDefaultHeight(i)}>2.4m</Button>
                                      <Button size="sm" variant="outline" onClick={()=>setHalfHeight(i)}>Half</Button>
                                    </div>
                                    <label className="text-xs text-gray-600">Deduct (m²)</label>
                                    <VI type="number" placeholder="0" value={activeWall.deduct || ""} onChange={(e)=>updateWall(i,"deduct",Number(e.target.value))}/>
                                    <div className="text-xs text-gray-500">Area: {(activeWall.length * activeWall.height - activeWall.deduct).toFixed(2)} m²</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Wall options */}
                            <div className="border-t pt-2">
                              <span className="text-xs font-medium text-gray-600">Wall Options</span>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <label className="flex items-center gap-1">
                                  <input type="checkbox" checked={room.useTankingWalls||false}
                                    onChange={(e)=>updateRoom(i,"useTankingWalls",e.target.checked)}/>
                                  Tanking Walls
                                </label>
                                <label className="flex items-center gap-1 col-span-2">
                                  <input type="checkbox" checked={room.useLevellingClips||false}
                                    onChange={(e)=>updateRoom(i,"useLevellingClips",e.target.checked)}/>
                                  Levelling Clips
                                </label>
                                {room.useLevellingClips && <ClipsPanel room={room} updateRoom={updateRoom} roomIndex={i} getRoomClipsPerM2={getRoomClipsPerM2} areaKey="wall" />}
                                <label className="flex items-center gap-1 col-span-2">
                                  <input type="checkbox" checked={room.isNaturalStone||false}
                                    onChange={(e)=>updateRoom(i,"isNaturalStone",e.target.checked)}/>
                                  Natural Stone (Apply Sealer)
                                </label>
                                <label className="flex items-center gap-1 col-span-2">
                                  <input type="checkbox" checked={room.useUnderfloorHeating||false}
                                    onChange={(e)=>updateRoom(i,"useUnderfloorHeating",e.target.checked)}/>
                                  ⚡ Electric Underfloor Heating
                                </label>
                                {room.useUnderfloorHeating && <UFHPanel room={room} roomIndex={i} updateRoom={updateRoom} />}
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}

                </CardContent>
              </Card>

            </motion.div>
          )}

          {page === "quotes" && (
            <motion.div key="quotes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h2 className="font-semibold">Saved Quotes</h2>

                  {savedQuotes.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No saved quotes yet. Fill in customer details and rooms, then tap Save Quote.</p>
                  )}

                  {savedQuotes.map((quote) => (
                    <div key={quote.id} className="border rounded-lg p-3 bg-white space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{quote.customer.name || "Unnamed Job"}</div>
                          {quote.customer.address && <div className="text-xs text-gray-500">{quote.customer.address}</div>}
                          <div className="text-xs text-gray-400 mt-0.5">Saved {quote.savedAt}</div>
                        </div>
                        <button onClick={() => deleteQuote(quote.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
                      </div>

                      <div className="text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-0.5 bg-gray-50 rounded p-2">
                        {quote.rooms.length > 0 && <span>{quote.rooms.length} room{quote.rooms.length !== 1 ? "s" : ""}</span>}
                        {(() => {
                          let fa = 0, wa = 0;
                          quote.rooms.forEach(r => {
                            r.floorAreas.forEach(a => { fa += (a.length||0)*(a.width||0); });
                            if (r.useFourWallCalc) {
                              wa += 2*((r.roomLength||0)+(r.roomWidth||0))*(r.roomHeight||0)-(r.fourWallDeduct||0);
                            } else {
                              r.walls.forEach(w => { wa += (w.length||0)*(w.height||0)-(w.deduct||0); });
                            }
                          });
                          return <>
                            {fa > 0 && <span>Floor: {fa.toFixed(2)} m²</span>}
                            {wa > 0 && <span>Wall: {wa.toFixed(2)} m²</span>}
                          </>;
                        })()}
                      </div>

                      <Button size="sm" className="w-full" onClick={() => loadQuote(quote)}>Load Quote</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {page === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* ---- LABOUR & MATERIALS ---- */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold">Pricing & Materials</h2>
                  </div>

                  {/* Rate Presets */}
                  <div className="bg-gray-50 rounded p-3 space-y-2">
                    <span className="text-xs font-medium text-gray-600">Saved Rate Presets</span>

                    {Object.keys(ratePresets).length === 0 && (
                      <p className="text-xs text-gray-400 italic">No presets saved yet.</p>
                    )}

                    {Object.keys(ratePresets).map((name) => (
                      <div key={name} className="flex items-center gap-2">
                        <button
                          className="flex-1 text-left text-xs bg-white border rounded px-3 py-2 hover:bg-blue-50"
                          onClick={() => loadPreset(name)}
                        >{name}</button>
                        <button
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-2"
                          onClick={() => deletePreset(name)}
                        >✕</button>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Preset name (e.g. Standard, Premium)"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="text-xs"
                      />
                      <Button size="sm" onClick={savePreset} disabled={!presetName.trim()}>Save</Button>
                    </div>
                  </div>

                  {/* Labour mode toggle */}
                  <label className="text-xs font-medium">Labour Rate Mode</label>
                  <div className="flex rounded overflow-hidden border text-xs">
                    <button
                      className={`flex-1 py-2 ${rates.labourMode === "m2" ? "bg-gray-800 text-white" : "bg-white text-gray-600"}`}
                      onClick={() => setRates({...rates, labourMode: "m2"})}
                    >Per m²</button>
                    <button
                      className={`flex-1 py-2 ${rates.labourMode === "day" ? "bg-gray-800 text-white" : "bg-white text-gray-600"}`}
                      onClick={() => setRates({...rates, labourMode: "day"})}
                    >Day Rate</button>
                  </div>

                  {rates.labourMode === "m2" && (
                    <>
                      <label className="text-xs">Floor Labour (£ per m²)</label>
                      <VI type="number" value={rates.floorRate} onChange={(e)=>setRates({...rates,floorRate:Number(e.target.value)})}/>
                      <label className="text-xs">Wall Labour (£ per m²)</label>
                      <VI type="number" value={rates.wallRate} onChange={(e)=>setRates({...rates,wallRate:Number(e.target.value)})}/>
                    </>
                  )}

                  {rates.labourMode === "day" && (
                    <>
                      <label className="text-xs">Day Rate (£)</label>
                      <VI type="number" value={rates.dayRate} onChange={(e)=>setRates({...rates,dayRate:Number(e.target.value)})}/>
                      <label className="text-xs">Number of Days</label>
                      <VI type="number" value={rates.daysEstimate} onChange={(e)=>setRates({...rates,daysEstimate:Number(e.target.value)})}/>
                    </>
                  )}

                  <div className="border-t pt-3" />

                  <label className="text-xs">Adhesive (£ per 20kg bag)</label>
                  <VI type="number" value={rates.adhesivePricePerBag} onChange={(e)=>setRates({...rates,adhesivePricePerBag:Number(e.target.value)})}/>
                  <label className="text-xs">Adhesive Coverage (m² per 20kg bag)</label>
                  <VI type="number" step="0.5" value={rates.adhesiveCoveragePerBag} onChange={(e)=>setRates({...rates,adhesiveCoveragePerBag:Number(e.target.value)})}/>

                  <label className="text-xs">Cement Board (£ per sheet — 1.2×0.6m)</label>
                  <VI type="number" value={rates.cementBoardPricePerSheet} onChange={(e)=>setRates({...rates,cementBoardPricePerSheet:Number(e.target.value)})}/>
                  <label className="text-xs">Cement Board Install Labour (£ per m²)</label>
                  <VI type="number" value={rates.cementBoardLabourPerM2} onChange={(e)=>setRates({...rates,cementBoardLabourPerM2:Number(e.target.value)})}/>

                  <label className="text-xs">Anti-Crack Membrane (£ per m²)</label>
                  <VI type="number" value={rates.antiCrackPerM2} onChange={(e)=>setRates({...rates,antiCrackPerM2:Number(e.target.value)})}/>
                  <label className="text-xs">Anti-Crack Install Labour (£ per m²)</label>
                  <VI type="number" value={rates.antiCrackLabourPerM2} onChange={(e)=>setRates({...rates,antiCrackLabourPerM2:Number(e.target.value)})}/>

                  <label className="text-xs">Tanking (£ per tub — covers 4 m²)</label>
                  <VI type="number" value={rates.tankingPerTub} onChange={(e)=>setRates({...rates,tankingPerTub:Number(e.target.value)})}/>
                  <label className="text-xs">Tanking Install Labour (£ per m²)</label>
                  <VI type="number" value={rates.tankingLabourPerM2} onChange={(e)=>setRates({...rates,tankingLabourPerM2:Number(e.target.value)})}/>

                  <label className="text-xs">Natural Stone Sealer (£ per m²)</label>
                  <VI type="number" value={rates.sealerPerM2} onChange={(e)=>setRates({...rates,sealerPerM2:Number(e.target.value)})}/>
                  <label className="text-xs">Sealer Install Labour (£ per m²)</label>
                  <VI type="number" value={rates.sealerLabourPerM2} onChange={(e)=>setRates({...rates,sealerLabourPerM2:Number(e.target.value)})}/>

                  <label className="text-xs">⚡ UFH Mat (£ per m²)</label>
                  <VI type="number" value={rates.ufhMatPricePerM2} onChange={(e)=>setRates({...rates,ufhMatPricePerM2:Number(e.target.value)})}/>
                  <label className="text-xs">⚡ UFH Thermostat (£ each)</label>
                  <VI type="number" value={rates.ufhThermostatPrice} onChange={(e)=>setRates({...rates,ufhThermostatPrice:Number(e.target.value)})}/>
                  <label className="text-xs">⚡ UFH Install Labour (£ per m²)</label>
                  <VI type="number" value={rates.ufhLabourPerM2} onChange={(e)=>setRates({...rates,ufhLabourPerM2:Number(e.target.value)})}/>

                  <label className="text-xs">Levelling Compound (£ per 25kg bag)</label>
                  <VI type="number" value={rates.levellingCompoundPricePerBag} onChange={(e)=>setRates({...rates,levellingCompoundPricePerBag:Number(e.target.value)})}/>
                  <label className="text-xs">Levelling Compound Labour (£ per m²)</label>
                  <VI type="number" value={rates.levellingCompoundLabourPerM2} onChange={(e)=>setRates({...rates,levellingCompoundLabourPerM2:Number(e.target.value)})}/>

                  <label className="text-xs">Levelling Clips (£ per 100)</label>
                  <VI type="number" value={rates.levellingClipsPricePer100} onChange={(e)=>setRates({...rates,levellingClipsPricePer100:Number(e.target.value)})}/>

                  <div className="border-t pt-2 space-y-2">
                    <label className="text-xs font-medium text-gray-700">Grout Settings</label>
                    <label className="text-xs text-gray-600">Grout Price (£ per 2.5kg bag)</label>
                    <VI type="number" step="0.01" value={rates.groutPricePerBag} onChange={(e)=>setRates({...rates,groutPricePerBag:Number(e.target.value)})}/>
                    <label className="text-xs text-gray-600">Joint Width (mm)</label>
                    <VI type="number" value={groutSpec.jointWidth} onChange={(e)=>setGroutSpec({...groutSpec,jointWidth:Number(e.target.value)})}/>
                    <label className="text-xs text-gray-600">Tile Thickness (mm)</label>
                    <VI type="number" value={groutSpec.tileThickness} onChange={(e)=>setGroutSpec({...groutSpec,tileThickness:Number(e.target.value)})}/>
                    <label className="text-xs text-gray-600">Waste % (e.g. 10)</label>
                    <VI type="number" value={groutSpec.wastePercent} onChange={(e)=>setGroutSpec({...groutSpec,wastePercent:Number(e.target.value)})}/>
                  </div>

                  <label className="text-xs">Tile Trim (£ per 2.5m length)</label>
                  <VI type="number" step="0.01" value={rates.trimPricePerLength} onChange={(e)=>setRates({...rates,trimPricePerLength:Number(e.target.value)})}/>

                  <div className="border-t pt-3" />

                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={rates.vatEnabled} onChange={(e)=>setRates({...rates,vatEnabled:e.target.checked})}/>
                    <span className="text-sm">Enable VAT</span>
                  </div>
                  {rates.vatEnabled && (
                    <>
                      <label className="text-xs">VAT Rate (%)</label>
                      <VI type="number" value={rates.vatRate} onChange={(e)=>setRates({...rates,vatRate:Number(e.target.value)})}/>
                    </>
                  )}

                  <Button onClick={handleExport} className="w-full flex items-center gap-2 justify-center">
                    <FileText size={16}/> Export PDF
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Totals Card */}
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">

            {/* Header + toggle */}
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-semibold">Quote Summary</h2>
              <div className="flex rounded overflow-hidden border text-xs">
                <button
                  className={`px-3 py-1 ${summaryView === "trader" ? "bg-gray-800 text-white" : "bg-white text-gray-600"}`}
                  onClick={() => setSummaryView("trader")}
                >Trader</button>
                <button
                  className={`px-3 py-1 ${summaryView === "customer" ? "bg-gray-800 text-white" : "bg-white text-gray-600"}`}
                  onClick={() => setSummaryView("customer")}
                >Customer</button>
              </div>
            </div>

            {!hasCalculations && (
              <p className="text-xs text-gray-400 italic">Add rooms and measurements on the Measure tab to see totals.</p>
            )}

            {/* ---- TRADER VIEW ---- */}
            {summaryView === "trader" && (
              <>
                {(totalFloorArea > 0 || totalWallArea > 0) && (
                  <div className="space-y-1 pb-2 border-b">
                    {totalFloorArea > 0 && <div className="flex justify-between"><span className="text-gray-600">Floor</span><span>{totalFloorArea.toFixed(2)} m²</span></div>}
                    {totalWallArea > 0 && <div className="flex justify-between"><span className="text-gray-600">Wall</span><span>{totalWallArea.toFixed(2)} m²</span></div>}
                  </div>
                )}

                {totalLabourCost > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between font-medium pt-1">
                      <span>Labour</span><span>£{totalLabourCost.toFixed(2)}</span>
                    </div>
                    {labourCost > 0 && installLabourTotal > 0 && (
                      <>
                        <div className="flex justify-between text-xs"><span className="text-gray-500 pl-2">↳ Tiling</span><span className="text-gray-500">£{labourCost.toFixed(2)}</span></div>
                        {cementBoardLabourCost > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 pl-2">↳ Cement Board install</span><span className="text-gray-500">£{cementBoardLabourCost.toFixed(2)}</span></div>}
                        {antiCrackLabourCost > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 pl-2">↳ Anti-Crack install</span><span className="text-gray-500">£{antiCrackLabourCost.toFixed(2)}</span></div>}
                        {tankingLabourCost > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 pl-2">↳ Tanking install</span><span className="text-gray-500">£{tankingLabourCost.toFixed(2)}</span></div>}
                        {sealerLabourCost > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 pl-2">↳ Sealer install</span><span className="text-gray-500">£{sealerLabourCost.toFixed(2)}</span></div>}
                        {levellingCompoundLabourCost > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 pl-2">↳ Levelling compound</span><span className="text-gray-500">£{levellingCompoundLabourCost.toFixed(2)}</span></div>}
                        {ufhLabourCost > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 pl-2">↳ UFH installation</span><span className="text-gray-500">£{ufhLabourCost.toFixed(2)}</span></div>}
                      </>
                    )}
                  </div>
                )}

                {adhesiveCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Adhesive <span className="text-gray-400">({adhesiveBags} bag{adhesiveBags !== 1 ? 's' : ''}{ufhAdhesiveBags > 0 ? ` — ${ufhAdhesiveBags} flexible S1 for UFH` : ""})</span>
                    </span>
                    <span>£{adhesiveCost.toFixed(2)}</span>
                  </div>
                )}
                {groutCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grout <span className="text-gray-400">({groutBags} bag{groutBags !== 1 ? "s" : ""}, {totalGroutKg.toFixed(1)} kg)</span></span>
                    <span>£{groutCost.toFixed(2)}</span>
                  </div>
                )}
                {cementBoardCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Cement Board <span className="text-gray-400">({cementBoardSheets} sheet{cementBoardSheets !== 1 ? "s" : ""})</span></span><span>£{cementBoardCost.toFixed(2)}</span></div>}
                {cementBoardAdhesiveCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">↳ CB Adhesive <span className="text-gray-400">({cementBoardAdhesiveKg.toFixed(0)} kg / {cementBoardAdhesiveBags} bag{cementBoardAdhesiveBags !== 1 ? "s" : ""})</span></span>
                    <span>£{cementBoardAdhesiveCost.toFixed(2)}</span>
                  </div>
                )}
                {antiCrackCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Anti-Crack</span><span>£{antiCrackCost.toFixed(2)}</span></div>}
                {antiCrackAdhesiveCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">↳ AC Adhesive <span className="text-gray-400">({antiCrackAdhesiveKg.toFixed(0)} kg / {antiCrackAdhesiveBags} bag{antiCrackAdhesiveBags !== 1 ? "s" : ""})</span></span>
                    <span>£{antiCrackAdhesiveCost.toFixed(2)}</span>
                  </div>
                )}
                {tankingWallCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Tanking Walls</span><span>£{tankingWallCost.toFixed(2)}</span></div>}
                {tankingFloorCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Tanking Floor</span><span>£{tankingFloorCost.toFixed(2)}</span></div>}
                {sealerCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Sealer</span><span>£{sealerCost.toFixed(2)}</span></div>}
                {trimCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Tile Trim <span className="text-gray-400">({trimLengths} length{trimLengths !== 1 ? "s" : ""})</span></span><span>£{trimCost.toFixed(2)}</span></div>}
                {levellingCompoundCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Levelling Compound <span className="text-gray-400">({levellingCompoundBags} bag{levellingCompoundBags !== 1 ? "s" : ""})</span></span><span>£{levellingCompoundCost.toFixed(2)}</span></div>}
                {levellingClipsCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Levelling Clips <span className="text-gray-400">({levellingClipsPacks} pack{levellingClipsPacks !== 1 ? "s" : ""})</span></span><span>£{levellingClipsCost.toFixed(2)}</span></div>}
                {ufhMatCost > 0 && <div className="flex justify-between"><span className="text-gray-600">⚡ UFH Heating Mat <span className="text-gray-400">({ufhM2.toFixed(1)} m²)</span></span><span>£{ufhMatCost.toFixed(2)}</span></div>}
                {ufhThermostatCount > 0 && <div className="flex justify-between"><span className="text-gray-600">⚡ UFH Thermostat{ufhThermostatCount > 1 ? "s" : ""} <span className="text-gray-400">×{ufhThermostatCount}</span></span><span>£{(ufhThermostatCount * (Number(rates.ufhThermostatPrice)||0)).toFixed(2)}</span></div>}

                {materialsTotal > 0 && (
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Materials</span><span>£{materialsTotal.toFixed(2)}</span>
                  </div>
                )}

                {subTotal > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>£{subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Margin ({marginPercent}%)</span><span>£{marginAmount.toFixed(2)}</span></div>
                    {rates.vatEnabled && <div className="flex justify-between"><span className="text-gray-600">VAT ({rates.vatRate}%)</span><span>£{vatAmount.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-1">
                      <span>Total</span><span>£{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---- CUSTOMER VIEW ---- */}
            {summaryView === "customer" && (
              <>
                {(totalFloorArea > 0 || totalWallArea > 0) && (
                  <div className="space-y-1 pb-2 border-b">
                    {totalFloorArea > 0 && <div className="flex justify-between"><span className="text-gray-600">Floor</span><span>{totalFloorArea.toFixed(2)} m²</span></div>}
                    {totalWallArea > 0 && <div className="flex justify-between"><span className="text-gray-600">Wall</span><span>{totalWallArea.toFixed(2)} m²</span></div>}
                  </div>
                )}

                {hasCalculations && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between"><span>Labour</span><span>£{totalLabourCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Materials</span><span>£{(materialsTotal + marginAmount).toFixed(2)}</span></div>
                    {rates.vatEnabled && <div className="flex justify-between"><span className="text-gray-600">VAT ({rates.vatRate}%)</span><span>£{vatAmount.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-1">
                      <span>Total</span><span>£{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Share buttons */}
            {hasCalculations && (
              <div className="border-t pt-3 mt-2 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 justify-center text-green-700 border-green-300 hover:bg-green-50"
                  onClick={sendWhatsApp}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 justify-center text-blue-700 border-blue-300 hover:bg-blue-50"
                  onClick={sendEmail}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  Email
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
