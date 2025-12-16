import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';

export default function TeachingGuide() {
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

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-100 p-4 rounded-full">
              <GraduationCap className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Teaching Guide
            </h1>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-6">
              Teaching materials and resources will be added here soon.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                Coming Soon
              </h2>
              <ul className="space-y-2 text-slate-600">
                <li>Lecture slides</li>
                <li>Exercise problems</li>
                <li>Code examples</li>
                <li>Video tutorials</li>
                <li>Course outlines</li>
              </ul>
            </div>

            <p className="text-slate-500 mt-6">
              This page will be populated with comprehensive teaching materials for instructors and students.
            </p>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}
