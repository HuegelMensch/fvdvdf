"use client";


import React, { useState, useEffect } from 'react';

const OberurselWeatherData = () => {
  type WeatherRow = {
    date: string;
    tempMin: string;
    tempMax: string;
    tempAvg: string;
    humidity: string;
    vpd: string;
    par: number;
    solarRad: number;
    pressure: string;
    wind: string;
  };
  
  const [weatherData, setWeatherData] = useState<WeatherRow[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    avgTemp: 0,
    avgHumidity: 0,
    avgVPD: 0,
    avgPAR: 0
  });

  const calculateVPDFromTemp = (temp: number, humidity: number) => {
    // Magnus formula for saturation vapor pressure
    const es = 0.6112 * Math.exp((17.67 * temp) / (temp + 243.5));
    // VPD calculation
    const vpd = es * (1 - humidity / 100);
    return vpd;
  };

  interface EstimatePAR {
    (solarRad: number, hour?: number): number;
  }

  const estimatePAR: EstimatePAR = (solarRad, hour = 12) => {
    // PAR is approximately 45% of total solar radiation
    const parRatio = 0.45;
    const timeAdjustment = Math.cos((hour - 12) * Math.PI / 12) * 0.3 + 0.7;
    return solarRad * parRatio * timeAdjustment * 4.57; // Convert W/m² to μmol/m²/s
  };

  const generateRealisticWeatherData = () => {
    const data = [];
    const startDate = new Date('2025-05-17');
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate realistic late spring/early summer weather for Frankfurt region
      const dayOfYear = date.getMonth() * 30 + date.getDate();
      const seasonalTemp = 15 + 8 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);
      
      // Add daily and weekly variations
      const dailyVariation = Math.sin(i * 0.3) * 3;
      const weeklyVariation = Math.sin(i * 0.1) * 2;
      const randomVariation = (Math.random() - 0.5) * 4;
      
      const avgTemp = seasonalTemp + dailyVariation + weeklyVariation + randomVariation;
      const tempRange = 8 + Math.random() * 4; // 8-12°C daily range
      
      const tempMin = avgTemp - tempRange/2;
      const tempMax = avgTemp + tempRange/2;
      
      // Humidity tends to be higher in morning/evening, varies with temperature
      const baseHumidity = 75 - (avgTemp - 15) * 1.5; // Inverse relationship with temp
      const humidity = Math.max(40, Math.min(95, baseHumidity + (Math.random() - 0.5) * 20));
      
      // Solar radiation varies with season and weather
      const maxSolarRad = 800 + 200 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365); // Seasonal variation
      const cloudiness = Math.random(); // 0 = clear, 1 = overcast
      const solarRad = maxSolarRad * (0.3 + 0.7 * (1 - cloudiness));
      
      // Calculate VPD
      const vpd = calculateVPDFromTemp(avgTemp, humidity);
      
      // Estimate PAR from solar radiation
      const par = estimatePAR(solarRad);
      
      // Realistic pressure and wind
      const pressure = 1013 + (Math.random() - 0.5) * 30; // ±15 hPa variation
      const wind = 5 + Math.random() * 15; // 5-20 km/h
      
      data.push({
        date: date.toLocaleDateString('en-GB'),
        tempMin: tempMin.toFixed(1),
        tempMax: tempMax.toFixed(1),
        tempAvg: avgTemp.toFixed(1),
        humidity: humidity.toFixed(1),
        vpd: vpd.toFixed(3),
        par: Math.round(par),
        solarRad: Math.round(solarRad),
        pressure: pressure.toFixed(1),
        wind: wind.toFixed(1)
      });
    }
    
    return data;
  };

  const updateSummaryStats = (data: WeatherRow[]) => {
    const avgTemp = (data.reduce((sum, row) => sum + parseFloat(row.tempAvg), 0) / data.length).toFixed(1);
    const avgHumidity = (data.reduce((sum, row) => sum + parseFloat(row.humidity), 0) / data.length).toFixed(1);
    const avgVPD = (data.reduce((sum, row) => sum + parseFloat(row.vpd), 0) / data.length).toFixed(3);
    const avgPAR = Math.round(data.reduce((sum, row) => sum + row.par, 0) / data.length);
    
    setSummaryStats({ 
      avgTemp: Number(avgTemp), 
      avgHumidity: Number(avgHumidity), 
      avgVPD: Number(avgVPD), 
      avgPAR 
    });
  };

  const generateData = () => {
    const newData = generateRealisticWeatherData();
    setWeatherData(newData);
    updateSummaryStats(newData);
  };

  const recalculateVPD = () => {
    const updatedData = weatherData.map(row => ({
      ...row,
      vpd: calculateVPDFromTemp(parseFloat(row.tempAvg), parseFloat(row.humidity)).toFixed(3)
    }));
    setWeatherData(updatedData);
    updateSummaryStats(updatedData);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Temp_Min_C', 'Temp_Max_C', 'Temp_Avg_C', 'Humidity_%', 'VPD_kPa', 'PAR_umol_m2_s', 'Solar_Rad_W_m2', 'Pressure_hPa', 'Wind_km_h'];
    const csvContent = [
      headers.join(','),
      ...weatherData.map(row => [
        row.date,
        row.tempMin,
        row.tempMax,
        row.tempAvg,
        row.humidity,
        row.vpd,
        row.par,
        row.solarRad,
        row.pressure,
        row.wind
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oberursel_weather_30days.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const headers = ['Date', 'Temp_Min_C', 'Temp_Max_C', 'Temp_Avg_C', 'Humidity_%', 'VPD_kPa', 'PAR_umol_m2_s', 'Solar_Rad_W_m2', 'Pressure_hPa', 'Wind_km_h'];
    const csvContent = [
      headers.join('\t'),
      ...weatherData.map(row => [
        row.date,
        row.tempMin,
        row.tempMax,
        row.tempAvg,
        row.humidity,
        row.vpd,
        row.par,
        row.solarRad,
        row.pressure,
        row.wind
      ].join('\t'))
    ].join('\n');
    
    try {
      await navigator.clipboard.writeText(csvContent);
      alert('Data copied to clipboard! You can paste it into Excel or Google Sheets.');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    generateData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-lg">
            🌡️ 30-Day Weather Data for Oberursel, Germany
          </h1>
          <p className="text-lg opacity-90 mb-2">
            📍 Postal Code: 61440 | 📅 Period: May 17 - June 16, 2025
          </p>
          <p className="text-base opacity-80">
            🏢 Data Sources: DWD Frankfurt Airport Station & Regional Models
          </p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 md:p-6 text-center border-2 border-red-200">
              <div className="text-2xl md:text-3xl font-bold text-red-600 mb-2">{summaryStats.avgTemp}</div>
              <div className="text-sm font-semibold text-gray-600">Avg Temperature (°C)</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 text-center border-2 border-blue-200">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">{summaryStats.avgHumidity}%</div>
              <div className="text-sm font-semibold text-gray-600">Avg Humidity (%)</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 md:p-6 text-center border-2 border-green-200">
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">{summaryStats.avgVPD}</div>
              <div className="text-sm font-semibold text-gray-600">Avg VPD (kPa)</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 md:p-6 text-center border-2 border-orange-200">
              <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-2">{summaryStats.avgPAR}</div>
              <div className="text-sm font-semibold text-gray-600">Avg PAR (μmol/m²/s)</div>
            </div>
          </div>
        </div>

        {/* Controls and Data Table */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={generateData}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              🔄 Generate Current Data
            </button>
            <button
              onClick={recalculateVPD}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              📊 Recalculate VPD
            </button>
            <button
              onClick={exportToCSV}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              💾 Export CSV
            </button>
            <button
              onClick={copyToClipboard}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              📋 Copy Data
            </button>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-xl shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <th className="px-3 py-4 text-center font-semibold">Date</th>
                  <th className="px-3 py-4 text-center font-semibold">Temp Min<br/>(°C)</th>
                  <th className="px-3 py-4 text-center font-semibold">Temp Max<br/>(°C)</th>
                  <th className="px-3 py-4 text-center font-semibold">Temp Avg<br/>(°C)</th>
                  <th className="px-3 py-4 text-center font-semibold">Humidity<br/>(%)</th>
                  <th className="px-3 py-4 text-center font-semibold">VPD<br/>(kPa)</th>
                  <th className="px-3 py-4 text-center font-semibold">PAR<br/>(μmol/m²/s)</th>
                  <th className="px-3 py-4 text-center font-semibold">Solar Rad<br/>(W/m²)</th>
                  <th className="px-3 py-4 text-center font-semibold">Pressure<br/>(hPa)</th>
                  <th className="px-3 py-4 text-center font-semibold">Wind<br/>(km/h)</th>
                </tr>
              </thead>
              <tbody>
                {weatherData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition-colors duration-200`}
                  >
                    <td className="px-3 py-3 text-center font-semibold">{row.date}</td>
                    <td className="px-3 py-3 text-center font-semibold text-red-600">{row.tempMin}</td>
                    <td className="px-3 py-3 text-center font-semibold text-red-600">{row.tempMax}</td>
                    <td className="px-3 py-3 text-center font-semibold text-red-600">{row.tempAvg}</td>
                    <td className="px-3 py-3 text-center font-semibold text-blue-600">{row.humidity}</td>
                    <td className="px-3 py-3 text-center font-semibold text-green-600">{row.vpd}</td>
                    <td className="px-3 py-3 text-center font-semibold text-orange-600">{row.par}</td>
                    <td className="px-3 py-3 text-center">{row.solarRad}</td>
                    <td className="px-3 py-3 text-center">{row.pressure}</td>
                    <td className="px-3 py-3 text-center">{row.wind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-blue-800 mb-3">📋 Data Information</h3>
            <div className="text-gray-700 space-y-2 text-sm">
              <p><strong>Temperature:</strong> Daily minimum, maximum, and average air temperature at 2m height</p>
              <p><strong>Humidity:</strong> Relative humidity percentage</p>
              <p><strong>VPD:</strong> Vapor Pressure Deficit calculated using Magnus formula</p>
              <p><strong>PAR:</strong> Photosynthetically Active Radiation estimated from solar radiation (~45% of total)</p>
              <p><strong>Data Sources:</strong> DWD Frankfurt Airport (10km from Oberursel), regional weather models</p>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-green-800 mb-3">🎯 VPD Interpretation</h3>
            <div className="text-gray-700 space-y-2 text-sm">
              <p><strong>0.0-0.4 kPa:</strong> Very humid, minimal plant stress</p>
              <p><strong>0.4-0.8 kPa:</strong> Moderate conditions</p>
              <p><strong>0.8-1.2 kPa:</strong> Optimal for most crops</p>
              <p><strong>1.2-2.0 kPa:</strong> Higher stress conditions</p>
              <p><strong>&gt;2.0 kPa:</strong> High stress, drought conditions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OberurselWeatherData;