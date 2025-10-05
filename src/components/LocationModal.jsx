import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Hook to load satellite data
const useSatelliteData = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ceres, aster, misr, modis] = await Promise.all([
          fetch('/datas/ceres.json').then(r => r.json()),
          fetch('/datas/aster.json').then(r => r.json()),
          fetch('/datas/misr.json').then(r => r.json()),
          fetch('/datas/modis.json').then(r => r.json())
        ]);
        setData({ ceres, aster, misr, modis });
      } catch (error) {
        console.error('Error loading satellite data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return { data, loading };
};

const DataModal = ({ isOpen, onClose, dataType, countryData }) => {
  const [selectedYear, setSelectedYear] = useState(2000);
  const [isPlaying, setIsPlaying] = useState(false);
  const years = Array.from({ length: 25 }, (_, i) => 2000 + i);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedYear(prev => {
        if (prev >= 2024) {
          setIsPlaying(false);
          return 2024;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // FIXED: getCurrentData function with proper ASTER data access
  const getCurrentData = () => {
    if (!countryData) return null;

    if (dataType === 'ceres') {
      return countryData.CERES?.radiation?.[`radiation_${selectedYear}`];
    } else if (dataType === 'modis') {
      return countryData.find(item => item.year === selectedYear);
    } else if (dataType === 'aster') {
      // CORRECTED: Access ASTER data structure properly
      return countryData.ASTER?.years?.[selectedYear.toString()];
    } else if (dataType === 'misr') {
      return countryData.MISR?.ndvi?.[`ndvi_${selectedYear}`];
    }
    return null;
  };

  const currentData = getCurrentData();

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex h-full">
        {/* Left Sidebar - Years */}
<div className="hidden md:block w-64 bg-slate-900 border-r border-slate-700 p-4 overflow-y-auto">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-white font-bold text-lg capitalize">{dataType}</h3>
    <button onClick={onClose} className="text-slate-400 hover:text-white">
      <X size={20} />
    </button>
  </div>

  <div className="space-y-2">
    {years.map(year => (
      <button
        key={year}
        onClick={() => setSelectedYear(year)}
        className={`w-full text-left p-3 rounded-lg transition-colors ${
          selectedYear === year
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        {year}
      </button>
    ))}
  </div>
</div>


        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-slate-800 border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{dataType.toUpperCase()} - {selectedYear}</h2>
                <p className="text-slate-400">Satellite Data Visualization</p>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedYear(Math.max(2000, selectedYear - 1))}
                  disabled={selectedYear <= 2000}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button
                  onClick={() => setSelectedYear(Math.min(2024, selectedYear + 1))}
                  disabled={selectedYear >= 2024}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
                >
                  <ChevronRight size={20} />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white ml-4"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Image Section */}
            <div className="w-1/2 bg-slate-900 p-6 flex items-center justify-center">
              {currentData?.Img || currentData?.img ? (
                <div className="max-w-full max-h-full">
                  <img
                    src={currentData.Img || currentData.img}
                    alt={`${dataType} ${selectedYear}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="text-slate-500 text-center">
                  <div className="w-64 h-64 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                    No image available
                  </div>
                  <p>Image data for {selectedYear} not found</p>
                </div>
              )}
            </div>

            {/* Data Section */}
            <div className="w-1/2 bg-slate-800 p-6 overflow-y-auto">
              {currentData ? (
                <div className="space-y-6">
                  {/* Stats/Terra Data */}
                  {currentData.stats && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3">Statistics</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Mean</span>
                          <div className="text-white font-mono">{currentData.stats.mean_w_m2} W/m²</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Min</span>
                          <div className="text-white font-mono">{currentData.stats.min_w_m2} W/m²</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Max</span>
                          <div className="text-white font-mono">{currentData.stats.max_w_m2} W/m²</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ASTER Data - NEW SECTION */}
                  {currentData.aster_data && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3">ASTER Data</h4>
                      <div className="space-y-2 text-sm">
                        {currentData.aster_data.mean_lst_anomaly_c !== undefined && (
                          <div>
                            <span className="text-slate-400">Mean LST Anomaly:</span>
                            <span className="text-white ml-2">{currentData.aster_data.mean_lst_anomaly_c}°C</span>
                          </div>
                        )}
                        {currentData.aster_data.max_lst_anomaly_c !== undefined && (
                          <div>
                            <span className="text-slate-400">Max LST Anomaly:</span>
                            <span className="text-white ml-2">{currentData.aster_data.max_lst_anomaly_c}°C</span>
                          </div>
                        )}
                        {currentData.aster_data.annual_deforestation_percent !== undefined && (
                          <div>
                            <span className="text-slate-400">Annual Deforestation:</span>
                            <span className="text-white ml-2">{currentData.aster_data.annual_deforestation_percent}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Terra Data */}
                  {currentData.terra_data && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3">Terra Data Insights</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-400">Sensor:</span>
                          <span className="text-white ml-2">{currentData.terra_data.sensor}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Average NDVI:</span>
                          <span className="text-white ml-2">{currentData.terra_data.average_ndvi}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Assessment:</span>
                          <span className="text-white ml-2">{currentData.terra_data.assessment}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {currentData.per_picture_info && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3">Description</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {currentData.per_picture_info}
                      </p>
                    </div>
                  )}

                  {/* Impact Context */}
                  {currentData.impact_context && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3">Impact Context</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {currentData.impact_context}
                      </p>
                    </div>
                  )}

                  {/* Community Impact Response - ASTER specific */}
                  {currentData.community_impact_response && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3">Community Impact & Response</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {currentData.community_impact_response}
                      </p>
                    </div>
                  )}

                  {/* Community Impact - Generic */}
                  {(currentData.community_impact || currentData.community_environmental_impact) && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3">Community Impact</h4>
                      <div className="text-slate-300 text-sm leading-relaxed">
                        {typeof (currentData.community_impact || currentData.community_environmental_impact) === 'string' ? (
                          <p>{currentData.community_impact || currentData.community_environmental_impact}</p>
                        ) : (
                          Object.entries(currentData.community_impact || currentData.community_environmental_impact).map(([key, value]) =>
                            value && (
                              <div key={key} className="mb-2">
                                <span className="text-slate-400 capitalize">{key.replace('_', ' ')}:</span>
                                <span className="ml-2">{value}</span>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Response Suggestions */}
                  {(currentData.our_response_suggestions || currentData.response_and_mitigation) && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3">Response & Mitigation</h4>
                      <div className="text-slate-300 text-sm">
                        {Array.isArray(currentData.our_response_suggestions) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {currentData.our_response_suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{currentData.response_and_mitigation || currentData.our_response_suggestions?.[0]}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-12">
                  <p>No data available for {selectedYear}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Control Panel */}
          <div className="bg-slate-800 border-t border-slate-700 p-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSelectedYear(2000)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                First
              </button>

              <button
                onClick={() => setSelectedYear(Math.max(2000, selectedYear - 1))}
                disabled={selectedYear <= 2000}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Year:</span>
                <span className="text-white font-bold text-lg">{selectedYear}</span>
              </div>

              <button
                onClick={() => setSelectedYear(Math.min(2024, selectedYear + 1))}
                disabled={selectedYear >= 2024}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm"
              >
                Next
              </button>

              <button
                onClick={() => setSelectedYear(2024)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function LocationModal({ location, isOpen, onClose }) {
  const panelRef = useRef(null);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState('');
  const { data: satelliteData, loading } = useSatelliteData();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && (dataModalOpen ? setDataModalOpen(false) : onClose?.());
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, dataModalOpen]);

  const openDataModal = (dataType) => {
    setSelectedDataType(dataType);
    setDataModalOpen(true);
  };

  const getCountryData = (dataType) => {
    if (!location?.name) return null;

    try {
      if (dataType === 'ceres') {
        return satelliteData.ceres?.[location.name];
      } else if (dataType === 'modis') {
        return satelliteData.modis?.countries?.[location.name];
      } else if (dataType === 'aster') {
        return satelliteData.aster?.[location.name];
      } else if (dataType === 'misr') {
        return satelliteData.misr?.[location.name];
      }
    } catch (error) {
      console.error(`Error loading ${dataType} data:`, error);
    }
    return null;
  };

  const getFirstImage = (dataType) => {
    const countryData = getCountryData(dataType);
    if (!countryData) {
      console.log(`No country data found for ${dataType}`);
      return '/placeholder-satellite.png';
    }

    console.log(`Getting first image for ${dataType}:`, countryData);

    try {
      if (dataType === 'ceres') {
        // CERES structure: country.CERES.radiation.radiation_2000.img
        const firstRadiation = countryData?.CERES?.radiation?.radiation_2000;
        console.log('CERES first radiation:', firstRadiation);
        return firstRadiation?.img || '/placeholder-satellite.png';
      } else if (dataType === 'modis') {
        // MODIS structure: array with first element having Img
        const firstItem = countryData?.[0];
        console.log('MODIS first item:', firstItem);
        return firstItem?.Img || '/placeholder-satellite.png';
      } else if (dataType === 'aster') {
        // ASTER structure: country.ASTER.years.2000.img
        const firstYear = countryData?.ASTER?.years?.['2000'];
        console.log('ASTER first year:', firstYear);
        return firstYear?.img || '/placeholder-satellite.png';
      } else if (dataType === 'misr') {
        // MISR structure: country.MISR.ndvi.ndvi_2000.img based on JSON structure
        console.log('MISR data structure:', countryData);
        const misrData = countryData?.MISR?.ndvi?.ndvi_2000;
        console.log('MISR ndvi_2000 data:', misrData);
        if (misrData?.img) {
          console.log('MISR image found:', misrData.img);
          return misrData.img;
        } else {
          console.log('MISR image not found, using placeholder');
          return '/placeholder-satellite.png';
        }
      }
    } catch (error) {
      console.error(`Error getting first image for ${dataType}:`, error);
    }
    return '/placeholder-satellite.png';
  };

  if (!isOpen || !location) return null;

  const dataTypes = ['ceres', 'aster', 'misr', 'modis'];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-modal="true"
        role="dialog"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          ref={panelRef}
          className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 m-4 max-w-4xl w-full border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto"
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{location.name}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-700 transition-colors duration-200 text-slate-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-600">
              <span className="text-slate-400 block">Latitude</span>
              <span className="text-white font-mono">{location.lat?.toFixed(4)}°</span>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-600">
              <span className="text-slate-400 block">Longitude</span>
              <span className="text-white font-mono">{location.lng?.toFixed(4)}°</span>
            </div>
          </div>

          {/* Satellite Data Section */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Satellite Data</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-white">Loading satellite data...</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dataTypes.map((dataType) => (
                  <div
                    key={dataType}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-600 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => openDataModal(dataType)}
                  >
                    <div className="aspect-square mb-3 bg-slate-700 rounded-lg overflow-hidden">
                      <img
                        src={getFirstImage(dataType)}
                        alt={`${dataType} preview`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-satellite.png';
                        }}
                      />
                    </div>
                    <h4 className="text-white font-semibold text-center uppercase tracking-wider">
                      {dataType}
                    </h4>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {/* <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-transform hover:scale-[1.02]">
              Connect
            </button> */}
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Data Modal */}
      <AnimatePresence>
        {dataModalOpen && (
          <DataModal
            isOpen={dataModalOpen}
            onClose={() => setDataModalOpen(false)}
            dataType={selectedDataType}
            countryData={getCountryData(selectedDataType)}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}