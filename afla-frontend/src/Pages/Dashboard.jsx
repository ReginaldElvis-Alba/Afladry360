import { useState, useEffect } from 'react';
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Fan, Upload, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fanSpeed, setFanSpeed] = useState(50);
  const [isFanOn, setIsFanOn] = useState(false);
  const [aflatoxinLevel, setAflatoxinLevel] = useState(0);
  const [currentTemp, setCurrentTemp] = useState(0);
  const [currentHumidity, setCurrentHumidity] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [sensorData, setSensorData] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);

  // Function to fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/all-data`);
      const data = response.data;

      if (data && data.length > 0) {
        const processedData = data.map(item => {
          const createdAt = new Date(item.createdAt); // use DB timestamp
          const timeStr = createdAt.getHours().toString().padStart(2, '0') + ':' +
            createdAt.getMinutes().toString().padStart(2, '0');

          // Combine channels into spectral array
          const spectral = [
            item.ch0, item.ch1, item.ch2, item.ch3, item.ch4, item.ch5,
            item.ch6, item.ch7, item.ch8, item.ch9, item.ch10
          ].map(v => parseInt(v) || 0);

          return {
            time: timeStr,
            temperature: parseFloat(item.temperature),
            humidity: parseFloat(item.humidity),
            moisture_content: item.moisture_content ? parseFloat(item.moisture_content) * 100 : null,
            spectral_data: spectral,
            timestamp: createdAt
          };
        });

        processedData.sort((a, b) => a.timestamp - b.timestamp);
        setSensorData(processedData.slice(-20));

        const latestReading = processedData[processedData.length - 1];
        if (latestReading) {
          setCurrentTemp(latestReading.temperature);
          setCurrentHumidity(latestReading.humidity);
          const aflatoxin = calculateAflatoxinLevel(latestReading.temperature, latestReading.humidity);
          setAflatoxinLevel(parseFloat(aflatoxin.toFixed(1)));
        }

        setLastFetch(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };


  // Calculate aflatoxin level based on temperature and humidity
  const calculateAflatoxinLevel = (temp, humidity) => {
    // This is a simplified calculation - replace with your actual formula
    // Higher temperature and humidity generally increase aflatoxin risk
    const tempFactor = Math.max(0, (temp - 20) / 5);
    const humidityFactor = Math.max(0, (humidity - 60) / 10);
    return Math.min(30, tempFactor * humidityFactor * 8);
  };

  // Auto-refresh data when connected
  useEffect(() => {
    let interval;
    if (isConnected) {
      // Fetch data immediately when connected
      fetchData().catch(console.error);

      // Set up auto-refresh every 30 seconds
      interval = setInterval(() => {
        fetchData().catch(console.error);
      }, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected]);

  const handleConnect = async () => {
    if (!isConnected) {
      setIsLoading(true);
      try {
        await fetchData();
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect:', error);
        alert('Failed to connect to server. Please check your connection.');
      }
      setIsLoading(false);
    } else {
      setIsConnected(false);
      setSensorData([]);
      setLastFetch(null);
      setCurrentTemp(0);
      setCurrentHumidity(0);
      setAflatoxinLevel(0);
    }
  };

  const handleFanToggle = () => {
    setIsFanOn(!isFanOn);
  };

  const handleFanSpeedChange = (e) => {
    setFanSpeed(parseInt(e.target.value));
  };

  const handleUploadToBlockchain = async () => {
    if (!isConnected || sensorData.length === 0) {
      alert('No data available to upload. Please connect and fetch data first.');
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/upload-to-blockchain`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        alert(JSON.stringify(data.response));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Blockchain upload failed:', error);
      alert('Failed to upload to blockchain. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getAflatoxinStatus = () => {
    if (aflatoxinLevel < 10) return { status: 'Safe', color: 'text-green-600', bg: 'bg-green-100' };
    if (aflatoxinLevel < 20) return { status: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'High Risk', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const aflatoxinStatus = getAflatoxinStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IoT Dashboard</h1>
          <p className="text-gray-600">Real-time environmental monitoring and control system</p>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isConnected ? (
                  <Wifi className="h-6 w-6 text-green-500" />
                ) : (
                  <WifiOff className="h-6 w-6 text-red-500" />
                )}
                <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected to AflaDry360' : 'Disconnected'}
                </span>
                {isLoading && (
                  <span className="text-sm text-gray-500 animate-pulse">Loading...</span>
                )}
              </div>
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${isConnected
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
              >
                {isLoading ? 'Connecting...' : (isConnected ? 'Disconnect' : 'Connect')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Humidity-Temperature Graph */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Temperature & Humidity Trends</h2>
              <div className="h-80">
                {sensorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Temperature (°C)"
                      />
                      <Line
                        type="monotone"
                        dataKey="humidity"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Humidity (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {isConnected ? 'Loading data...' : 'Connect to view real-time data'}
                  </div>
                )}
              </div>
            </div>
            {/* Moisture Content Graph */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Moisture Content (%)</h2>
              <div className="h-80">
                {sensorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="moisture_content"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Moisture Content (%)"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {isConnected ? 'Loading data...' : 'Connect to view moisture content'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Spectral Data Graph */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Spectral Intensity (AS7341)</h2>
            <p className="text-sm text-gray-500 mb-2">
              Tracking spectral reflectance — wavelengths near <strong>365 nm</strong> and <strong>630–670 nm</strong> are most sensitive to aflatoxin presence.
            </p>
            <div className="h-96">
              {sensorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {/* Emphasize aflatoxin-sensitive wavelengths (Ch4 ~ 365 nm, Ch9 ~ 660 nm) */}
                    <Line type="monotone" dataKey="spectral_data[4]" stroke="#f59e0b" strokeWidth={2} name="Ch4 (~365 nm)" dot={false} />
                    <Line type="monotone" dataKey="spectral_data[9]" stroke="#dc2626" strokeWidth={2} name="Ch9 (~660 nm)" dot={false} />
                    {/* Add optional reference channels for context */}
                    <Line type="monotone" dataKey="spectral_data[3]" stroke="#6366f1" strokeWidth={1} name="Ch3 (~340 nm)" dot={false} />
                    <Line type="monotone" dataKey="spectral_data[6]" stroke="#10b981" strokeWidth={1} name="Ch6 (~550 nm)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {isConnected ? 'Loading spectral data...' : 'Connect to view spectral data'}
                </div>
              )}
            </div>
          </div>


          {/* Right Column - Controls and Metrics */}
          <div className="space-y-6">

            {/* Current Readings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Current Readings</h3>
                <button
                  onClick={fetchData}
                  disabled={!isConnected || isLoading}
                  className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    <span className="text-gray-600">Temperature</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">
                    {isConnected && currentTemp > 0 ? `${currentTemp}°C` : '--°C'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-600">Humidity</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">
                    {isConnected && currentHumidity > 0 ? `${currentHumidity}%` : '--%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fan Control */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Fan Control</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Fan className={`h-5 w-5 ${isFanOn ? 'text-green-500 animate-spin' : 'text-gray-400'}`} />
                    <span className="text-gray-600">Fan Status</span>
                  </div>
                  <button
                    onClick={handleFanToggle}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${isFanOn
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                      }`}
                  >
                    {isFanOn ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speed</span>
                    <span className="text-sm font-medium">{fanSpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fanSpeed}
                    onChange={handleFanSpeedChange}
                    disabled={!isFanOn}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Aflatoxin Levels */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Aflatoxin Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Level</span>
                  <span className="text-xl font-bold text-gray-800">
                    {isConnected && aflatoxinLevel > 0 ? `${aflatoxinLevel} ppb` : '-- ppb'}
                  </span>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-md ${aflatoxinStatus.bg}`}>
                  <AlertTriangle className={`h-4 w-4 ${aflatoxinStatus.color}`} />
                  <span className={`font-medium ${aflatoxinStatus.color}`}>
                    {aflatoxinStatus.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Safe: &lt;10 ppb | Moderate: 10-20 ppb | High: &gt;20 ppb
                </div>
              </div>
            </div>

            {/* Blockchain Upload */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Data Management</h3>
              <button
                onClick={handleUploadToBlockchain}
                disabled={!isConnected || isUploading || sensorData.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
              >
                <Upload className={`h-5 w-5 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>
                  {isUploading ? 'Uploading...' : 'Upload to Blockchain'}
                </span>
              </button>

              <div className="mt-2 text-sm text-gray-500 text-center">
                {!isConnected ? 'Connect to server first' :
                  sensorData.length === 0 ? 'No data available' : 'Secure data storage'}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          {lastFetch ? (
            `Last data fetch: ${lastFetch.toLocaleString()}`
          ) : (
            `Dashboard initialized: ${new Date().toLocaleString()}`
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;