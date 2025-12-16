import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';

export default function ReadOnline() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-6 rounded-full">
              <BookOpen className="w-16 h-16 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Read Online
          </h1>
          <p className="text-lg text-slate-600 mb-6">
            The online reading version will be available soon.
          </p>
          <p className="text-slate-500">
            This page will link to a dedicated GitHub page for reading the full book online.
          </p>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}
