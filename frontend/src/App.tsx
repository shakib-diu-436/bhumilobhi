import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import OwnerSearch from './pages/OwnerSearch';
import PlotDetails from './pages/PlotDetails';
import OwnershipHistory from './pages/OwnershipHistory';
import FraudAlerts from './pages/FraudAlerts';
import DeedVerification from './pages/DeedVerification';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/owners" element={<OwnerSearch />} />
          <Route path="/plots/:plotId" element={<PlotDetails />} />
          <Route path="/history/:plotId" element={<OwnershipHistory />} />
          <Route path="/fraud-alerts" element={<FraudAlerts />} />
          <Route path="/deed-verification" element={<DeedVerification />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
