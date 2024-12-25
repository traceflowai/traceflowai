import { useState } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface CallSummaryProps {
  summary: string;
  transcript: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  duration: string;
  timestamp: string;
}

const sentimentColors = {
  positive: 'text-green-600',
  neutral: 'text-gray-600',
  negative: 'text-red-600',
};

export default function CallSummary({
  summary,
  transcript,
  keywords,
  sentiment,
  duration,
  timestamp,
}: CallSummaryProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <ChatBubbleLeftIcon className="h-6 w-6 text-gray-400" />
        <h3 className="ml-2 text-lg font-medium text-gray-900">
          {showTranscript ? 'Call Transcript' : 'Call Summary'}
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mt-1 text-sm text-gray-900 text-right">
            {showTranscript ? transcript : summary}
          </p>
          <button
            className="mt-2 text-sm text-blue-600 hover:underline"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            {showTranscript ? 'View Summary' : 'View Transcript'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="text-sm font-medium text-gray-900">{duration}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sentiment</p>
            <p className={`text-sm font-medium ${sentimentColors[sentiment]}`}>
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="text-sm font-medium text-gray-900">{timestamp}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Flagged Keywords</p>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
