import { EditIcon, PlusCircleIcon, TrashIcon, SaveIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface KeywordManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Keyword {
  word: string;
  category: string;
  score: number;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({ isOpen, onClose }) => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newScore, setNewScore] = useState<number | ''>('');
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null); // Track which row is in edit mode

  const fetchKeywords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/badwords');
      if (!response.ok) throw new Error('Failed to fetch keywords');

      const data = await response.json();
      const badwords = data.badwords
        .split('\n')
        .filter(Boolean)
        .map((line: string) => {
          const [word, category, score] = line.split(',');
          return {
            word: word.trim(),
            category: category.trim(),
            score: parseInt(score.trim(), 10) || 0,
          };
        });
      setKeywords(badwords);
    } catch (err: any) {
      setError(err.message || 'Error fetching keywords');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchKeywords();
  }, [isOpen]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || isNaN(Number(newScore)) || !newCategory.trim()) {
      setError('All fields are required and score must be a valid number');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/badwords/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: newKeyword.trim(),
          category: newCategory.trim(),
          score: Number(newScore),
        }),
      });

      if (!response.ok) throw new Error('Failed to add keyword');

      setKeywords((prev) => [
        ...prev,
        { word: newKeyword.trim(), score: Number(newScore), category: newCategory.trim() },
      ]);
      setNewKeyword('');
      setNewScore('');
      setNewCategory('');
    } catch (err: any) {
      setError(err.message || 'Error adding keyword');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKeyword = async (index: number) => {
    const keywordToUpdate = keywords[index];
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/badwords/update/${index + 1}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'  // Add content-type header
        },
        body: JSON.stringify(keywordToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update keyword');
      }
    
      setEditIndex(null); // Exit edit mode on success
    } catch (err: any) {
      setError(err.message || 'Error updating keyword');
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

      if (!response.ok) throw new Error('Failed to delete keyword');

      setKeywords((prev) => prev.filter((_, i) => i !== index));
    } catch (err: any) {
      setError(err.message || 'Error deleting keyword');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, field: keyof Keyword, value: string | number) => {
    setKeywords((prev) =>
      prev.map((keyword, i) =>
        i === index ? { ...keyword, [field]: field === 'score' ? Number(value) : value } : keyword
      )
    );
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
          {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="min-w-full border dark:border-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Word</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Score</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {keywords.map((keyword, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2">
                      {editIndex === index ? (
                        <input
                          type="text"
                          value={keyword.word}
                          onChange={(e) => handleInputChange(index, 'word', e.target.value)}
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      ) : (
                        keyword.word
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editIndex === index ? (
                        <input
                          type="text"
                          value={keyword.category}
                          onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      ) : (
                        keyword.category
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editIndex === index ? (
                        <input
                          type="number"
                          value={keyword.score}
                          onChange={(e) => handleInputChange(index, 'score', e.target.value)}
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      ) : (
                        keyword.score
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex space-x-2">
                        {editIndex === index ? (
                          <SaveIcon
                            className="text-green-500 cursor-pointer hover:text-green-600"
                            onClick={() => handleUpdateKeyword(index)}
                          />
                        ) : (
                          <EditIcon
                            className="text-blue-500 cursor-pointer hover:text-blue-600"
                            onClick={() => setEditIndex(index)}
                          />
                        )}
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Word"
              className="w-28 px-2 py-1 border rounded-md"
            />
            <input
              type="number"
              value={newScore}
              onChange={(e) => setNewScore(Number(e.target.value) || '')}
              placeholder="Score"
              className="w-20 px-2 py-1 border rounded-md"
            />
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category"
              className="w-28 px-2 py-1 border rounded-md"
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
