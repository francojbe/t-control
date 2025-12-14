import React, { useState, useEffect } from 'react';
import { Bell, LayoutGrid, User, LogOut, BarChart2 } from 'lucide-react';
import HomeView from './components/HomeView';
import ProfileView from './components/ProfileView';
import StatisticsView from './components/StatisticsView';
import JobForm from './components/JobForm';
import AuthView from './components/AuthView';
import ResetPasswordView from './components/ResetPasswordView';
import ConfirmationModal from './components/ConfirmationModal';
import { supabase } from './supabaseClient';
import { useToast } from './context/ToastContext';

const App = () => {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- DELETE MODAL STATE ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  // --- LOGOUT MODAL STATE ---
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // --- PASSWORD RESET STATE ---
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);

  // ... (ESTADO DE DATOS)
  const [jobs, setJobs] = useState([]);

  // ... (CONFIGURACIÓN)


  // ... (CONFIGURACIÓN)
  const [businessSettings, setBusinessSettings] = useState({
    techCommissionPct: 50,
    cardFeePct: 0, // Default 0
    showCommissionConfig: false
  });

  // --- AUTH & DATA INIT ---
  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordResetMode(true);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Fetch Data when User is present
  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchSettings();
    }
  }, [user]);

  // --- DARK MODE INIT ---
  useEffect(() => {
    // Check localStorage on mount
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('tech_commission_pct, card_fee_pct') // Fetch both
        .eq('user_id', user.id)
        .single();

      if (data) {
        setBusinessSettings(prev => ({
          ...prev,
          techCommissionPct: data.tech_commission_pct,
          cardFeePct: data.card_fee_pct || 0
        }));
      }
    } catch (error) {
      console.log('Using default settings');
    }
  };

  const fetchJobs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleAddJob = async (newJobData) => {
    if (!supabase) return;

    // Preparar objeto para DB (snake_case)
    const totalTransaction = parseFloat(newJobData.incomeAmount) || 0;
    const expenseComp = parseFloat(newJobData.expenseCompany) || 0;
    const expenseTech = parseFloat(newJobData.expenseTech) || 0;

    const dbEntry = {
      user_id: user.id,
      client: newJobData.client,
      date: newJobData.date,
      description: newJobData.description,
      transfer: newJobData.incomeType === 'transfer' ? totalTransaction : 0,
      cash: newJobData.incomeType === 'cash' ? totalTransaction : 0,
      link_payment: newJobData.incomeType === 'link' ? totalTransaction : 0, // New field
      expense_company: expenseComp,
      expense_tech: expenseTech,
      applied_commission: businessSettings.techCommissionPct,
      // We might want to store the applied card fee percentage too for historical accuracy, 
      // but simpler for now to just calculate it on the fly or if I had a column.
      // Let's stick to just saving the 'link_payment' amount.
    };

    try {
      if (editingJob) {
        const { error } = await supabase.from('jobs').update(dbEntry).eq('id', editingJob.id);
        if (error) throw error;
        showToast('Trabajo actualizado correctamente');
      } else {
        const { error } = await supabase.from('jobs').insert([dbEntry]);
        if (error) throw error;
        showToast('Trabajo guardado correctamente');
      }
      fetchJobs();
      setIsFormOpen(false);
      setEditingJob(null);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const openNewForm = () => {
    setEditingJob(null);
    setIsFormOpen(true);
  };

  const openEditForm = (job) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleDeleteJob = (jobId) => {
    setJobToDelete(jobId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobToDelete);

      if (error) throw error;

      setJobs(prev => prev.filter(j => j.id !== jobToDelete));
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
      showToast('Trabajo eliminado correctamente');
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('Error al eliminar el trabajo', 'error');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
    setUser(null);
    setIsLogoutModalOpen(false);
  };

  const handleUpdateSettings = async (newSettings) => {
    setBusinessSettings(prev => ({ ...prev, ...newSettings }));

    if (supabase && user) {
      try {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          tech_commission_pct: newSettings.techCommissionPct !== undefined ? newSettings.techCommissionPct : businessSettings.techCommissionPct,
          card_fee_pct: newSettings.cardFeePct !== undefined ? newSettings.cardFeePct : businessSettings.cardFeePct
        });
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- PASSWORD RESET MODE ---
  if (isPasswordResetMode) {
    return (
      <ResetPasswordView
        onPasswordUpdated={() => {
          setIsPasswordResetMode(false);
          // Optionally redirect or show login again, but auth state usually persists or user can just login
          window.location.href = '/';
        }}
      />
    )
  }

  // Si no hay usuario, mostramos el Login
  if (!user) {
    return <AuthView onLogin={(userData) => setUser(userData)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center font-sans p-0 sm:p-4 transition-colors duration-300">
      {/* Mobile: Full Screen (h-dvh, rounded-none). Desktop: Centered Card (h-90dvh, rounded-40px) */}
      <div className="w-full sm:max-w-[400px] bg-white dark:bg-gray-950 sm:rounded-[40px] shadow-2xl overflow-hidden relative h-[100dvh] sm:h-[90dvh] sm:max-h-[850px] flex flex-col transition-colors duration-300">

        {/* --- HEADER COMÚN --- */}
        <div className="flex justify-between items-center px-6 pt-8 pb-4">
          <div className="w-8"></div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight transition-colors">
            {activeTab === 'home' ? 'T-Control' : 'Mi Perfil'}
          </h1>
          <button
            onClick={handleLogout}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors text-gray-600 dark:text-gray-300"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="flex-1 overflow-y-auto px-6 pb-20 scrollbar-hide">

          {/* VISTA: HOME / CÁLCULO */}
          {activeTab === 'home' ? (
            <HomeView
              jobs={jobs.map(j => ({
                ...j,
                expenseCompany: j.expense_company,
                expenseTech: j.expense_tech,
                appliedCommission: j.applied_commission
              }))}
              onOpenForm={openNewForm}
              onEditJob={openEditForm}
              onDeleteJob={handleDeleteJob}
              settings={businessSettings}
            />
          ) : activeTab === 'statistics' ? (
            <StatisticsView jobs={jobs} settings={businessSettings} />
          ) : (
            <ProfileView
              user={user}
              jobs={jobs}
              onLogout={handleLogout}
              settings={businessSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </div>

        {/* --- MODAL FORMULARIO (SLIDE UP) --- */}
        <JobForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onAddJob={handleAddJob}
          initialData={editingJob}
          settings={businessSettings}
        />

        {/* CONFIRMATION MODAL */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Eliminar Trabajo"
          message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
        />

        <ConfirmationModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={confirmLogout}
          title="Cerrar Sesión"
          message="¿Seguro que quieres cerrar tu sesión actual?"
          confirmText="Cerrar Sesión"
          isDanger={true}
        />

        {/* FAB (Floating Action Button) - Moved from HomeView for better positioning */}
        {activeTab === 'home' && (
          <button
            onClick={openNewForm}
            className="absolute bottom-36 right-3 bg-gray-900/90 dark:bg-pink-500/90 backdrop-blur-sm text-white p-3 rounded-full shadow-2xl hover:bg-gray-900 dark:hover:bg-pink-600 transition-all active:scale-95 z-30 border-2 border-white/20 dark:border-white/10"
          >
            {/* Note: We need to import Plus from lucide-react if not already there */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </button>
        )}

        {/* --- NAVEGACIÓN INFERIOR --- */}
        <div className="absolute bottom-8 left-0 right-0 px-6 flex justify-center z-40">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 px-2 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 dark:border-gray-800/50 flex items-center gap-1 w-full justify-between max-w-[320px]">

            <button
              onClick={() => setActiveTab('home')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all ${activeTab === 'home' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <LayoutGrid size={20} />
              {activeTab === 'home' && <span className="text-sm font-medium">Inicio</span>}
            </button>

            <button
              onClick={() => setActiveTab('statistics')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all ${activeTab === 'statistics' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <BarChart2 size={20} />
              {activeTab === 'statistics' && <span className="text-sm font-medium">Stats</span>}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all ${activeTab === 'profile' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <User size={20} />
              {activeTab === 'profile' && <span className="text-sm font-medium">Perfil</span>}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
