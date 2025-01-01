import { useMemo } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/solid';

interface RiskPredictionProps {
  riskScore: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
}

export default function RiskPrediction({ riskScore, factors }: RiskPredictionProps) {
  const riskLevel = useMemo(() => {
    if (riskScore >= 70) return { level: 'High', color: 'text-red-600' };
    if (riskScore >= 30) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  }, [riskScore]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
      
      <div className="flex items-center mb-6">
        <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={riskScore >= 70 ? '#DC2626' : riskScore >= 30 ? '#D97706' : '#059669'}
            strokeWidth="3"
            strokeDasharray={`${riskScore}, 100`}
          />
          <text x="18" y="20.35" className="text-xs font-bold" textAnchor="middle"> {/* Reduced font size */}
            {riskScore}%
          </text>
        </svg>
        </div>
        
        <div className="ml-6">
          <p className="text-sm text-gray-500">Risk Level</p>
          <p className={`text-2xl font-bold ${riskLevel.color}`}>
            {riskLevel.level}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Contributing Factors</h4>
        {factors.map((factor) => (
          <div key={factor.name} className="flex items-start">
            <ArrowUpIcon
              className="h-5 w-5 text-gray-400 mt-0.5"
              aria-hidden="true"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{factor.name}</p>
              <p className="text-sm text-gray-500">{factor.description}</p>
            </div>
            <span className="ml-auto text-sm font-medium text-gray-900">
              +{factor.impact}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}