import { useEffect, useState, useCallback } from 'react';
import { Command, Shuffle, Link as LinkIcon, XCircle } from 'lucide-react';
import LocationModal from '../components/LocationModal';
import GlobeComponent from '../components/GlobeComponent';
import CommandPalette from '../components/CommandPalette';
import Alert from '../components/Alert';
import Navbar from './Navbar';
import { generateStarsData, locations } from '../constants/locationsData';

const Hero = () => {
  // State Management
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [starsData, setStarsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success', text: '' });

  // Computed Values
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Utility Functions
  const showToast = useCallback((type, text, ms = 1800) => {
    setToast({ visible: true, type, text });
    if (ms > 0) {
      setTimeout(() => setToast(t => ({ ...t, visible: false })), ms);
    }
  }, []);

  // Event Handlers
  const handleLocationClick = useCallback((location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);

    const nextHash = `#loc=${encodeURIComponent(location.name)}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }

    showToast('success', `Opened ${location.name}`);
  }, [showToast]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedLocation(null), 250);

    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    );
  }, []);

  const handleSelectFromPalette = useCallback((name) => {
    const loc = locations.find(l => l.name === name);
    if (!loc) {
      return showToast('danger', `Location "${name}" not found`);
    }
    handleLocationClick(loc);
  }, [handleLocationClick, showToast]);

  const randomLocation = useCallback(() => {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    handleLocationClick(loc);
  }, [handleLocationClick]);

  const clearSelection = useCallback(() => {
    if (!selectedLocation) return;
    handleCloseModal();
    showToast('success', 'Cleared selection');
  }, [selectedLocation, handleCloseModal, showToast]);

  const shareCurrent = useCallback(async () => {
    try {
      if (!selectedLocation) {
        return showToast('danger', 'No location selected');
      }

      const url = `${window.location.origin}${window.location.pathname}#loc=${encodeURIComponent(selectedLocation.name)}`;
      await navigator.clipboard.writeText(url);
      showToast('success', 'Link copied!');
    } catch {
      showToast('danger', 'Copy failed');
    }
  }, [selectedLocation, showToast]);

  const quickActions = [
    {
      title: 'Random location',
      desc: 'Jump anywhere',
      icon: <Shuffle className="w-4 h-4" />,
      onRun: randomLocation
    },
    {
      title: selectedLocation ? `Share ${selectedLocation.name}` : 'Share current',
      desc: 'Copy deep-link',
      icon: <LinkIcon className="w-4 h-4" />,
      onRun: shareCurrent
    },
    {
      title: 'Clear selection',
      desc: 'Close details',
      icon: <XCircle className="w-4 h-4" />,
      onRun: clearSelection
    },
  ];

  // Window Resize Handler with RAF optimization
  useEffect(() => {
    let raf = null;

    const handleResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Initialize Stars Data and Loading State
  useEffect(() => {
    const starCount = prefersReducedMotion ? 800 : 2400;
    setStarsData(generateStarsData(starCount));

    const loadingDelay = prefersReducedMotion ? 400 : 900;
    const timer = setTimeout(() => setIsLoading(false), loadingDelay);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  // Deep-link Support: Parse URL hash for location
  useEffect(() => {
    const openFromHash = () => {
      const match = window.location.hash.match(/loc=([^&]+)/i);
      if (!match) return;

      const name = decodeURIComponent(match[1]).trim().toLowerCase();
      const loc = locations.find(l => l.name.toLowerCase() === name);

      if (loc) {
        setSelectedLocation(loc);
        setIsModalOpen(true);
      }
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);

    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isK = e.key.toLowerCase() === 'k';
      const cmdOrCtrl = e.metaKey || e.ctrlKey;

      if (cmdOrCtrl && isK) {
        e.preventDefault();
        setPaletteOpen(current => !current);
      }

      if (e.key === 'Escape') {
        setPaletteOpen(false);
        if (isModalOpen) {
          handleCloseModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, handleCloseModal]);

  // Loading State
  if (isLoading || dimensions.width === 0 || dimensions.height === 0) {
    return (
      <section
        className="fixed inset-0 w-screen h-screen flex justify-center items-center bg-[#0c0f1b] overflow-hidden"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -inset-32 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(59,130,246,.25),transparent_60%)]" />
        </div>

        <div className="flex flex-col items-center space-y-4">
          {!prefersReducedMotion ? (
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="w-12 h-12 border-4 border-blue-500/70 rounded-full" />
          )}
          <p className="text-white text-lg font-medium italic font-mono">
            Loading Global Network…
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <div>
        <Navbar />
      </div>

      <section className="fixed inset-0 min-w-screen min-h-screen flex justify-center items-center bg-[#0c0f1b] overflow-hidden">

        <GlobeComponent
          dimensions={dimensions}
          starsData={starsData}
          onLocationClick={handleLocationClick}
          // satellitePath="/nasa-eos-am-1terra-satellite/source/nasa_eos_am-1terra_satellite.glb"
          // albedoPath="/nasa-eos-am-1terra-satellite/textures/gltf_embedded_2.png"
          // emissivePath="/nasa-eos-am-1terra-satellite/textures/gltf_embedded_0.png"
          // satelliteScaleRatio={0.06}
          orbitalPeriodMs={14000}
          orbitInclinationDeg={35}
          // orbitRAANDeg={20}
          orbitAltitudeRatio={2.4}
        />

        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-teal-200 drop-shadow">
            Terra • Global Story & Data Explorer
          </h1>
          <p className="mt-2 text-slate-300/90 text-sm">
            Explore climate stories & urban heat across the world.
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-center">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-600 inline-flex items-center gap-3">
            <span className="text-slate-300 text-sm">
              🌍 Click locations or labels • 🖱️ Drag to rotate • 📌 Scroll to zoom
            </span>
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-white/90 bg-white/10 px-2 py-1 rounded-md">
              <Command className="w-3.5 h-3.5" /> K
              <span className="opacity-80">Open palette</span>
            </span>
          </div>
        </div>

        <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-200"
            title="Open command palette (⌘K / Ctrl+K)"
          >
            <Command className="w-4 h-4" /> Palette
          </button>

          {selectedLocation && (
            <button
              onClick={shareCurrent}
              className="text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-200"
              title={`Share ${selectedLocation.name}`}
            >
              <LinkIcon className="w-4 h-4" /> Share
            </button>
          )}
        </div>
      </section>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={locations.map(l => l.name)}
        onSelect={handleSelectFromPalette}
        quickActions={quickActions}
      />

      {toast.visible && (
        <Alert
          type={toast.type === 'danger' ? 'danger' : 'success'}
          text={toast.text}
        />
      )}

      <LocationModal
        location={selectedLocation}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default Hero;