import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import HomePage from './pages/home/HomePage'
import HireLawyerPage from './pages/features/HireLawyerPage'
import FreeConsultationPage from './pages/features/FreeConsultationPage'
import PenalCodeSearchPage from './pages/features/PenalCodeSearchPage'
import SanctionsCheckerPage from './pages/features/SanctionsCheckerPage'
import ContractReviewPage from './pages/features/ContractReviewPage'
import ArbitrationFilingPage from './pages/features/ArbitrationFilingPage'
import StatuteSearchPage from './pages/features/StatuteSearchPage'
import DocumentDrafterPage from './pages/features/DocumentDrafterPage'
import UserPanel from './admin/userPanel/UserPanel'
import Dashboard from './admin/Dashboard'
// import AdvokateChat from './components/chat/AdvokateChat'

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/features/hire-lawyer" element={<HireLawyerPage />} />
      <Route path="/features/free-consultation" element={<FreeConsultationPage />} />
      <Route path="/features/penal-code-search" element={<PenalCodeSearchPage />} />
      <Route path="/features/sanctions-checker" element={<SanctionsCheckerPage />} />
      <Route path="/features/contract-review" element={<ContractReviewPage />} />
      <Route path="/features/arbitration-filing" element={<ArbitrationFilingPage />} />
      <Route path="/features/statutes" element={<StatuteSearchPage />} />
      <Route path="/features/document-drafter" element={<DocumentDrafterPage />} />
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/users" element={<UserPanel />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
    {/* <AdvokateChat /> */}
    </>
  )
}

export default App
