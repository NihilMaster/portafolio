// ==========================================================
// 1. Utilidades
// ==========================================================
function formatYearMonth(ym) {
    if (!ym) return '';
    if (ym === 'present' || ym === null) return 'Actualidad';
    const [year, month] = String(ym).split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const m = months[Number(month) - 1] || month;
    return `${m} ${year}`;
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================================
// 2. Carga de iconos SVG en elementos [data-icon]
// ==========================================================
function initSvgIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach(el => {
        const key = el.getAttribute("data-icon");
        if (window.SVG_ICONS && window.SVG_ICONS[key]) {
            el.innerHTML = window.SVG_ICONS[key];
        }
    });
}

// ==========================================================
// 3. Caché en localStorage para la API de GitHub
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
// 4. Carga unificada: data/sources.json (memorizado)
// ==========================================================
let SOURCES_DATA = null;
async function loadSources() {
    if (SOURCES_DATA) return SOURCES_DATA;
    const res = await fetch('data/sources.json');
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar data/sources.json`);
    SOURCES_DATA = await res.json();
    return SOURCES_DATA;
}

// ==========================================================
// 5. Proyectos
// ==========================================================
function renderTechnology(tech) {
    const isFA = tech.icon.startsWith('fa-');
    const title = escapeHtml(tech.title);
    if (isFA) {
        return `<i class="fab ${tech.icon} tech-icon" title="${title}"></i>`;
    }
    return `<span class="tech-icon" data-icon="${escapeHtml(tech.icon)}" title="${title}"></span>`;
}

function loadProjects() {
    const container = document.getElementById('projects-container');
    if (!container) {
        console.warn('[proyectos] No se encontró #projects-container');
        return;
    }
    loadSources()
        .then(data => {
            const projects = (data.projects || []).filter(p => !p.private);
            if (!projects.length) {
                container.innerHTML = '<p>No hay proyectos para mostrar.</p>';
                return;
            }
            container.innerHTML = projects.map(p => `
                <div class="project-card" data-category="${p.category.map(escapeHtml).join(' ')}" data-repo="${escapeHtml(p.repo)}" role="button" tabindex="0">
                    <div class="card-bg" style="background-image: url('${p.banner}')"></div>
                    <div class="card-content">
                        <div class="card-header">
                            <h3 class="project-title">${escapeHtml(p.title)}</h3>
                            <p class="project-description">${escapeHtml(p.description)}</p>
                        </div>
                        <div class="technologies">
                            ${p.technologies.map(renderTechnology).join('')}
                        </div>
                    </div>
                </div>
            `).join('');
            initSvgIcons(container);
            initFilters();
        })
        .catch(err => {
            console.error('[proyectos] Error:', err);
            container.innerHTML = `
                <div class="certificate-card">
                    <h3>Proyectos en desarrollo</h3>
                    <p>Próximamente agregaré mis proyectos aquí.</p>
                </div>
            `;
        });
}

// ==========================================================
// 6. Certificados
// ==========================================================
function loadCertificates() {
    const container = document.getElementById('certificates-container');
    if (!container) {
        console.warn('[certificados] No se encontró #certificates-container');
        return;
    }
    loadSources()
        .then(data => {
            const certs = data.certificates || [];
            if (!certs.length) {
                container.innerHTML = '<p>No hay certificados para mostrar.</p>';
                return;
            }
            const sorted = [...certs].sort((a, b) => new Date(b.date) - new Date(a.date));
            container.innerHTML = sorted.map(cert => `
                <div class="certificate-card">
                    <div class="card-image">
                        <img src="${(cert.image || '').trim()}" alt="${escapeHtml(cert.title)}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3>${escapeHtml(cert.title)}</h3>
                        <p class="issuer">${escapeHtml(cert.issuer)}</p>
                        <p class="date">${new Date(cert.date).toLocaleDateString()}</p>
                        <a href="${(cert.credentialUrl || '').trim()}" target="_blank" rel="noopener noreferrer" class="verify-btn">
                            <i class="fas fa-external-link-alt"></i> Verificar
                        </a>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => {
            console.error('[certificados] Error:', err);
            container.innerHTML = `
                <div class="certificate-card">
                    <h3>Certificados en Desarrollo</h3>
                    <p>Próximamente agregaré mis certificados aquí.</p>
                </div>
            `;
        });
}

// ==========================================================
// 7. Experiencia
// ==========================================================
function loadExperience() {
    const container = document.getElementById('experience-card');
    if (!container) {
        console.warn('[experiencia] No se encontró #experience-card');
        return;
    }
    loadSources()
        .then(data => {
            const experience = (data.experience || []).filter(e => !e.private);
            if (!experience.length) {
                container.innerHTML = `
                    <div class="experience-card empty">
                        <h3>Mi Experiencia Profesional</h3>
                        <p>Próximamente compartiré mi experiencia laboral y profesional.</p>
                    </div>
                `;
                return;
            }
            container.innerHTML = experience.map(exp => `
                <div class="experience-card">
                    <div class="exp-header">
                        <h3>${escapeHtml(exp.title)}</h3>
                        <span class="exp-period">
                            ${formatYearMonth(exp.start)} — ${exp.end === null || exp.end === undefined ? 'Actualidad' : formatYearMonth(exp.end)}
                        </span>
                    </div>
                    <p class="company">
                        ${escapeHtml(exp.company)}${exp.location ? ` · <span class="location">${escapeHtml(exp.location)}</span>` : ''}
                    </p>
                    <p class="description">${escapeHtml(exp.description)}</p>
                    ${(exp.technologies || []).length ? `
                        <div class="technologies">
                            ${exp.technologies.map(t => `<span class="tech-badge">${escapeHtml(t)}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${(exp.achievements || []).length ? `
                        <ul class="achievements">
                            ${exp.achievements.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('');
        })
        .catch(err => {
            console.error('[experiencia] Error:', err);
            container.innerHTML = `
                <div class="experience-card empty">
                    <h3>Experiencia en Desarrollo</h3>
                    <p>Próximamente agregaré mi experiencia aquí.</p>
                </div>
            `;
        });
}

// ==========================================================
// 8. Toggle de tema
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
// 9. Filtrado de proyectos
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
// 10. Navegación entre secciones
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
// 11. Modal de proyecto + GitHub API (EVENT DELEGATION)
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

    // Event delegation
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.project-card');
        if (card) openProjectModal(card);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.project-card');
        if (card) {
            e.preventDefault();
            openProjectModal(card);
        }
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
// 12. Footer: año dinámico y contador de visitas (GoatCounter)
// ==========================================================
function initFooter() {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const counterEl = document.getElementById('visit-counter');
    if (!counterEl) return;

    const url = 'https://nihil.goatcounter.com/counter/TOTAL.json';
    fetch(url)
        .then(res => {
            if (res.status === 404) {
                throw Object.assign(new Error('sin datos todavía (404)'), { silent: true });
            }
            if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
            return res.json();
        })
        .then(data => {
            const clean = String(data.count ?? data.count_unique ?? '0').replace(/[^\d]/g, '');
            counterEl.textContent = Number(clean || 0).toLocaleString();
        })
        .catch(err => {
            if (!err.silent) console.warn('[footer] No se pudo cargar el contador:', err);
            counterEl.textContent = '0';
        });
}

// ==========================================================
// 13. Arranque
// ==========================================================
document.addEventListener('DOMContentLoaded', function () {
    try { initTheme(); } catch (e) { console.error('initTheme:', e); }
    try { initNavigation(); } catch (e) { console.error('initNavigation:', e); }
    try { initModal(); } catch (e) { console.error('initModal:', e); }
    try { loadProjects(); } catch (e) { console.error('loadProjects:', e); }
    try { loadCertificates(); } catch (e) { console.error('loadCertificates:', e); }
    try { loadExperience(); } catch (e) { console.error('loadExperience:', e); }
    try { initFooter(); } catch (e) { console.error('initFooter:', e); }
});
