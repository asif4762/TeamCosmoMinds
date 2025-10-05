import { createPortal } from 'react-dom';
import { Play, Pause, RotateCcw, Info, Thermometer, Zap, Building2, Command, Sparkles } from 'lucide-react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import CommandPalette from '../components/CommandPalette';
import Alert from '../components/Alert';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
// Flipbook + CSS
const TerraBook = lazy(() => import('../components/TerraBook'));
import '../components/terra-book.css';


// Lazy-load the book data per country (match marker names)
const loadCountryBookData = {
  Kenya: () => import('../data/terraBookData_ken'),
  Japan: () => import('../data/terraBookData_jpn'),
  Argentina: () => import('../data/terraBookData_arg'),
  'United States': () => import('../data/terraBookData_usa'),
  Bangladesh: () => import('../data/terraBookData_bgd'),
  Australia: () => import('../data/terraBookData_aus'),
  Brazil: () => import('../data/terraBookData_bra'),
  Canada: () => import('../data/terraBookData_can'),
  Chile: () => import('../data/terraBookData_chl'),
  'United Kingdom': () => import('../data/terraBookData_uk'),
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Right-side / mobile bottom book panel
const RightBookPanel = ({ open, countryName, onClose, bookData, isMobile }) => {
  if (!open) return null;

  const base = isMobile
    ? 'fixed inset-x-0 bottom-0 h-[70vh] max-h-[100vh] w-full bg-black/80 backdrop-blur-md border-t border-white/10 rounded-t-2xl'
    : 'fixed top-0 right-0 h-screen max-h-[100vh] w-[420px] max-w-[90vw] bg-black/70 backdrop-blur-md border-l border-white/10';

  const panel = (
    <AnimatePresence>
      <motion.aside
        initial={{ x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        exit={{ x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className={`${base} z-[99998] flex flex-col pointer-events-auto`}
        style={{ position: 'fixed' }}
      >
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2 text-white text-sm opacity-80">
            {countryName || 'Story'}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <Suspense fallback={<div className="p-4 text-white text-sm">Loading book…</div>}>
            {bookData ? (
              <div className="w-full h-full grid place-items-center">
                <TerraBook
                  title={bookData.title}
                  subtitle={bookData.subtitle}
                  data={{ countries: bookData.countries }}
                />
              </div>
            ) : (
              <div className="p-4 text-white/80 text-sm">No storybook found for this country yet.</div>
            )}
          </Suspense>
        </div>
      </motion.aside>
    </AnimatePresence>
  );

  // Render outside any clipped/transformed ancestors
  return createPortal(panel, document.body);
};

const TerraEarthGame = () => {
  const globeEl = useRef();
  const controlRef = useRef();
  const climatePanelRef = useRef();

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [activePanel, setActivePanel] = useState('climate');
  const [yearIndex, setYearIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControlPanel, setShowControlPanel] = useState(true);

  const [showBookPanel, setShowBookPanel] = useState(false);
  const [bookData, setBookData] = useState(null);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'info', text: '' });

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isMobile = windowSize.width < 640;

  // Year data modal state
  const [showYearModal, setShowYearModal] = useState(false);
  const [selectedYearData, setSelectedYearData] = useState(null);
  const [yearModalPosition, setYearModalPosition] = useState({ x: 200, y: 100 });

  const [panelPosition, setPanelPosition] = useState({ x: 16, y: window.innerHeight - 260 });
  const [climatePanelPosition, setClimatePanelPosition] = useState({ x: 12, y: 12 });

  // New state for JSON data
  const [countriesData, setCountriesData] = useState(null);
  const [loading, setLoading] = useState(true);

  const draggingRef = useRef(false);
  const draggingClimateRef = useRef(false);
  const draggingYearModalRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const years = useMemo(() => Array.from({ length: 25 }, (_, i) => 2000 + i), []);

  // Fetch JSON data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/datas/all-countries-data.json');
        if (!response.ok) {
          throw new Error('Failed to fetch countries data');
        }
        const data = await response.json();
        setCountriesData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching countries data:', error);
        setAlert({ open: true, type: 'danger', text: 'Failed to load country data' });
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper function to get full data for a specific year and country
  const getFullYearData = (countryName, year) => {
    if (!countriesData || !countriesData[countryName]) return null;
    const countryData = countriesData[countryName];
    const result = {};
    const climateKey = `climate_${year}`;
    if (countryData.climate && countryData.climate[climateKey]) result.climate = countryData.climate[climateKey];
    const deforestationKey = `deforestation_${year}`;
    if (countryData.deforestation && countryData.deforestation[deforestationKey]) result.deforestation = countryData.deforestation[deforestationKey];
    const urbanKey = `urban_${year}`;
    if (countryData.urban && countryData.urban[urbanKey]) result.urban = countryData.urban[urbanKey];
    return result;
  };

  // Helper function to extract data for a specific year and country
  const getCountryDataForYear = (countryName, year, dataType) => {
    if (!countriesData || !countriesData[countryName]) return null;
    const countryData = countriesData[countryName];
    switch (dataType) {
      case 'climate':
        return countryData.climate?.[`climate_${year}`] || null;
      case 'deforestation':
        return countryData.deforestation?.[`deforestation_${year}`] || null;
      case 'urban':
        return countryData.urban?.[`urban_${year}`] || null;
      default:
        return null;
    }
  };

  // Function to open year data modal
  const openYearDataModal = (countryName, year) => {
    if (!countriesData || !countriesData[countryName]) {
      setAlert({ open: true, type: 'warning', text: `No data available for ${countryName} in ${year}` });
      return;
    }
    const result = getFullYearData(countryName, year);
    if (result && Object.keys(result).length) {
      setSelectedYearData({ country: countryName, year, data: result });
      setShowYearModal(true);
      // On mobile, pin modal to center
      if (isMobile) setYearModalPosition({ x: 12, y: 64 });
    } else {
      setAlert({ open: true, type: 'warning', text: `No data available for ${countryName} in ${year}` });
    }
  };

  // Extract numerical data from text descriptions using regex
  const extractNumberFromText = (text, pattern) => {
    if (!text) return 0;
    const match = text.match(pattern);
    return match ? parseFloat(match[1]) : 0;
  };

  // Create processed country data with coordinates and extracted numerical values
  const countryData = useMemo(() => {
    if (!countriesData) return {};

    const coordinates = {
      'Argentina': { lat: -38.4161, lng: -63.6167, emoji: '🇦🇷' },
      'USA': { lat: 37.0902, lng: -95.7129, emoji: '🇺🇸' },
      'Japan': { lat: 36.2048, lng: 138.2529, emoji: '🇯🇵' },
      'Kenya': { lat: -0.0236, lng: 37.9062, emoji: '🇰🇪' },
      'Chile': { lat: -35.6751, lng: -71.5430, emoji: '🇨🇱' },
      'Australia': { lat: -25.2744, lng: 133.7751, emoji: '🇦🇺' },
      'Brazil': { lat: -14.235, lng: -51.9253, emoji: '🇧🇷' },
      'Canada': { lat: 56.1304, lng: -106.3468, emoji: '🇨🇦' },
      'United Kingdom': { lat: 55.3781, lng: -3.436, emoji: '🇬🇧' },
      'Bangladesh': { lat: 23.685, lng: 90.3563, emoji: '🇧🇩' },
    };

    const processedData = {};

    Object.keys(countriesData).forEach(countryName => {
      const coords = coordinates[countryName];
      if (!coords) return;

      const temperatureData = [];
      const co2Data = [];
      const forestCoverData = [];
      const urbanizationData = [];
      const floodsData = [];
      const droughtsData = [];

      years.forEach(year => {
        const climateText = getCountryDataForYear(countryName, year, 'climate');
        if (climateText) {
          const temp = extractNumberFromText(climateText, /(\d+\.?\d*)\s*°?C/i) ||
            extractNumberFromText(climateText, /temperature.*?(\d+\.?\d*)/i) ||
            20 + Math.random() * 10; // fallback
          temperatureData.push(temp);

          const co2 = extractNumberFromText(climateText, /(\d+\.?\d*)\s*tons per capita/i) ||
            extractNumberFromText(climateText, /emissions.*?(\d+\.?\d*)/i) ||
            200 + Math.random() * 100; // fallback
          co2Data.push(co2 * 100); // Scale up for visualization
        } else {
          temperatureData.push(20 + Math.random() * 10);
          co2Data.push(200 + Math.random() * 100);
        }

        const deforestationText = getCountryDataForYear(countryName, year, 'deforestation');
        if (deforestationText) {
          const forestCover = extractNumberFromText(deforestationText, /(\d+\.?\d*)%.*forest/i) ||
            extractNumberFromText(deforestationText, /covered.*?(\d+\.?\d*)%/i) ||
            30 + Math.random() * 20; // fallback
          forestCoverData.push(forestCover);
        } else {
          forestCoverData.push(30 + Math.random() * 20);
        }

        const urbanText = getCountryDataForYear(countryName, year, 'urban');
        if (urbanText) {
          const urbanization = extractNumberFromText(urbanText, /urbanization.*?(\d+\.?\d*)%/i) ||
            extractNumberFromText(urbanText, /(\d+\.?\d*)%.*urban/i) ||
            50 + Math.random() * 30; // fallback
          urbanizationData.push(urbanization);
        } else {
          urbanizationData.push(50 + Math.random() * 30);
        }

        // Mock disaster data
        floodsData.push(Math.floor(Math.random() * 5));
        droughtsData.push(Math.floor(Math.random() * 3));
      });

      let displayName = countryName;
      if (countryName === 'USA') displayName = 'United States';

      processedData[displayName] = {
        ...coords,
        climate: {
          temperature: temperatureData,
          co2: co2Data,
          forestCover: forestCoverData,
        },
        disasters: {
          floods: floodsData,
          droughts: droughtsData,
        },
        urban: {
          population: urbanizationData,
        },
      };
    });

    return processedData;
  }, [countriesData, years]);

  const markerData = useMemo(
    () => Object.entries(countryData).map(([name, data]) => ({
      name, lat: data.lat, lng: data.lng, emoji: data.emoji,
      climate: data.climate, disasters: data.disasters, urban: data.urban,
    })), [countryData]
  );

  // Label sprite with DPR-aware canvas for crisp text on mobile
  const createMarker = (d) => {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const w = 256, h = 64;
    const canvas = document.createElement('canvas');
    canvas.width = w * DPR; canvas.height = h * DPR;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '500 20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd54a';
    ctx.fillText(`🔍 ${d.name}`, w / 2, h / 2);
    const texture = new THREE.CanvasTexture(canvas);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }));
    sprite.scale.set(12, 3.2, 1);
    sprite.userData = { name: d.name };
    sprite.raycast = THREE.Sprite.prototype.raycast;

    const ringGeo = new THREE.RingGeometry(0.32, 0.46, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, -1.2, 0);
    sprite.add(ring);

    return sprite;
  };

  // auto-rotate
  useEffect(() => {
    if (!globeEl.current) return;
    const controls = globeEl.current.controls();
    controls.autoRotate = isPlaying;
    controls.autoRotateSpeed = 0.45;
  }, [isPlaying]);

  // rAF-throttled resize handler for smoother mobile behavior
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWindowSize({ width: window.innerWidth, height: window.innerHeight }));
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);

  // Keyboard: Cmd/Ctrl+K opens palette, Esc closes
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(v => !v); }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Open book by country name
  const openBookForCountry = async (name) => {
    setAlert({ open: true, type: 'info', text: `Loading storybook for ${name}…` });
    setShowBookPanel(true);
    try {
      const loader = loadCountryBookData[name];
      if (loader) {
        const mod = await loader();
        const bd = mod.default ?? mod.bookData;
        setBookData(bd || null);
        if (bd) {
          setAlert({ open: true, type: 'success', text: `Loaded ${name} story.` });
          setTimeout(() => setAlert(a => ({ ...a, open: false })), 1200);
        } else {
          setAlert({ open: true, type: 'warning', text: `No storybook found for ${name} yet.` });
        }
      } else {
        setBookData(null);
        setAlert({ open: true, type: 'warning', text: `No storybook mapping for ${name}.` });
      }
    } catch (e) {
      console.error('Failed to load book:', e);
      setBookData(null);
      setAlert({ open: true, type: 'danger', text: `Couldn't load ${name} story.` });
    }
  };

  const focusCountry = (name) => {
    const d = markerData.find(m => m.name === name);
    if (!d) return;
    setSelectedCountry(d);
    globeEl.current?.pointOfView({ lat: d.lat, lng: d.lng, altitude: isMobile ? 2.6 : 2.2 }, 1000);
  };

  const jumpToCountry = (name) => {
    focusCountry(name);
    openBookForCountry(name);
    setShowControlPanel(true);
  };

  const handleMarkerClick = (d) => {
    setSelectedCountry(d);
    globeEl.current.pointOfView({ lat: d.lat, lng: d.lng, altitude: isMobile ? 2.6 : 2.2 }, 1000);
    openBookForCountry(d.name);
    setShowControlPanel(true);
  };

  // drag panels
  const startDrag = (clientX, clientY, type = 'control') => {
    if (isMobile) return; // lock dragging on mobile to avoid scroll conflicts
    if (type === 'control') draggingRef.current = true;
    if (type === 'climate') draggingClimateRef.current = true;
    if (type === 'yearModal') draggingYearModalRef.current = true;
    lastPosRef.current = { x: clientX, y: clientY };
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
  };
  const stopDrag = () => {
    draggingRef.current = false;
    draggingClimateRef.current = false;
    draggingYearModalRef.current = false;
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
  };
  const onWindowPointerMove = (e) => {
    if (isMobile) return; // no free-drag on mobile
    let clientX, clientY;
    if (e.type.startsWith('touch')) {
      if (!e.touches?.length) return;
      clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    } else { clientX = e.clientX; clientY = e.clientY; }
    const dx = clientX - lastPosRef.current.x;
    const dy = clientY - lastPosRef.current.y;
    lastPosRef.current = { x: clientX, y: clientY };
    if (draggingRef.current) {
      setPanelPosition((prev) => ({
        x: Math.min(windowSize.width - 340, Math.max(0, prev.x + dx)),
        y: Math.min(windowSize.height - 200, Math.max(0, prev.y + dy)),
      }));
    }
    if (draggingClimateRef.current) {
      setClimatePanelPosition((prev) => ({
        x: Math.min(windowSize.width - 320, Math.max(0, prev.x + dx)),
        y: Math.min(windowSize.height - 400, Math.max(0, prev.y + dy)),
      }));
    }
    if (draggingYearModalRef.current) {
      setYearModalPosition((prev) => ({
        x: Math.min(windowSize.width - 500, Math.max(0, prev.x + dx)),
        y: Math.min(windowSize.height - 400, Math.max(0, prev.y + dy)),
      }));
    }
    if (e.cancelable) e.preventDefault();
  };
  useEffect(() => {
    window.addEventListener('mousemove', onWindowPointerMove);
    window.addEventListener('touchmove', onWindowPointerMove, { passive: false });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchcancel', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onWindowPointerMove);
      window.removeEventListener('touchmove', onWindowPointerMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
      window.removeEventListener('touchcancel', stopDrag);
    };
  }, [windowSize, isMobile]);

  // left analytics panel
  const renderDataPanel = () => {
    if (!selectedCountry) return null;
    const { name, emoji, climate, disasters, urban } = selectedCountry;

    const panels = {
      climate: {
        title: 'Climate',
        icon: <Thermometer className="w-4 h-4" />,
        color: 'from-red-500 to-yellow-400',
        data: [
          { label: 'Temperature (°C)', value: climate.temperature[yearIndex], trend: climate.temperature },
          { label: 'CO₂ Emissions (scaled)', value: climate.co2[yearIndex], trend: climate.co2 },
          { label: 'Forest Cover (%)', value: climate.forestCover[yearIndex], trend: climate.forestCover },
        ],
      },
      disasters: {
        title: 'Disasters',
        icon: <Zap className="w-4 h-4" />,
        color: 'from-purple-500 to-pink-500',
        data: [
          { label: 'Floods', value: disasters.floods[yearIndex], trend: disasters.floods },
          { label: 'Droughts', value: disasters.droughts[yearIndex], trend: disasters.droughts },
        ],
      },
      urban: {
        title: 'Urbanization',
        icon: <Building2 className="w-4 h-4" />,
        color: 'from-green-400 to-teal-400',
        data: [{ label: 'Urban Population (%)', value: urban.population[yearIndex], trend: urban.population }],
      },
    };

    const currentPanel = panels[activePanel];
    const chartData = {
      labels: years,
      datasets: currentPanel.data.map((item, idx) => ({
        label: item.label,
        data: item.trend,
        fill: false,
        borderColor: ['#F87171', '#8B5CF6', '#10B981'][idx % 3],
        tension: 0.3,
        pointHitRadius: 10,
      })),
    };
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: 'white', boxWidth: 8, font: { size: isMobile ? 10 : 12 } } },
        title: { display: true, text: currentPanel.title + ' Trends', color: 'white', font: { size: isMobile ? 12 : 14 } },
        tooltip: { bodyFont: { size: isMobile ? 10 : 12 }, titleFont: { size: isMobile ? 10 : 12 } },
      },
      scales: {
        x: { ticks: { color: 'white', maxRotation: 0, autoSkip: true, autoSkipPadding: 10, font: { size: isMobile ? 9 : 11 } } },
        y: { ticks: { color: 'white', font: { size: isMobile ? 9 : 11 } } }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const clickedIndex = elements[0].index;
          setYearIndex(clickedIndex);
          openYearDataModal(name, years[clickedIndex]);
        }
      },
      onHover: (event, elements) => {
        try { if (event?.native?.target) event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'; } catch (e) {}
      },
    };

    return (
      <motion.div
        initial={{ x: isMobile ? 0 : '-100%', y: isMobile ? '100%' : 0, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        exit={{ x: isMobile ? 0 : '-100%', y: isMobile ? '100%' : 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={isMobile ? { left: 0, right: 0, bottom: 0, position: 'absolute' } : { left: `${climatePanelPosition.x}px`, top: `${climatePanelPosition.y}px`, position: 'absolute' }}
        className={`${isMobile
  ? 'inset-x-0 bottom-0 w-full max-h-[100vh] h-auto overflow-y-auto rounded-t-2xl bg-blue-950/95 pb-safe p-4'
  : 'w-[360px] rounded-xl bg-blue-950/85 p-4'}
  backdrop-blur-sm z-[99997]`}

        ref={climatePanelRef}
      >
        {/* Drag handle (hidden on mobile) */}
        {!isMobile && (
          <div
            className="w-full mb-2 pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => startDrag(e.clientX, e.clientY, 'climate')}
            onTouchStart={(e) => { if (e.touches?.length) { const t = e.touches[0]; startDrag(t.clientX, t.clientY, 'climate'); } }}
          >
            <div className="w-16 h-2 bg-gray-500 rounded-full" />
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-bold text-base sm:text-lg">
            {emoji} {name} —{' '}
            <button
              onClick={() => openYearDataModal(name, years[yearIndex])}
              className="inline-block text-white font-bold hover:underline"
              title={`View ${name} data for ${years[yearIndex]}`}
            >
              {years[yearIndex]}
            </button>
          </h3>
          <button onClick={() => setSelectedCountry(null)} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <div className="flex mb-3 flex-wrap gap-1 bg-gray-800 rounded-lg p-1">
          {Object.entries(panels).map(([key, panel]) => (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
              className={`flex-1 min-w-[90px] flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${activePanel === key ? `bg-gradient-to-r ${panel.color} text-white` : 'text-gray-300 bg-gray-700/60 hover:bg-gray-700'}`}
            >
              {panel.icon}<span className="hidden sm:inline">{panel.title}</span>
              <span className="sm:hidden">{panel.title.slice(0, 4)}</span>
            </button>
          ))}
        </div>

        <div className={`${isMobile ? 'h-32' : 'h-44'} mb-3`}>
          <Line data={chartData} options={chartOptions} />
          <div className="text-[10px] sm:text-xs text-white/70 mt-1 text-center">Tap points to open that year</div>
        </div>

        {currentPanel.data.map((item, idx) => (
          <div key={idx} className="bg-orange-500/80 rounded p-2 mt-2">
            <div className="text-xs sm:text-sm font-medium">{item.label}</div>
            <div className="text-base sm:text-lg font-bold">{Number(item.value).toFixed(2)}</div>
            <div className="w-full bg-black/30 rounded-full h-2 mt-1">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.abs(item.trend[yearIndex]) / Math.max(...item.trend.map(v => Math.abs(v))) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </motion.div>
    );
  };

  // Year Data Modal Component
  const YearDataModal = () => {
    if (!showYearModal || !selectedYearData) return null;

    const { country, year, data } = selectedYearData;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: isMobile ? 1 : 0.9, y: isMobile ? '100%' : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: isMobile ? 1 : 0.9, y: isMobile ? '100%' : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={isMobile ? { left: 0, right: 0, bottom: 0, position: 'absolute' } : { left: `${yearModalPosition.x}px`, top: `${yearModalPosition.y}px`, position: 'absolute' }}
          className={`${isMobile ? 'w-full max-h-[70vh]' : 'w-[500px] max-h-[600px]'} rounded-t-2xl sm:rounded-xl bg-gray-900/95 backdrop-blur-md border border-white/10 overflow-hidden z-[99999] shadow-2xl`}
        >
          {/* Header */}
          <div
            className={`w-full bg-gradient-to-r from-blue-900 to-purple-300 p-4 ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
            onMouseDown={(e) => !isMobile && startDrag(e.clientX, e.clientY, 'yearModal')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-1 bg-white/60 rounded-full" />
                <h3 className="text-white font-bold text-lg">{country} - {year}</h3>
              </div>
              <button onClick={() => setShowYearModal(false)} className="text-white/80 hover:text-white text-2xl font-bold transition-colors">×</button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[60vh] sm:max-h-[500px]">
            {data.climate && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <h4 className="text-white font-semibold text-lg">Climate Overview</h4>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{data.climate}</p>
                </div>
              </div>
            )}

            {data.deforestation && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 text-green-400 text-xl">🌳</div>
                  <h4 className="text-white font-semibold text-lg">Deforestation & Forest Cover</h4>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{data.deforestation}</p>
                </div>
              </div>
            )}

            {data.urban && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-semibold text-lg">Urban Development</h4>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{data.urban}</p>
                </div>
              </div>
            )}

            {!data.climate && !data.deforestation && !data.urban && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">📊</div>
                <p className="text-gray-400">No detailed data available for this year.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-800/50 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Source: Terra Earth Data Archive</span>
              <span>{isMobile ? 'Swipe down to close' : 'Drag to move • Click × to close'}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-gray-900 overflow-hidden flex items-center justify-center">
        <div className="text-white text-xl">Loading Terra Earth data...</div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Reset view', desc: 'Zoom out & stop panels', icon: <RotateCcw className="w-4 h-4" />, onRun: () => {
        setYearIndex(0); setSelectedCountry(null); setShowBookPanel(false); globeEl.current?.pointOfView({ altitude: 2.8 }, 900);
      }
    },
    { title: isPlaying ? 'Pause auto-rotate' : 'Play auto-rotate', desc: 'Toggle globe rotation', icon: <Play className="w-4 h-4" />, onRun: () => setIsPlaying(v => !v) },
    { title: 'Show info', desc: 'Open help panel', icon: <Info className="w-4 h-4" />, onRun: () => setShowInfo(true) },
    {
      title: 'Random country', desc: 'Jump & open story', icon: <Sparkles className="w-4 h-4" />, onRun: () => {
        const keys = Object.keys(countryData); const r = keys[Math.floor(Math.random() * keys.length)];
        jumpToCountry(r);
      }
    },
  ];

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <Navbar />

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        objectsData={markerData}
        objectThreeObject={createMarker}
        objectLat={(d) => d.lat}
        objectLng={(d) => d.lng}
        onObjectClick={handleMarkerClick}
        width={windowSize.width}
        height={windowSize.height}
        enablePointerInteraction
      />

      {/* LEFT / BOTTOM: Data Panel */}
      <AnimatePresence>{renderDataPanel()}</AnimatePresence>

      {/* Year Data Modal */}
      <YearDataModal />

      {/* RIGHT or BOTTOM: Book Panel */}
      <RightBookPanel
        open={showBookPanel}
        countryName={selectedCountry?.name}
        onClose={() => setShowBookPanel(false)}
        bookData={bookData}
        isMobile={isMobile}
      />

      {/* Control Bar */}
      <AnimatePresence>
        {showControlPanel && (
          <motion.div
            ref={controlRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={isMobile ? { left: 0, right: 0, bottom: 0, position: 'absolute' } : { left: panelPosition.x, top: panelPosition.y, position: 'absolute', width: 540 }}
            className={`pointer-events-auto ${isMobile ? 'bg-black/75 p-3 w-full rounded-t-2xl' : 'bg-black/90 p-4 w-[340px] rounded-xl'} backdrop-blur-md z-[99996]`}
          >
            {/* Drag zone (desktop only) */}
            {!isMobile && (
              <div
                className="w-full flex items-center justify-between cursor-grab mb-3"
                onMouseDown={(e) => startDrag(e.clientX, e.clientY, 'control')}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-2 bg-gray-600 rounded-full" />
                  <div className="w-8 h-2 bg-gray-600 rounded-full" />
                </div>
                <button onClick={() => setShowControlPanel(false)} className="text-gray-400 hover:text-white font-bold text-xl">×</button>
              </div>
            )}

            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsPlaying(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-white font-medium text-sm active:scale-[.98]"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isMobile ? '' : (isPlaying ? 'Pause' : 'Play')}
                </button>
                <button
                  onClick={() => { setYearIndex(0); setSelectedCountry(null); setShowBookPanel(false); globeEl.current?.pointOfView({ altitude: 2.6 }, 1000); }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium text-sm active:scale-[.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  {!isMobile && 'Reset'}
                </button>
              </div>
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20 active:scale-[.98]"
                title="Open command palette (⌘K / Ctrl+K)"
              >
                <Command className="w-4 h-4" />
                {!isMobile && 'Palette'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium hidden sm:inline">Year:</span>
              <input
                type="range"
                min="0"
                max={years.length - 1}
                value={yearIndex}
                onChange={(e) => setYearIndex(+e.target.value)}
                className="flex-1 accent-teal-500"
              />
              <button
                onClick={() => { if (selectedCountry) openYearDataModal(selectedCountry.name, years[yearIndex]); }}
                className="text-white text-lg font-bold min-w-[4rem]"
                title={selectedCountry ? `View ${selectedCountry.name} data for ${years[yearIndex]}` : `Set year to ${years[yearIndex]}`}
              >
                {years[yearIndex]}
              </button>
              <button onClick={() => setYearIndex(prev => Math.max(0, prev - 1))} disabled={yearIndex === 0} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold text-lg flex items-center justify-center">−</button>
              <button onClick={() => setYearIndex(prev => Math.min(years.length - 1, prev + 1))} disabled={yearIndex === years.length - 1} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold text-lg flex items-center justify-center">+</button>
            </div>

            {/* Quick year selection */}
            <div className="mt-2">
              <div className="text-white text-[11px] mb-1">Quick year selection (tap to view data)</div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {years.map((year, index) => (
                  <button
                    key={year}
                    onClick={() => { setYearIndex(index); if (selectedCountry) openYearDataModal(selectedCountry.name, year); }}
                    className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-all ${yearIndex === index ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`}
                    title={selectedCountry ? `View ${selectedCountry.name} data for ${year}` : `Set year to ${year}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={Object.keys(countryData)}
        onSelect={jumpToCountry}
        quickActions={quickActions}
      />

      {/* Hint chip (hide on mobile) */}
      {!isMobile && (
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-white/80 bg-white/10 px-2 py-1 rounded-md absolute top-4 left-4 z-[99994]">
          <Command className="w-3.5 h-3.5" /> K
          <span className="opacity-80">Open palette</span>
        </div>
      )}

      {/* Intro Info */}
      {showInfo && (
        <div className={`absolute z-[99995] bg-black/80 backdrop-blur-sm rounded-lg p-4 ${isMobile ? 'inset-x-0 bottom-0 w-full rounded-t-lg max-h-[60vh] overflow-y-auto' : 'top-4 right-4 max-w-sm'}`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-white font-bold text-lg">Terra Earth Explorer</h2>
            <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-white">×</button>
          </div>
          <p className="text-gray-300 text-sm mb-3">
            <strong>{isMobile ? 'Swipe & pinch' : 'Drag'}</strong> to rotate the Earth.<br />
            Tap a marker to open the country's storybook and see 25 years of data.<br />
            Tap chart points or year buttons to jump to specific years.<br />
            Tip: press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">⌘K</kbd> / <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Ctrl+K</kbd> to jump anywhere.
          </p>
          <div className="text-xs text-gray-400">Team CosmoMinds • Terra Data Visualization</div>
        </div>
      )}

      {/* Alerts */}
      <Alert
        isOpen={alert.open}
        type={alert.type}
        text={alert.text}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
        autoDismiss={alert.type === 'info' ? 0 : 2500}
        position="bottom-right"
      />
    </div>
  );
};

export default TerraEarthGame;
