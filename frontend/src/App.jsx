import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
// import Customers from './pages/Customers';
// import Products from './pages/Products';
// import Recommendations from './pages/Recommendations';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* <Route path="/customers" element={<Customers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/recommendations" element={<Recommendations />} /> */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
