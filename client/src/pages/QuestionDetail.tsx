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
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
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
        <Alert variant="destructive" data-testid="error-message">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link to="/questions">
            <Button variant="outline">Back to Questions</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (!question) {
    return (
      <Layout>
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Question not found</h2>
            <Link to="/questions">
              <Button>Back to Questions</Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back link */}
        <Link to="/questions" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Questions
        </Link>

        {/* Global error */}
        {error && (
          <Alert variant="destructive" data-testid="error-message">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Question Card */}
        <Card>
          <CardContent className="p-6">
            {isEditingQuestion ? (
              /* Edit Question Form */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={isSavingQuestion}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-body">Body</Label>
                  <Textarea
                    id="edit-body"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    disabled={isSavingQuestion}
                    rows={6}
                  />
                </div>
                {editError && (
                  <Alert variant="destructive">
                    <AlertDescription>{editError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSaveQuestion} disabled={isSavingQuestion}>
                    {isSavingQuestion ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={cancelEditingQuestion} disabled={isSavingQuestion}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Display Question */
              <>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h1 className="text-2xl font-bold text-gray-800">{question.title}</h1>
                  {isQuestionOwner && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={startEditingQuestion}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{question.body}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Asked by <span className="font-medium text-gray-700">{question.author?.username || 'Anonymous'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(question.createdAt)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Delete Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this question? This will also delete all answers. This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteQuestion} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Answers Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>

          {question.answers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No answers yet. Be the first to answer!
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Answer</CardTitle>
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
                />
                {answerError && (
                  <Alert variant="destructive">
                    <AlertDescription>{answerError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={isSubmittingAnswer}>
                  {isSubmittingAnswer ? 'Posting...' : 'Post Answer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link> to post an answer or vote.
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
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Voting */}
          <div className="flex flex-col items-center gap-1">
            {isAuthenticated ? (
              <button
                onClick={() => onVote('up')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  answer.userVote === 'up' ? 'text-green-600' : 'text-gray-400'
                }`}
                aria-label="Upvote"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
              </button>
            ) : (
              <div className="p-1 text-gray-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
              </div>
            )}
            <span className={`font-semibold ${voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {voteScore}
            </span>
            {isAuthenticated ? (
              <button
                onClick={() => onVote('down')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  answer.userVote === 'down' ? 'text-red-600' : 'text-gray-400'
                }`}
                aria-label="Downvote"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
              </button>
            ) : (
              <div className="p-1 text-gray-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Answer Content */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={editBody}
                  onChange={(e) => onEditBodyChange(e.target.value)}
                  disabled={isSaving}
                  rows={4}
                />
                {editError && (
                  <Alert variant="destructive">
                    <AlertDescription>{editError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{answer.body}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {answer.author?.username || 'Anonymous'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(answer.createdAt)}
                    </span>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={onStartEdit}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setShowDeleteConfirm(true)}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 mb-2">Delete this answer?</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => { onDelete(); setShowDeleteConfirm(false); }}>
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
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
