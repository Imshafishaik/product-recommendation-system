import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useContext } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Transactions from './pages/Transactions';
import Recommendations from './pages/Recommendations';
import RFMSegmentation from './pages/RFMSegmentation';
import Retention from './pages/Retention';
import ModelEvaluation from './pages/ModelEvaluation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const PAGES = [
  { path: '/', element: <Dashboard /> },
  { path: '/customers', element: <Customers /> },
  { path: '/products', element: <Products /> },
  { path: '/transactions', element: <Transactions /> },
  { path: '/recommendations', element: <Recommendations /> },
  { path: '/rfm', element: <RFMSegmentation /> },
  { path: '/retention', element: <Retention /> },
  { path: '/evaluation', element: <ModelEvaluation /> },
];

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {PAGES.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute>
                    <Layout>{element}</Layout>
                  </ProtectedRoute>
                }
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
