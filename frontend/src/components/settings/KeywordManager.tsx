import { EditIcon, PlusCircleIcon, TrashIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface KeywordManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Keyword {
  word: string;
  score: number;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({ isOpen, onClose }) => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newScore, setNewScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedKeywords, setEditedKeywords] = useState<Keyword[]>([]);

  const fetchKeywords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/badwords');
      if (response.ok) {
        const data = await response.json();
        const badwords = data.badwords
          .split('\n')
          .filter(Boolean)
          .map((line: string) => {
            const [word, score] = line.split(',');
            return { word, score: parseInt(score, 10) };
          });
        setKeywords(badwords);
        setEditedKeywords(badwords);
      } else {
        setError('Failed to fetch keywords');
      }
    } catch (error) {
      setError('Error fetching keywords');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeywords();
    }
  }, [isOpen]);

  const handleAddKeyword = async () => {
    if (newKeyword.trim() && !isNaN(newScore)) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/badwords/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_badwords: newKeyword.trim(), score: newScore }),
        });
        if (response.ok) {
          const newKeywordObj = { word: newKeyword.trim(), score: newScore };
          setKeywords((prev) => [...prev, newKeywordObj]);
          setEditedKeywords((prev) => [...prev, newKeywordObj]);
          setNewKeyword('');
          setNewScore(0);
        } else {
          setError('Failed to add keyword');
        }
      } catch (error) {
        setError('Error adding keyword');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateKeyword = async (index: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/badwords/update/${index + 1}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_badwords: editedKeywords[index].word,
          score: editedKeywords[index].score,
        }),
      });
      if (response.ok) {
        setKeywords([...editedKeywords]);
      } else {
        throw new Error('Failed to update keyword');
      }
    } catch (error) {
      setError('Error updating keyword');
      setEditedKeywords([...keywords]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeyword = async (index: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/badwords/delete/${index + 1}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setKeywords(keywords.filter((_, i) => i !== index));
        setEditedKeywords(editedKeywords.filter((_, i) => i !== index));
      } else {
        setError('Failed to delete keyword');
      }
    } catch (error) {
      setError('Error deleting keyword');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Keyword Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                <table className="min-w-full border dark:border-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 w-1/2 text-left">Bad Word</th>
                      <th className="px-6 py-3 w-1/4 text-left">Score</th>
                      <th className="px-6 py-3 w-1/4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {editedKeywords.map((keyword, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 w-1/2">
                          <input
                            type="text"
                            value={keyword.word}
                            onChange={(e) => {
                              const newKeywords = [...editedKeywords];
                              newKeywords[index] = { ...keyword, word: e.target.value };
                              setEditedKeywords(newKeywords);
                            }}
                            className="w-full px-3 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 w-1/4">
                          <input
                            type="number"
                            value={keyword.score}
                            onChange={(e) => {
                              const newKeywords = [...editedKeywords];
                              newKeywords[index] = { ...keyword, score: parseInt(e.target.value, 10) };
                              setEditedKeywords(newKeywords);
                            }}
                            className="w-24 px-3 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 w-1/4">
                          <div className="flex space-x-2">
                            <EditIcon
                              className="text-blue-500 cursor-pointer hover:text-blue-600"
                              onClick={() => handleUpdateKeyword(index)}
                            />
                            <TrashIcon
                              className="text-red-500 cursor-pointer hover:text-red-600"
                              onClick={() => handleDeleteKeyword(index)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="New keyword"
              className="flex-1 px-3 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newScore}
              onChange={(e) => setNewScore(parseInt(e.target.value, 10))}
              placeholder="Score"
              className="w-24 px-3 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <PlusCircleIcon
              className="text-green-500 cursor-pointer hover:text-green-600"
              onClick={handleAddKeyword}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordManager;
