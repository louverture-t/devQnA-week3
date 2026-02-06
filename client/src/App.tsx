import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import Questions from '@/pages/Questions';
import AskQuestion from '@/pages/AskQuestion';
import QuestionDetail from '@/pages/QuestionDetail';
import Users from '@/pages/Users';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/questions" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/users" element={<Users />} />
          <Route
            path="/questions/ask"
            element={
              <ProtectedRoute>
                <AskQuestion />
              </ProtectedRoute>
            }
          />
          <Route path="/questions/:id" element={<QuestionDetail />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
