import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { questionsApi, answersApi, votesApi, getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { QuestionDetail as QuestionDetailType, Answer } from '@/types';

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [question, setQuestion] = useState<QuestionDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Answer form state
  const [answerBody, setAnswerBody] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Edit question state
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editError, setEditError] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit answer state
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editAnswerBody, setEditAnswerBody] = useState('');
  const [editAnswerError, setEditAnswerError] = useState('');
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);

  const fetchQuestion = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await questionsApi.getById(parseInt(id, 10));
      setQuestion(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isQuestionOwner = isAuthenticated && user?.id === question?.author?.id;

  // Handle answer submission
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnswerError('');

    if (!answerBody.trim()) {
      setAnswerError('Answer cannot be empty');
      return;
    }

    if (answerBody.trim().length < 10) {
      setAnswerError('Answer must be at least 10 characters');
      return;
    }

    setIsSubmittingAnswer(true);

    try {
      await answersApi.create(parseInt(id!, 10), { body: answerBody.trim() });
      setAnswerBody('');
      await fetchQuestion(); // Refresh to show new answer
    } catch (err) {
      setAnswerError(getErrorMessage(err));
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Handle question edit
  const startEditingQuestion = () => {
    if (question) {
      setEditTitle(question.title);
      setEditBody(question.body);
      setIsEditingQuestion(true);
      setEditError('');
    }
  };

  const cancelEditingQuestion = () => {
    setIsEditingQuestion(false);
    setEditError('');
  };

  const handleSaveQuestion = async () => {
    setEditError('');

    if (!editTitle.trim()) {
      setEditError('Title cannot be empty');
      return;
    }

    if (!editBody.trim()) {
      setEditError('Body cannot be empty');
      return;
    }

    setIsSavingQuestion(true);

    try {
      await questionsApi.update(parseInt(id!, 10), {
        title: editTitle.trim(),
        body: editBody.trim(),
      });
      setIsEditingQuestion(false);
      await fetchQuestion();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Handle question delete
  const handleDeleteQuestion = async () => {
    setIsDeleting(true);

    try {
      await questionsApi.delete(parseInt(id!, 10));
      navigate('/questions');
    } catch (err) {
      setError(getErrorMessage(err));
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle answer edit
  const startEditingAnswer = (answer: Answer) => {
    setEditingAnswerId(answer.id);
    setEditAnswerBody(answer.body);
    setEditAnswerError('');
  };

  const cancelEditingAnswer = () => {
    setEditingAnswerId(null);
    setEditAnswerError('');
  };

  const handleSaveAnswer = async (answerId: number) => {
    setEditAnswerError('');

    if (!editAnswerBody.trim()) {
      setEditAnswerError('Answer cannot be empty');
      return;
    }

    setIsSavingAnswer(true);

    try {
      await answersApi.update(answerId, { body: editAnswerBody.trim() });
      setEditingAnswerId(null);
      await fetchQuestion();
    } catch (err) {
      setEditAnswerError(getErrorMessage(err));
    } finally {
      setIsSavingAnswer(false);
    }
  };

  // Handle answer delete
  const handleDeleteAnswer = async (answerId: number) => {
    try {
      await answersApi.delete(answerId);
      await fetchQuestion();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Handle voting
  const handleVote = async (answerId: number, type: 'up' | 'down') => {
    try {
      const response = await votesApi.vote(answerId, { type });
      // Update the answer in state with new vote counts
      setQuestion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) =>
            a.id === answerId
              ? { ...a, upvotes: response.upvotes, downvotes: response.downvotes, userVote: response.userVote }
              : a
          ),
        };
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 editorial-fade">
          <Card className="animate-pulse rounded-3xl">
            <CardContent className="p-8">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error && !question) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" data-testid="error-message">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link to="/questions">
              <Button variant="outline" className="rounded-full">
                <span className="material-icons-outlined text-sm mr-2">arrow_back</span>
                Back to Questions
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!question) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card className="rounded-3xl">
            <CardContent className="p-12 text-center">
              <span className="material-icons-outlined text-slate-300 mb-4" style={{ fontSize: '48px' }}>
                search_off
              </span>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 editorial-title">Question not found</h2>
              <Link to="/questions">
                <Button className="rounded-full mt-4">Back to Questions</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 editorial-fade">
        {/* Back link */}
        <Link
          to="/questions"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors text-sm font-medium group"
        >
          <span className="material-icons-outlined text-lg group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Back to Questions
        </Link>

        {/* Global error */}
        {error && (
          <Alert variant="destructive" data-testid="error-message">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Question Card */}
        <Card className="rounded-3xl border border-white/60 overflow-hidden">
          <CardContent className="p-8">
            {isEditingQuestion ? (
              /* Edit Question Form */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="font-semibold text-gray-700">Title</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={isSavingQuestion}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-body" className="font-semibold text-gray-700">Body</Label>
                  <Textarea
                    id="edit-body"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    disabled={isSavingQuestion}
                    rows={6}
                    className="rounded-xl"
                  />
                </div>
                {editError && (
                  <Alert variant="destructive">
                    <AlertDescription>{editError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSaveQuestion} disabled={isSavingQuestion} className="rounded-full">
                    {isSavingQuestion ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={cancelEditingQuestion} disabled={isSavingQuestion} className="rounded-full">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Display Question */
              <>
                <div className="flex justify-between items-start gap-4 mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 editorial-title leading-tight">
                    {question.title}
                  </h1>
                  {isQuestionOwner && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={startEditingQuestion} className="rounded-full">
                        <span className="material-icons-outlined text-sm mr-1">edit</span>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} className="rounded-full">
                        <span className="material-icons-outlined text-sm mr-1">delete</span>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px]">{question.body}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 pt-5 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-primary-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {question.author?.username?.slice(0, 2).toUpperCase() || 'AN'}
                    </div>
                    <span className="font-medium text-gray-700">
                      {question.author?.username || 'Anonymous'}
                    </span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons-outlined text-sm">schedule</span>
                    <span>{formatDate(question.createdAt)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md rounded-3xl editorial-fade border border-white/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-icons-outlined text-red-500">warning</span>
                  Delete Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Are you sure you want to delete this question? This will also delete all answers. This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="rounded-full">
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteQuestion} disabled={isDeleting} className="rounded-full">
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Answers Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 editorial-title flex items-center gap-2">
            <span className="material-icons-outlined text-primary-500">forum</span>
            {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>

          {question.answers.length === 0 ? (
            <Card className="rounded-3xl border border-white/60">
              <CardContent className="p-8 text-center text-gray-500">
                <span className="material-icons-outlined text-4xl text-slate-300 mb-3 block">chat_bubble_outline</span>
                <p>No answers yet. Be the first to answer!</p>
              </CardContent>
            </Card>
          ) : (
            question.answers.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                isOwner={isAuthenticated && user?.id === answer.author?.id}
                isAuthenticated={isAuthenticated}
                isEditing={editingAnswerId === answer.id}
                editBody={editAnswerBody}
                editError={editAnswerError}
                isSaving={isSavingAnswer}
                onEditBodyChange={setEditAnswerBody}
                onStartEdit={() => startEditingAnswer(answer)}
                onCancelEdit={cancelEditingAnswer}
                onSave={() => handleSaveAnswer(answer.id)}
                onDelete={() => handleDeleteAnswer(answer.id)}
                onVote={(type) => handleVote(answer.id, type)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>

        {/* Post Answer Form */}
        {isAuthenticated ? (
          <Card className="rounded-3xl border border-white/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="material-icons-outlined text-primary-500">edit_note</span>
                Your Answer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <Textarea
                  placeholder="Write your answer here..."
                  value={answerBody}
                  onChange={(e) => {
                    setAnswerBody(e.target.value);
                    if (answerError) setAnswerError('');
                  }}
                  disabled={isSubmittingAnswer}
                  rows={6}
                  aria-label="Your answer"
                  className="rounded-xl"
                />
                {answerError && (
                  <Alert variant="destructive">
                    <AlertDescription>{answerError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={isSubmittingAnswer} className="rounded-full">
                  {isSubmittingAnswer ? 'Posting...' : 'Post Answer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl border border-white/60">
            <CardContent className="p-8 text-center">
              <span className="material-icons-outlined text-4xl text-slate-300 mb-3 block">lock</span>
              <p className="text-gray-500">
                <Link to="/login" className="text-primary-600 hover:underline font-semibold">Sign in</Link> to post an answer or vote.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

// Answer Card Component
interface AnswerCardProps {
  answer: Answer;
  isOwner: boolean;
  isAuthenticated: boolean;
  isEditing: boolean;
  editBody: string;
  editError: string;
  isSaving: boolean;
  onEditBodyChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onVote: (type: 'up' | 'down') => void;
  formatDate: (date: string) => string;
}

const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  isOwner,
  isAuthenticated,
  isEditing,
  editBody,
  editError,
  isSaving,
  onEditBodyChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onVote,
  formatDate,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const voteScore = (answer.upvotes || 0) - (answer.downvotes || 0);

  return (
    <Card className="rounded-3xl border border-white/60">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Voting */}
          <div className="flex flex-col items-center gap-0.5">
            {isAuthenticated ? (
              <button
                onClick={() => onVote('up')}
                className={`p-1.5 rounded-lg transition-colors ${
                  answer.userVote === 'up'
                    ? 'text-green-600 bg-green-50'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
                aria-label="Upvote"
              >
                <span className="material-icons-outlined text-xl">expand_less</span>
              </button>
            ) : (
              <div className="p-1.5 text-slate-300">
                <span className="material-icons-outlined text-xl">expand_less</span>
              </div>
            )}
            <span className={`font-bold text-sm ${voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-500' : 'text-slate-500'}`}>
              {voteScore}
            </span>
            {isAuthenticated ? (
              <button
                onClick={() => onVote('down')}
                className={`p-1.5 rounded-lg transition-colors ${
                  answer.userVote === 'down'
                    ? 'text-red-500 bg-red-50'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
                aria-label="Downvote"
              >
                <span className="material-icons-outlined text-xl">expand_more</span>
              </button>
            ) : (
              <div className="p-1.5 text-slate-300">
                <span className="material-icons-outlined text-xl">expand_more</span>
              </div>
            )}
          </div>

          {/* Answer Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={editBody}
                  onChange={(e) => onEditBodyChange(e.target.value)}
                  disabled={isSaving}
                  rows={4}
                  className="rounded-xl"
                />
                {editError && (
                  <Alert variant="destructive">
                    <AlertDescription>{editError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSave} disabled={isSaving} className="rounded-full">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={isSaving} className="rounded-full">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-700 whitespace-pre-wrap mb-4 leading-relaxed text-[15px]">{answer.body}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-[9px] font-bold text-white">
                        {answer.author?.username?.slice(0, 2).toUpperCase() || 'AN'}
                      </div>
                      <span className="font-medium text-gray-700">{answer.author?.username || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-icons-outlined text-sm">schedule</span>
                      <span>{formatDate(answer.createdAt)}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={onStartEdit} className="rounded-full text-slate-500 hover:text-primary-600">
                        <span className="material-icons-outlined text-sm mr-1">edit</span>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>
                        <span className="material-icons-outlined text-sm mr-1">delete</span>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-50/80 rounded-2xl border border-red-200/60">
                <p className="text-sm text-red-800 mb-3 font-medium">Delete this answer?</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="rounded-full" onClick={() => { onDelete(); setShowDeleteConfirm(false); }}>
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionDetail;
