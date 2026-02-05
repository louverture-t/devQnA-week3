import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { questionsApi, getErrorMessage } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AskQuestionFormData {
  title: string;
  body: string;
}

interface FormErrors {
  title?: string;
  body?: string;
}

const AskQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AskQuestionFormData>({
    title: '',
    body: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Question body is required';
    } else if (formData.body.trim().length < 20) {
      newErrors.body = 'Please provide more details (at least 20 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear API error when user modifies form
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const question = await questionsApi.create({
        title: formData.title.trim(),
        body: formData.body.trim(),
      });

      // Success - redirect to the new question
      navigate(`/questions/${question.id}`);
    } catch (error) {
      setApiError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Ask a Question</CardTitle>
            <CardDescription>
              Get help from the developer community. Be specific and include all
              relevant details.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {apiError && (
                <Alert variant="destructive" data-testid="error-message">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              {/* Title field */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <p className="text-sm text-gray-500">
                  Write a clear, concise title that summarizes your question
                </p>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., How do I center a div with CSS flexbox?"
                  value={formData.title}
                  onChange={handleChange}
                  aria-label="Question title"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                  disabled={isLoading}
                />
                <div className="flex justify-between">
                  {errors.title ? (
                    <p id="title-error" className="text-sm text-red-600">
                      {errors.title}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm text-gray-400">
                    {formData.title.length}/200
                  </span>
                </div>
              </div>

              {/* Body field */}
              <div className="space-y-2">
                <Label htmlFor="body">Details</Label>
                <p className="text-sm text-gray-500">
                  Describe your problem in detail. Include code examples, error
                  messages, and what you've tried.
                </p>
                <Textarea
                  id="body"
                  name="body"
                  placeholder="Explain your question here...&#10;&#10;Include:&#10;- What you're trying to achieve&#10;- What you've tried so far&#10;- Any error messages you're seeing"
                  value={formData.body}
                  onChange={handleChange}
                  aria-label="Question details"
                  aria-invalid={!!errors.body}
                  aria-describedby={errors.body ? 'body-error' : undefined}
                  disabled={isLoading}
                  rows={8}
                />
                {errors.body && (
                  <p id="body-error" className="text-sm text-red-600">
                    {errors.body}
                  </p>
                )}
              </div>

              {/* Tips */}
              <div className="bg-primary-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Writing a good question</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Search to see if your question has been asked before</li>
                  <li>Be specific about what you need help with</li>
                  <li>Include relevant code, error messages, and context</li>
                  <li>Proofread before posting</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
              <Link to="/questions">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Posting...' : 'Post Question'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AskQuestion;
