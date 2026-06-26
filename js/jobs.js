// js/jobs.js – Final, robust version

(function () {
    console.log('🔵 jobs.js loaded');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
        console.log('📄 DOM ready');

        // 1. Check Supabase is available
        if (typeof supabase === 'undefined' && typeof window.supabase === 'undefined') {
            console.error('❌ Supabase library not loaded!');
            document.getElementById('job-listings').innerHTML =
                '<div class="alert alert-danger">Supabase library failed to load.</div>';
            document.getElementById('supabase-status').innerHTML =
                '<span class="badge bg-danger">Library error</span>';
            return;
        }

        // 2. Create Supabase client (use existing or create new)
        const SUPABASE_URL = "https://rlfywkvyjoydpbvprtdt.supabase.co";
        const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnl3a3Z5am95ZHBidnBydGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ2MTEsImV4cCI6MjA5NzkxMDYxMX0.oF3BnxQD0AE_47ypbIA39iV0FGICbXZJPwOgiZTcjMk";

        // Use existing _db if defined, else create new
        const supabaseClient = window._db || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase client ready');

        // 3. DOM elements
        const jobListings = document.getElementById('job-listings');
        const statusBadge = document.getElementById('supabase-status');
        const adminForm = document.getElementById('admin-job-form');
        const loginBtn = document.getElementById('login-btn');
        const dashboardBtn = document.getElementById('dashboard-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const authStatus = document.getElementById('auth-status');

        // 4. Auth helper
        async function getProfile() {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return null;
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            return profile ? { ...profile, user } : null;
        }

        // 5. Update UI based on role
        async function updateUI() {
            const profile = await getProfile();
            if (profile && profile.role === 'admin') {
                adminForm?.classList.remove('d-none');
                if (loginBtn) loginBtn.classList.add('d-none');
                if (dashboardBtn) dashboardBtn.classList.remove('d-none');
                if (logoutBtn) logoutBtn.classList.remove('d-none');
                if (authStatus) { authStatus.classList.remove('d-none'); authStatus.textContent = 'Admin'; }
            } else if (profile) {
                adminForm?.classList.add('d-none');
                if (loginBtn) loginBtn.classList.add('d-none');
                if (dashboardBtn) dashboardBtn.classList.add('d-none');
                if (logoutBtn) logoutBtn.classList.remove('d-none');
                if (authStatus) { authStatus.classList.remove('d-none'); authStatus.textContent = 'User'; }
            } else {
                adminForm?.classList.add('d-none');
                if (loginBtn) loginBtn.classList.remove('d-none');
                if (dashboardBtn) dashboardBtn.classList.add('d-none');
                if (logoutBtn) logoutBtn.classList.add('d-none');
                if (authStatus) authStatus.classList.add('d-none');
            }
        }

        // 6. Load jobs
        async function loadJobs() {
            console.log('📡 Fetching jobs from Supabase...');
            try {
                const { data: jobs, error } = await supabaseClient
                    .from('jobs')
                    .select('*')
                    .eq('status', 'open')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('❌ Supabase error:', error);
                    throw error;
                }

                console.log('✅ Jobs fetched:', jobs);

                if (!jobs || jobs.length === 0) {
                    jobListings.innerHTML = `
                        <div class="text-center py-5">
                            <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No open positions at the moment.</p>
                            <small class="text-muted">Check back later or post a new job (admin only).</small>
                        </div>
                    `;
                    statusBadge.innerHTML = '<span class="badge bg-warning">No jobs</span>';
                    return;
                }

                let html = '<div class="row g-4">';
                jobs.forEach(job => {
                    html += `
                        <div class="col-md-6 col-lg-4">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body">
                                    <h5 class="card-title">${escapeHtml(job.title)}</h5>
                                    <h6 class="card-subtitle mb-2 text-muted"><i class="fas fa-building me-1"></i>${escapeHtml(job.company)}</h6>
                                    <p><i class="fas fa-map-marker-alt me-1"></i>${escapeHtml(job.location || 'Remote')}</p>
                                    ${job.salary ? `<p><i class="fas fa-money-bill-wave me-1"></i>${escapeHtml(job.salary)}</p>` : ''}
                                    <p class="small">${escapeHtml(job.description ? job.description.substring(0, 120) + '...' : '')}</p>
                                    <small class="text-muted">Posted ${new Date(job.created_at).toLocaleDateString()}</small>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                jobListings.innerHTML = html;
                statusBadge.innerHTML = '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Connected</span>';
            } catch (err) {
                console.error('🔥 Load error:', err);
                jobListings.innerHTML = `
                    <div class="text-center py-5 text-danger">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                        <p>Failed to load jobs: ${err.message}</p>
                        <p class="small text-muted">Check the console for details.</p>
                    </div>
                `;
                statusBadge.innerHTML = '<span class="badge bg-danger">Error</span>';
            }
        }

        // 7. Post job (admin)
        document.getElementById('job-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const profile = await getProfile();
            if (!profile || profile.role !== 'admin') {
                alert('You must be an admin to post jobs.');
                return;
            }

            const title = document.getElementById('job-title').value.trim();
            const company = document.getElementById('job-company').value.trim();
            const location = document.getElementById('job-location').value.trim();
            const salary = document.getElementById('job-salary').value.trim();
            const description = document.getElementById('job-description').value.trim();
            const status = document.getElementById('job-status').value;

            if (!title || !company || !location || !description) {
                alert('Please fill in all required fields.');
                return;
            }

            try {
                const { error } = await supabaseClient
                    .from('jobs')
                    .insert([{ title, company, location, salary: salary || null, description, status, user_id: profile.user.id }]);
                if (error) throw error;
                alert('✅ Job posted successfully!');
                document.getElementById('job-form').reset();
                loadJobs();
            } catch (err) {
                alert('Failed to post job: ' + err.message);
            }
        });

        // 8. Logout
        logoutBtn?.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload();
        });

        // 9. Helper
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 10. Run
        await updateUI();
        await loadJobs();

        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange(() => {
            updateUI();
            loadJobs();
        });
    }
})();