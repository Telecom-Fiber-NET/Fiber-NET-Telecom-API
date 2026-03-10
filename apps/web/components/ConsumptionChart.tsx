import React, { useState } from "react";
import { Consumo } from "../types/api";

interface ConsumptionChartProps {
  history?: Consumo["history"];
  compact?: boolean;
}

const bytesToGB = (bytes: number) => {
  return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
};

const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ history, compact }) => {
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const [activePoint, setActivePoint] = useState<{
    label: string;
    download: number;
    upload: number;
  } | null>(null);

  const rawData = history?.[period] || [];

  const data = rawData
    .map((item: any) => ({
      label: period === "daily" ? item.data || "" : item.mes_ano || "",
      download: bytesToGB(item.download_bytes),
      upload: bytesToGB(item.upload_bytes),
    }))
    .reverse();

  const totalDownload = data.reduce((acc, curr) => acc + curr.download, 0);
  const totalUpload = data.reduce((acc, curr) => acc + curr.upload, 0);
  const totalConsumed = totalDownload + totalUpload;
  const avgConsumed = data.length > 0 ? totalConsumed / data.length : 0;
  const maxDownload = data.length > 0 ? Math.max(...data.map(d => d.download)) : 0;

  if (!history || data.length === 0) {
    return (
      <div className={`${compact ? 'h-48' : 'h-64'} flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-xl mt-6 border border-dashed border-gray-200 p-8 text-center`}>
        <i className="fas fa-chart-line text-4xl text-gray-300 mb-4"></i>
        <p className="font-medium text-gray-600">Histórico de consumo indisponível</p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d: any) => Math.max(d.download, d.upload)),
    1,
  );
  const width = 100,
    height = 100,
    padding = 10;

  const getX = (index: number) =>
    (index / (data.length - 1)) * (width - padding * 2) + padding;
  const getY = (value: number) =>
    height - padding - (value / maxVal) * (height - padding * 2);

  const getPath = (key: "download" | "upload") => {
    let d = `M ${getX(0)} ${getY(data[0][key])}`;
    for (let i = 1; i < data.length; i++)
      d += ` L ${getX(i)} ${getY(data[i][key])}`;
    return d;
  };

  const getAreaPath = (key: "download" | "upload") =>
    `${getPath(key)} L ${getX(data.length - 1)} ${height - padding} L ${getX(
      0,
    )} ${height - padding} Z`;

  return (
    <div className={`${compact ? '' : 'bg-white border border-gray-100 rounded-3xl p-6 mt-6 shadow-xl shadow-blue-900/5'} relative overflow-hidden`}>
      {/* Resumo de Consumo - Oculto em modo compact */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-cloud-download-alt text-connect-blue text-sm"></i>
              <p className="text-[10px] text-connect-blue uppercase font-black">Download</p>
            </div>
            <p className="text-xl font-black text-gray-800">
              {totalDownload.toFixed(1)} <span className="text-xs font-normal">GB</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-cloud-upload-alt text-green-600 text-sm"></i>
              <p className="text-[10px] text-green-600 uppercase font-black">Upload</p>
            </div>
            <p className="text-xl font-black text-gray-800">
              {totalUpload.toFixed(1)} <span className="text-xs font-normal">GB</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-exchange-alt text-orange-600 text-sm"></i>
              <p className="text-[10px] text-orange-600 uppercase font-black">Total</p>
            </div>
            <p className="text-xl font-black text-gray-800">
              {totalConsumed.toFixed(1)} <span className="text-xs font-normal">GB</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-history text-purple-600 text-sm"></i>
              <p className="text-[10px] text-purple-600 uppercase font-black">Média</p>
            </div>
            <p className="text-xl font-black text-gray-800">
              {avgConsumed.toFixed(1)} <span className="text-xs font-normal">GB</span>
            </p>
          </div>
        </div>
      )}

      {/* Cabeçalho e Seletor - Oculto em modo compact (já existe no pai do Dashboard) */}
      {!compact && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <i className="fas fa-chart-area text-connect-blue"></i>
              Tráfego de Dados
            </h3>
            <p className="text-xs text-gray-500">Acompanhe seu consumo de internet em tempo real.</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200 self-start md:self-auto">
            <button
              onClick={() => setPeriod("daily")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                period === "daily"
                  ? "bg-connect-blue text-white shadow-lg"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                period === "monthly"
                  ? "bg-connect-blue text-white shadow-lg"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Mensal
            </button>
          </div>
        </div>
      )}

      <div className={`${compact ? 'h-48' : 'h-64'} w-full relative group`}>
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-gray-400 font-mono pointer-events-none z-0">
          <span>{Math.round(maxVal)} GB</span>
          <span>{Math.round(maxVal / 2)} GB</span>
          <span>0 GB</span>
        </div>
        <div className="ml-8 h-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="gradDownload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0047BA" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0047BA" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradUpload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Grid Lines */}
            <line x1="10" y1="10" x2="90" y2="10" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="10" y1="90" x2="90" y2="90" stroke="#f3f4f6" strokeWidth="0.5" />

            <path
              d={getAreaPath("download")}
              fill="url(#gradDownload)"
              className="transition-all duration-700"
            />
            <path
              d={getPath("download")}
              fill="none"
              stroke="#0047BA"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700"
            />
            <path
              d={getAreaPath("upload")}
              fill="url(#gradUpload)"
              className="transition-all duration-700"
            />
            <path
              d={getPath("upload")}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700"
            />

            {data.map((d: any, i: number) => (
              <g key={i} className="group/point">
                <rect
                  x={getX(i) - 2}
                  y="0"
                  width="4"
                  height="100"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActivePoint(d)}
                  onMouseLeave={() => setActivePoint(null)}
                />
                <circle
                  cx={getX(i)}
                  cy={getY(d.download)}
                  r="1.5"
                  className="fill-[#0047BA] opacity-0 group-hover/point:opacity-100 transition-opacity"
                />
                <circle
                  cx={getX(i)}
                  cy={getY(d.upload)}
                  r="1.5"
                  className="fill-[#22c55e] opacity-0 group-hover/point:opacity-100 transition-opacity"
                />
              </g>
            ))}
          </svg>
        </div>
        <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-gray-400 font-bold px-2">
          <span>{data[0]?.label}</span>
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
        
        {activePoint && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-100 p-4 rounded-2xl shadow-2xl z-20 pointer-events-none animate-scaleIn border-t-4 border-t-connect-blue">
            <div className="text-xs font-black text-gray-800 mb-2 pb-1.5 border-b border-gray-100 uppercase tracking-wider">
              {activePoint.label}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-connect-blue shadow-sm shadow-blue-500/50"></span> Download
                </div>
                <div className="text-xs font-black text-connect-blue">{activePoint.download.toFixed(2)} GB</div>
              </div>
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span> Upload
                </div>
                <div className="text-xs font-black text-green-600">{activePoint.upload.toFixed(2)} GB</div>
              </div>
              <div className="pt-1.5 mt-1.5 border-t border-gray-50 flex items-center justify-between gap-8">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Consumo Total</div>
                <div className="text-xs font-black text-gray-800">{(activePoint.download + activePoint.upload).toFixed(2)} GB</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!compact && (
        <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-connect-blue shadow-lg shadow-blue-500/30"></div>
            <span className="text-[11px] text-gray-600 font-black uppercase tracking-wider">Download</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-50 shadow-lg shadow-green-500/30"></div>
            <span className="text-[11px] text-gray-600 font-black uppercase tracking-wider">Upload</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumptionChart;
