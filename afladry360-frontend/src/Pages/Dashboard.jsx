import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Fan, Upload, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [fanSpeed, setFanSpeed] = useState(50);
  const [isFanOn, setIsFanOn] = useState(false);
  const [aflatoxinLevel, setAflatoxinLevel] = useState(12.5);
  const [currentTemp, setCurrentTemp] = useState(24.5);
  const [currentHumidity, setCurrentHumidity] = useState(65.2);
  const [isUploading, setIsUploading] = useState(false);

  // Sample data for humidity-temp graph
  const [sensorData, setSensorData] = useState([
    { time: '00:00', temperature: 22.1, humidity: 68.5 },
    { time: '02:00', temperature: 21.8, humidity: 70.2 },
    { time: '04:00', temperature: 23.2, humidity: 66.8 },
    { time: '06:00', temperature: 24.5, humidity: 65.2 },
    { time: '08:00', temperature: 26.1, humidity: 62.4 },
    { time: '10:00', temperature: 27.8, humidity: 59.1 },
    { time: '12:00', temperature: 28.9, humidity: 56.7 },
    { time: '14:00', temperature: 29.2, humidity: 55.3 },
    { time: '16:00', temperature: 28.4, humidity: 57.8 },
    { time: '18:00', temperature: 26.7, humidity: 61.2 },
    { time: '20:00', temperature: 25.1, humidity: 63.9 },
    { time: '22:00', temperature: 24.5, humidity: 65.2 }
  ]);

  // Simulate real-time data updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        const newTemp = 20 + Math.random() * 15;
        const newHumidity = 45 + Math.random() * 30;
        const newAflatoxin = 8 + Math.random() * 20;
        
        setCurrentTemp(parseFloat(newTemp.toFixed(1)));
        setCurrentHumidity(parseFloat(newHumidity.toFixed(1)));
        setAflatoxinLevel(parseFloat(newAflatoxin.toFixed(1)));

        // Update chart data
        setSensorData(prev => {
          const newData = [...prev.slice(1)];
          const now = new Date();
          const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0');
          
          newData.push({
            time: timeStr,
            temperature: newTemp,
            humidity: newHumidity
          });
          return newData;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleConnect = () => {
    setIsConnected(!isConnected);
  };

  const handleFanToggle = () => {
    setIsFanOn(!isFanOn);
  };

  const handleFanSpeedChange = (e) => {
    setFanSpeed(parseInt(e.target.value));
  };

  const handleUploadToBlockchain = async () => {
    setIsUploading(true);
    
    // Simulate blockchain upload
    setTimeout(() => {
      setIsUploading(false);
      alert('Data successfully uploaded to blockchain!');
    }, 2000);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AflaDry360 Dashboard</h1>
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
                  {isConnected ? 'Connected to Server' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={handleConnect}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isConnected 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Humidity-Temperature Graph */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Temperature & Humidity Trends</h2>
            <div className="h-80">
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
            </div>
          </div>

          {/* Right Column - Controls and Metrics */}
          <div className="space-y-6">
            
            {/* Current Readings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Current Readings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    <span className="text-gray-600">Temperature</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">{currentTemp}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-600">Humidity</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">{currentHumidity}%</span>
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
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      isFanOn 
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
                  <span className="text-xl font-bold text-gray-800">{aflatoxinLevel} ppb</span>
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
                disabled={!isConnected || isUploading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
              >
                <Upload className={`h-5 w-5 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>
                  {isUploading ? 'Uploading...' : 'Upload to Blockchain'}
                </span>
              </button>
              <div className="mt-2 text-sm text-gray-500 text-center">
                {!isConnected ? 'Connect to server first' : 'Secure data storage'}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;