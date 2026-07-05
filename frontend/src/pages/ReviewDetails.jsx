import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import ReviewResult from '../components/ReviewResult';
import { ArrowLeft, Download, FileJson } from 'lucide-react';
import Editor from '@monaco-editor/react';

const ReviewDetails = () => {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await api.get(`/history/${id}`);
        setReview(res.data);
      } catch (err) {
        console.error("Failed to load review details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [id]);

  const handleDownload = async (type) => {
    try {
      const endpoint = type === 'pdf' ? `/report/pdf/${id}` : `/report/json/${id}`;
      const res = await api.get(endpoint, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `code_review_${id}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Failed to download ${type}`, err);
      alert(`Could not download ${type.toUpperCase()} report.`);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading details...</div>;
  if (!review) return <div className="text-center py-12 text-red-500">Failed to load or review not found.</div>;

  return (
    <div className="py-6">
      <div className="mb-6 flex justify-between items-end flex-wrap gap-4">
        <div>
          <Link to="/history" className="text-blue-400 hover:text-blue-300 flex items-center mb-4 transition w-fit group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" /> Back to History
          </Link>
          <div className="flex items-end gap-3">
            <h1 className="text-2xl font-bold">Review Details <span className="text-gray-500 text-lg">#{review.id}</span></h1>
            <span className="text-gray-400 text-sm mb-1">{new Date(review.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleDownload('json')} className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm transition">
            <FileJson className="w-4 h-4 mr-2 text-yellow-400" /> Export JSON
          </button>
          <button onClick={() => handleDownload('pdf')} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition font-medium">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="w-full h-full min-h-[600px] border border-gray-700 rounded-xl overflow-hidden shadow-xl bg-gray-800 flex flex-col">
          <div className="bg-gray-900 border-b border-gray-700 p-3 text-sm font-semibold text-gray-300">
            Original Source Code ({review.language})
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={review.language.toLowerCase()}
              theme="vs-dark"
              value={review.source_code}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
              }}
            />
          </div>
        </div>

        <div className="xl:h-[700px] xl:overflow-y-auto pr-2 custom-scrollbar">
          <ReviewResult 
            result={review.review_result} 
            language={review.language} 
            score={review.overall_score} 
            risk={review.risk_level}
            sourceCode={review.source_code}
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewDetails;
