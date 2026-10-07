// ==========================================================
// 1. Carga de iconos SVG en elementos [data-icon]
// ==========================================================
function initSvgIcons() {
    document.querySelectorAll("[data-icon]").forEach(el => {
        const key = el.getAttribute("data-icon");
        if (window.SVG_ICONS && window.SVG_ICONS[key]) {
            el.innerHTML = window.SVG_ICONS[key];
        }
    });
}

// ==========================================================
// 2. Caché en localStorage para la API de GitHub
// ==========================================================
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

async function fetchCached(key, url) {
    const cacheKey = `gh_cache_${key}`;
    try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts < CACHE_TTL_MS) return data;
        }
    } catch (e) { /* caché corrupto */ }

    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
    const data = await res.json();

    try { localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch (e) {}
    return data;
}

// ==========================================================
// 3. Certificados — carga desde data/sources.json
// ==========================================================
function loadCertificates() {
    const container = document.getElementById('certificates-container');
    if (!container) {
        console.warn('[certificados] No se encontró #certificates-container');
        return;
    }

    console.log('[certificados] Solicitando data/sources.json...');

    fetch('data/sources.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status} al cargar data/sources.json`);
            return response.json();
        })
        .then(data => {
            console.log('[certificados] Datos recibidos:', data);

            let allCertificates = [];
            data.forEach(source => {
                const items = source.credentials || source.repositories || [];
                allCertificates = allCertificates.concat(items);
            });

            if (!allCertificates.length) {
                console.warn('[certificados] El JSON no contiene credentials ni repositories.');
            }

            allCertificates.sort((a, b) => new Date(b.date) - new Date(a.date));

            container.innerHTML = allCertificates.map(cert => `
                <div class="certificate-card">
                    <div class="card-image">
                        <img src="${(cert.image || '').trim()}" alt="${cert.title}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3>${cert.title}</h3>
                        <p class="issuer">${cert.issuer}</p>
                        <p class="date">${new Date(cert.date).toLocaleDateString()}</p>
                        <a href="${(cert.credentialUrl || '').trim()}" target="_blank" rel="noopener noreferrer" class="verify-btn">
                            <i class="fas fa-external-link-alt"></i> Verificar
                        </a>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('[certificados] Error:', error);
            container.innerHTML = `
                <div class="certificate-card">
                    <h3>Certificados en Desarrollo</h3>
                    <p>Próximamente agregaré mis certificados aquí.</p>
                    <div class="certificate-placeholder">
                        <i class="fas fa-certificate fa-3x" style="color: var(--accent); margin: 1rem 0;"></i>
                        <p>Esta sección estará disponible pronto</p>
                    </div>
                </div>
            `;
        });
}

// ==========================================================
// 4. Toggle de tema (claro / oscuro)
// ==========================================================
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem('theme')
        || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// ==========================================================
// 5. Filtrado de proyectos
// ==========================================================
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            projectCards.forEach(card => {
                const categories = card.getAttribute('data-category').split(' ');
                card.style.display = (filterValue === 'all' || categories.includes(filterValue)) ? 'block' : 'none';
            });
        });
    });
}

// ==========================================================
// 6. Navegación entre secciones
// ==========================================================
const SECTION_CONTENT = {
    proyectos: {
        title: 'Portafolio de Proyectos',
        subtitle: 'Una colección de mis trabajos más relevantes en GitHub'
    },
    certificados: {
        title: 'Certificados y logros',
        subtitle: 'Certificaciones profesionales, cursos completados y participaciones en eventos'
    },
    experiencia: {
        title: 'Experiencia laboral',
        subtitle: 'Trayectoria laboral y proyectos profesionales'
    }
};

function updateHeader(sectionName) {
    const title = document.getElementById('header-title');
    const subtitle = document.getElementById('header-subtitle');

    if (title && subtitle && SECTION_CONTENT[sectionName]) {
        title.classList.add('fade');
        subtitle.classList.add('fade');

        setTimeout(() => {
            title.textContent = SECTION_CONTENT[sectionName].title;
            subtitle.textContent = SECTION_CONTENT[sectionName].subtitle;
            title.classList.remove('fade');
            subtitle.classList.remove('fade');
        }, 300);
    }
}

function changeSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

    const activeSection = document.getElementById(sectionName);
    if (activeSection) activeSection.classList.add('active');

    const filters = document.getElementById('proyectos-filters');
    if (filters) filters.style.display = sectionName === 'proyectos' ? 'flex' : 'none';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) link.classList.add('active');
    });

    updateHeader(sectionName);
}

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!navToggle || !navMenu) return;

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            changeSection(section);
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    navToggle.addEventListener('click', function () {
        navMenu.classList.toggle('active');
        this.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    changeSection('proyectos');
    updateHeader('proyectos');
}

// ==========================================================
// 7. Modal de proyecto + GitHub API
// ==========================================================
function initModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalTech = document.getElementById('modal-technologies');
    const modalTopics = document.getElementById('modal-topics');
    const modalGithub = document.getElementById('modal-github');
    const hrTopics = document.getElementById('hr-topics');
    const groupTopics = document.getElementById('group-topics');
    const readmeToggle = document.getElementById('readme-toggle');
    const readmeContent = document.getElementById('readme-content');

    function openModal() {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function resetReadme() {
        readmeContent.classList.remove('open');
        readmeContent.innerHTML = '';
        readmeToggle.classList.remove('active');
        readmeToggle.setAttribute('aria-expanded', 'false');
        readmeToggle.querySelector('span').textContent = 'Mostrar README';
        modal.dataset.readmeLoaded = 'false';
        modal.dataset.repo = '';
    }

    function resetModalState() {
        modalTitle.textContent = '';
        modalDescription.textContent = '';
        modalTech.innerHTML = '';
        modalTopics.innerHTML = '';
        hrTopics.style.display = 'none';
        groupTopics.style.display = 'none';
        modalGithub.style.display = 'none';
        modalGithub.href = '#';
        resetReadme();
    }

    function decodeBase64Utf8(b64) {
        const clean = b64.replace(/\n/g, '');
        const bin = atob(clean);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
    }

    function getBranchFromDownloadUrl(url) {
        if (!url) return 'main';
        const m = url.match(/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/([^/]+)\//);
        return m ? m[1] : 'main';
    }

    async function loadReadme(repo) {
        readmeContent.innerHTML = '<p class="readme-loading">Cargando README…</p>';
        try {
            const data = await fetchCached(`readme_${repo}`, `https://api.github.com/repos/${repo}/readme`);
            const decoded = decodeBase64Utf8(data.content || '');
            const html = window.marked ? marked.parse(decoded) : `<pre>${decoded}</pre>`;

            readmeContent.innerHTML = html;

            const branch = getBranchFromDownloadUrl(data.download_url);
            readmeContent.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src');
                if (src && !/^https?:\/\//i.test(src) && !src.startsWith('data:')) {
                    const clean = src.replace(/^\.?\//, '');
                    img.src = `https://raw.githubusercontent.com/${repo}/${branch}/${clean}`;
                }
            });
        } catch (err) {
            console.warn('No se pudo cargar el README:', err);
            readmeContent.innerHTML = '<p class="readme-loading">No se pudo cargar el README.</p>';
        }
    }

    async function openProjectModal(card) {
        const repo = card.dataset.repo;
        const localTitle = card.querySelector('.project-title')?.textContent.trim() || '';
        const localDesc = card.querySelector('.project-description')?.textContent.trim() || '';
        const localTech = card.querySelector('.technologies')?.innerHTML || '';

        resetModalState();

        modalTitle.textContent = localTitle;
        modalDescription.textContent = localDesc;
        modalTech.innerHTML = localTech;
        modal.dataset.repo = repo || '';

        if (repo) {
            modalGithub.href = `https://github.com/${repo}`;
            modalGithub.style.display = 'inline-flex';
        }

        openModal();

        if (!repo) return;

        try {
            const [repoData, langs] = await Promise.all([
                fetchCached(`repo_${repo}`, `https://api.github.com/repos/${repo}`),
                fetchCached(`langs_${repo}`, `https://api.github.com/repos/${repo}/languages`).catch(() => ({}))
            ]);

            if (repoData?.description) modalDescription.textContent = repoData.description;
            if (repoData?.html_url) modalGithub.href = repoData.html_url;

            const totalBytes = Object.values(langs).reduce((a, b) => a + b, 0);
            const langBadges = Object.entries(langs)
                .sort((a, b) => b[1] - a[1])
                .map(([lang, bytes]) => {
                    const pct = totalBytes ? Math.round((bytes / totalBytes) * 100) : 0;
                    return `<span class="tech-badge">${lang} · ${pct}%</span>`;
                })
                .join('');

            if (langBadges) modalTech.insertAdjacentHTML('beforeend', langBadges);

            if (Array.isArray(repoData?.topics) && repoData.topics.length) {
                modalTopics.innerHTML = repoData.topics
                    .map(t => `<span class="tech-badge tech-badge-topic">${t}</span>`)
                    .join('');
                hrTopics.style.display = 'block';
                groupTopics.style.display = 'block';
            }
        } catch (err) {
            console.warn('No se pudo enriquecer con GitHub:', err);
        }
    }

    // Listeners
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => openProjectModal(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProjectModal(card);
            }
        });
    });

    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    readmeToggle.addEventListener('click', async () => {
        const isOpen = readmeContent.classList.toggle('open');
        readmeToggle.classList.toggle('active', isOpen);
        readmeToggle.setAttribute('aria-expanded', String(isOpen));
        readmeToggle.querySelector('span').textContent = isOpen ? 'Ocultar README' : 'Mostrar README';

        if (isOpen && modal.dataset.readmeLoaded !== 'true' && modal.dataset.repo) {
            await loadReadme(modal.dataset.repo);
            modal.dataset.readmeLoaded = 'true';
        }
    });
}

// ==========================================================
// 8. Arranque
// ==========================================================
document.addEventListener('DOMContentLoaded', function () {
    try { initSvgIcons(); } catch (e) { console.error('initSvgIcons:', e); }
    try { initTheme(); } catch (e) { console.error('initTheme:', e); }
    try { initNavigation(); } catch (e) { console.error('initNavigation:', e); }
    try { initFilters(); } catch (e) { console.error('initFilters:', e); }
    try { initModal(); } catch (e) { console.error('initModal:', e); }
    try { loadCertificates(); } catch (e) { console.error('loadCertificates:', e); }
});