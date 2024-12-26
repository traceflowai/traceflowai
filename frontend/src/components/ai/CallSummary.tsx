import { useState, useEffect, useCallback } from "react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../../constants";

interface CallSummaryProps {
  summary: string;
  transcript: string;
  keywords: string[];
  entities: string[];
  sentiment: "positive" | "neutral" | "negative";
  duration: string;
  timestamp: string;
  waveFileId: string;
}

const sentimentColors = {
  positive: "text-green-600",
  neutral: "text-gray-600",
  negative: "text-red-600",
};

export default function CallSummary({
  summary,
  transcript,
  keywords,
  entities,
  sentiment,
  duration,
  timestamp,
  waveFileId,
}: CallSummaryProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Memoize the audio file URL with a fallback
  const fetchAudioFile = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/files/${waveFileId}`,
        {
          method: "GET",
          mode: "cors",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch audio file");
      }

      // Read the response as a stream and convert it into a Blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioUrl) {
        setAudioUrl(audioUrl); // Assuming the response contains the audio URL or path
      } else {
        console.error("Failed to fetch audio file");
      }
    } catch (error) {
      console.error("Error fetching audio file:", error);
    }
  }, [waveFileId]);

  useEffect(() => {
    if (waveFileId) {
      fetchAudioFile();
    }
  }, [waveFileId, fetchAudioFile]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <ChatBubbleLeftIcon className="h-6 w-6 text-gray-400" />
        <h3 className="ml-2 text-lg font-medium text-gray-900">
          {showTranscript ? "Call Transcript" : "Call Summary"}
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mt-1 text-sm text-gray-900 text-right">
            {showTranscript ? transcript : summary}
          </p>
          <button
            className="mt-2 text-sm text-blue-600 hover:underline"
            onClick={() => setShowTranscript((prev) => !prev)}
          >
            {showTranscript ? "View Summary" : "View Transcript"}
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

        <div>
          <p className="text-sm text-gray-500 mb-2">Mentioned Entities</p>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity) => (
              <span
                key={entity}
                className="inline-flex items-center rounded-full bg-orange-200 px-2.5 py-0.5 text-xs font-medium text-red-900 hover:bg-blue-100"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Audio Playback</p>
          {audioUrl ? (
            <audio controls>
              <source src={audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            <p className="text-sm text-gray-500">Audio file is loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
