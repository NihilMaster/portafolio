// Cargar los iconos SVG en los elementos con data-icon
document.querySelectorAll("[data-icon]").forEach(el => {
    const key = el.getAttribute("data-icon");
    el.innerHTML = window.SVG_ICONS[key];
});

// Cargar certificados desde data/credly.json
function loadCertificates() {
    const container = document.getElementById('certificates-container');
    fetch('data/sources.json')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar certificados');
            return response.json();
        })
        .then(data => {
            // Extraer todos los certificados de todas las fuentes
            let allCertificates = [];
            
            data.forEach(source => {
                // Manejar tanto "credentials" como "repositories"
                const items = source.credentials || source.repositories || [];
                allCertificates = allCertificates.concat(items);
            });
            
            // Ordenar por fecha (más reciente primero)
            allCertificates.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Generar el HTML
            container.innerHTML = allCertificates.map(cert => `
                <div class="certificate-card">
                    <div class="card-image">
                        <img src="${cert.image.trim()}" alt="${cert.title}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3>${cert.title}</h3>
                        <p class="issuer">${cert.issuer}</p>
                        <p class="date">${new Date(cert.date).toLocaleDateString()}</p>
                        <a href="${cert.credentialUrl.trim()}" target="_blank" rel="noopener noreferrer" class="verify-btn">
                            <i class="fas fa-external-link-alt"></i> Verificar
                        </a>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error(error);
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

// Filtrado de proyectos
document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remover clase activa de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Agregar clase activa al botón clickeado
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            // Filtrar proyectos
            projectCards.forEach(card => {
                const categories = card.getAttribute('data-category').split(' ');

                if (filterValue === 'all' || categories.includes(filterValue)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});

// Navegación entre secciones
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const filters = document.getElementById('proyectos-filters');

    // Mapeo de títulos y subtítulos para cada sección
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

    // Función para actualizar el encabezado
    function updateHeader(sectionName) {
        const title = document.getElementById('header-title');
        const subtitle = document.getElementById('header-subtitle');
        
        if (title && subtitle && SECTION_CONTENT[sectionName]) {
            // Efecto fade
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

    // Función para cambiar de sección
    function changeSection(sectionName) {
        // Ocultar todas las secciones
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar la sección seleccionada
        const activeSection = document.getElementById(sectionName);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // Mostrar/ocultar filtros solo en la sección de proyectos
        if (filters) {
            if (sectionName === 'proyectos') {
                filters.style.display = 'flex';
            } else {
                filters.style.display = 'none';
            }
        }

        // Actualizar enlaces activos
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionName) {
                link.classList.add('active');
            }
        });

        // Actualizar el encabezado
        updateHeader(sectionName);
    }

    // Event listeners para los enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            changeSection(section);

            // Cerrar menú móvil si está abierto
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Menú móvil toggle
    navToggle.addEventListener('click', function () {
        navMenu.classList.toggle('active');
        this.classList.toggle('active');
    });

    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', function (e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    // Mostrar sección de proyectos por defecto
    changeSection('proyectos');

    // Actualizar el encabezado al cargar la página
    updateHeader('proyectos');

    // Cargar certificados al iniciar la página
    loadCertificates();
});
