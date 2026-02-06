import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { questionsApi, getErrorMessage } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Question } from '@/types';

const Questions: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchQuestions = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await questionsApi.list({ page: pageNum, limit: 10 });
      setQuestions(response.items || []);
      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions(page);
  }, [page, fetchQuestions]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const truncateBody = (body: string, maxLength: number = 150): string => {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength).trim() + '...';
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          {/* Navigation */}
          <div className="glass p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Navigation
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/questions"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/20 transition-all"
                >
                  <span className="material-icons-outlined text-[20px]">explore</span>
                  <span className="font-medium">All Questions</span>
                </Link>
              </li>
              <li>
                <span className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/40 transition-all text-slate-600 cursor-pointer">
                  <span className="material-icons-outlined text-[20px]">trending_up</span>
                  <span>Popular</span>
                </span>
              </li>
              <li>
                <span className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/40 transition-all text-slate-600 cursor-pointer">
                  <span className="material-icons-outlined text-[20px]">stars</span>
                  <span>Unanswered</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Trending Tags */}
          <div className="glass p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {['#react', '#nodejs', '#javascript', '#typescript', '#express', '#css'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-semibold border border-sky-200 cursor-pointer hover:bg-sky-200 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="glass p-5 rounded-2xl">
            <p className="text-xs text-slate-500 text-center">
              &copy; 2026 DevQ&A. Built for developers by developers.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold editorial-title text-gray-800">Questions</h1>
              <p className="text-slate-500 mt-1">
                Browse and ask developer questions from the community
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  search
                </span>
                <input
                  className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-full glass border-white/40 focus:ring-primary-500 focus:border-primary-500 text-sm placeholder-slate-400"
                  placeholder="Search questions..."
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive" data-testid="error-message">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse rounded-3xl">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="hidden sm:flex flex-col items-center gap-4 w-16">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                        <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                      </div>
                      <div className="flex-grow space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : questions.length === 0 ? (
            /* Empty state */
            <Card className="rounded-3xl">
              <CardContent className="p-12 text-center">
                <span className="material-icons-outlined text-slate-300 mb-4" style={{ fontSize: '64px' }}>
                  help_outline
                </span>
                <h2 className="text-xl font-semibold text-gray-800 mb-2 editorial-title">
                  No questions yet
                </h2>
                <p className="text-gray-600 mb-6">Be the first to ask a question!</p>
                {isAuthenticated && (
                  <Link to="/questions/ask">
                    <Button>Ask the First Question</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Questions list */
            <div className="space-y-4">
              {questions.map((question) => (
                <Card
                  key={question.id}
                  className="p-6 rounded-3xl hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 border border-white/60 group editorial-fade"
                >
                  <CardContent className="p-0">
                    <div className="flex gap-6">
                      {/* Stats column */}
                      <div className="hidden sm:flex flex-col items-center gap-3 text-slate-400 group-hover:text-primary-500 transition-colors min-w-[52px]">
                        <div className="stat-block">
                          <span className="stat-value">
                            {(question as any).voteCount ?? 0}
                          </span>
                          <span className="stat-label">votes</span>
                        </div>
                        <div
                          className={`stat-block ${
                            (question as any).answerCount > 0 ? 'has-answers' : ''
                          }`}
                        >
                          <span className="stat-value">
                            {(question as any).answerCount ?? 0}
                          </span>
                          <span className="stat-label">answers</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow space-y-3">
                        <Link to={`/questions/${question.id}`}>
                          <h2 className="text-xl font-semibold text-gray-800 hover:text-primary-600 transition-colors editorial-title cursor-pointer">
                            {question.title}
                          </h2>
                        </Link>
                        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                          {truncateBody(question.body)}
                        </p>

                        {/* Footer: meta */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                          <div className="flex gap-2" />
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span className="material-icons-outlined text-sm">person</span>
                              <span className="hover:text-primary-500 cursor-pointer">
                                {question.user?.username || 'Anonymous'}
                              </span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-400" />
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span className="material-icons-outlined text-sm">schedule</span>
                              <span>{formatDate(question.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full px-6"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-slate-500 text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-full px-6"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Floating Ask Question button (desktop) */}
      {isAuthenticated && (
        <Link to="/questions/ask">
          <button className="hidden lg:flex fixed bottom-8 right-8 z-[60] items-center gap-3 pl-5 pr-6 py-4 bg-primary-500 text-white rounded-full shadow-2xl shadow-primary-500/40 hover:scale-105 active:scale-95 transition-all group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 blur-xl translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="material-icons-outlined font-bold relative z-10">add</span>
            <span className="font-bold relative z-10">Ask Question</span>
          </button>
        </Link>
      )}
    </Layout>
  );
};

export default Questions;
