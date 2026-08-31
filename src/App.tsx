import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import NavHeader from "./components/NavHeader";
import MinutesPage from "./pages/MinutesPage";
import WeeklyMissionsPage from "./pages/WeeklyMissionsPage";

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen">
        <NavHeader />
        <Routes>
          <Route path="/" element={<Navigate to="/minutes" replace />} />
          <Route path="/minutes" element={<MinutesPage />} />
          <Route path="/missions" element={<WeeklyMissionsPage />} />
          <Route path="*" element={<Navigate to="/minutes" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
