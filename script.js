// Utility functions

document.getElementById("logoutBtn").addEventListener("click", ()=>{
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("isAdmin");
    // Redirect back to index.html (or your login page)
    window.location.href = "index.html";
  });

  

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-md ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// Data management
let alumni = [];
let events = [];
let mentorshipRequests = [];
let donations = [];
let pendingVerifications = [];
const PAGE_SIZE = 9;
let currentPage = 1;
let activeSection = 'home';
let sectionsLoaded = { home: true, directory: false, mentorship: false, events: false, donations: false, admin: false, settings: false };

async function loadData() {
    const storedAlumni = localStorage.getItem('alumni');
    if (storedAlumni) {
        alumni = JSON.parse(storedAlumni);
    } else {
        const response = await fetch('sample-data.json');
        alumni = await response.json();
        localStorage.setItem('alumni', JSON.stringify(alumni));
    }

    events = JSON.parse(localStorage.getItem('events')) || [];

    // ✅ Add sample event if no events exist
    if (events.length === 0) {
        events.push({
            id: 1,
            title: "Alumni Networking Meetup",
            date: "2025-09-20",
            venue: "Auditorium Hall, Campus",
            description: "Join us for an evening of networking, mentorship, and reconnecting with fellow alumni.",
            attendees: [],
            rsvped: false
        });
        localStorage.setItem('events', JSON.stringify(events));
    }

    mentorshipRequests = JSON.parse(localStorage.getItem('mentorshipRequests')) || [];
    donations = JSON.parse(localStorage.getItem('donations')) || [];
    pendingVerifications = alumni.filter(a => !a.verified);

    renderDashboard();
}


function saveData() {
    localStorage.setItem('alumni', JSON.stringify(alumni));
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('mentorshipRequests', JSON.stringify(mentorshipRequests));
    localStorage.setItem('donations', JSON.stringify(donations));
    if (activeSection === 'home') renderDashboard();
    if (activeSection === 'directory') renderAlumni();
    if (activeSection === 'mentorship') renderMentorship();
    if (activeSection === 'events') renderEvents();
   
}

function populateFilters() {
    const industryFilter = document.getElementById('industry-filter');
    const locationFilter = document.getElementById('location-filter');
    const industries = [...new Set(alumni.map(a => a.industry))].sort();
    const locations = [...new Set(alumni.map(a => a.location))].sort();

    industries.forEach(ind => {
        const option = document.createElement('option');
        option.value = ind;
        option.textContent = ind;
        industryFilter.appendChild(option);
    });

    locations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        locationFilter.appendChild(option);
    });
}

function renderDashboard() {
    document.getElementById('total-alumni').textContent = alumni.length;
    document.getElementById('active-mentors').textContent = alumni.filter(a => a.isMentor).length;
    document.getElementById('upcoming-events').textContent = events.filter(e => new Date(e.date) > new Date()).length;
    document.getElementById('donations-total').textContent = `$${donations.reduce((sum, d) => sum + d.amount, 0)}`;
}

function renderAlumni(page = 1) {
    const grid = document.getElementById('alumni-grid');
    grid.innerHTML = '';
    let filtered = alumni;

    const search = document.getElementById('directory-search').value.toLowerCase();
    const batch = document.getElementById('batch-filter').value;
    const industry = document.getElementById('industry-filter').value;
    const location = document.getElementById('location-filter').value;
    const tags = document.getElementById('tags-filter').value.toLowerCase().split(',').map(t => t.trim());
    const verified = document.getElementById('verified-filter').value;
    const sort = document.getElementById('sort-select').value;

    if (search) filtered = filtered.filter(a => a.name.toLowerCase().includes(search));
    if (batch) {
        const [start, end] = batch.split('-').map(Number);
        filtered = filtered.filter(a => a.batch >= start && a.batch <= end);
    }
    if (industry) filtered = filtered.filter(a => a.industry === industry);
    if (location) filtered = filtered.filter(a => a.location === location);
    if (tags.length && tags[0]) filtered = filtered.filter(a => tags.some(t => a.tags.includes(t)));
    if (verified) filtered = filtered.filter(a => a.verified === (verified === 'true'));

    if (sort === 'newest') filtered.sort((a, b) => b.batch - a.batch);
    if (sort === 'active') filtered.sort((a, b) => b.activity - a.activity);
    if (sort === 'connected') filtered.sort((a, b) => b.connections - a.connections);

    const start = (page - 1) * PAGE_SIZE;
    const paginated = filtered.slice(start, start + PAGE_SIZE);

    paginated.forEach(alum => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer';
        card.innerHTML = `
            <div class="flex items-center mb-4">
                <img src="${alum.avatar || 'https://via.placeholder.com/48'}" alt="${alum.name}" class="h-12 w-12 sm:h-14 sm:w-14 rounded-full ${alum.verified ? 'ring-2 ring-green-500 ring-opacity-75' : ''}">
                <div class="ml-3 sm:ml-4">
                    <h4 class="font-bold text-base sm:text-lg">${alum.name}</h4>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Batch ${alum.batch} • ${alum.role}</p>
                </div>
            </div>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">${alum.location}</p>
            <div class="flex flex-wrap gap-1 sm:gap-2 mb-3">
                ${alum.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">${tag}</span>`).join('')}
            </div>
            <button class="bg-indigo text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full w-full hover:bg-indigo-700 transition connect-btn text-sm sm:text-base">Connect</button>
        `;
        card.addEventListener('click', () => showProfile(alum.id));
        grid.appendChild(card);
    });

    renderPagination(filtered.length, page);
}

function renderPagination(total, page) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const pages = Math.ceil(total / PAGE_SIZE);
    for (let i = 1; i <= pages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `px-2 py-1 sm:px-3 sm:py-1 rounded-md ${i === page ? 'bg-indigo text-white' : 'bg-gray-200 dark:bg-gray-700'} text-sm sm:text-base`;
        btn.addEventListener('click', () => {
            currentPage = i;
            renderAlumni(i);
        });
        pagination.appendChild(btn);
    }
}

function showProfile(id) {
    const alum = alumni.find(a => a.id === id);
    const content = document.getElementById('profile-content');
    content.innerHTML = `
        <div class="flex items-center mb-4">
            <img src="${alum.avatar}" alt="${alum.name}" class="h-12 w-12 sm:h-16 sm:w-16 rounded-full ${alum.verified ? 'ring-2 ring-green-500 ring-opacity-75' : ''}">
            <div class="ml-3 sm:ml-4">
                <h4 class="font-bold text-base sm:text-lg">${alum.name}</h4>
                <p class="text-xs sm:text-sm">Batch ${alum.batch} - ${alum.degree}</p>
            </div>
        </div>
        <p class="text-xs sm:text-sm"><strong>Role:</strong> ${alum.role} at ${alum.company}</p>
        <p class="text-xs sm:text-sm"><strong>Location:</strong> ${alum.location}</p>
        <p class="text-xs sm:text-sm"><strong>Tags:</strong> ${alum.tags.join(', ')}</p>
        <p class="mt-3 sm:mt-4 text-xs sm:text-sm"><strong>Bio:</strong> ${alum.bio}</p>
        <div class="mt-3 sm:mt-4 text-xs sm:text-sm">
            <a href="${alum.linkedin}" target="_blank" class="text-indigo">LinkedIn</a> • <a href="mailto:${alum.email}" class="text-indigo">Email</a>
        </div>
    `;
    document.getElementById('profile-modal').classList.remove('hidden');
    document.getElementById('edit-profile-btn').onclick = () => showEditProfile(alum);
}

function showEditProfile(alum) {
    document.getElementById('profile-modal').classList.add('hidden');
    document.getElementById('edit-id').value = alum.id;
    document.getElementById('edit-name').value = alum.name;
    document.getElementById('edit-batch').value = alum.batch;
    document.getElementById('edit-degree').value = alum.degree;
    document.getElementById('edit-role').value = alum.role;
    document.getElementById('edit-company').value = alum.company;
    document.getElementById('edit-location').value = alum.location;
    document.getElementById('edit-tags').value = alum.tags.join(', ');
    document.getElementById('edit-bio').value = alum.bio;
    document.getElementById('edit-linkedin').value = alum.linkedin;
    document.getElementById('edit-email').value = alum.email;
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

document.getElementById('edit-profile-form').addEventListener('submit', e => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-id').value);
    const index = alumni.findIndex(a => a.id === id);
    alumni[index] = {
        ...alumni[index],
        name: document.getElementById('edit-name').value,
        batch: parseInt(document.getElementById('edit-batch').value),
        degree: document.getElementById('edit-degree').value,
        role: document.getElementById('edit-role').value,
        company: document.getElementById('edit-company').value,
        location: document.getElementById('edit-location').value,
        tags: document.getElementById('edit-tags').value.split(',').map(t => t.trim()),
        bio: document.getElementById('edit-bio').value,
        linkedin: document.getElementById('edit-linkedin').value,
        email: document.getElementById('edit-email').value,
    };
    saveData();
    document.getElementById('edit-profile-modal').classList.add('hidden');
    showProfile(id);
    showToast('Profile updated');
});

function renderMentorship() {
    const grid = document.getElementById('mentorship-grid');
    grid.innerHTML = '';
    const type = document.getElementById('mentorship-type').value;
    const search = document.getElementById('mentorship-search').value.toLowerCase();
    let filtered = alumni.filter(a => (type === 'mentors' ? a.isMentor : a.isMentee));
    if (search) filtered = filtered.filter(a => a.name.toLowerCase().includes(search));

    filtered.forEach(alum => {
        const matchScore = Math.floor(Math.random() * 100);
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1';
        card.innerHTML = `
            <div class="flex items-center mb-4">
                <img src="${alum.avatar}" alt="${alum.name}" class="h-12 w-12 sm:h-14 sm:w-14 rounded-full">
                <div class="ml-3 sm:ml-4">
                    <h4 class="font-bold text-base sm:text-lg">${alum.name}</h4>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">${alum.role}</p>
                </div>
            </div>
            <p class="text-xs sm:text-sm mb-3">Match Score: <span class="bg-teal text-white px-2 py-1 rounded-full">${matchScore}%</span></p>
            <button class="bg-teal text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full w-full hover:bg-teal-700 transition request-btn text-sm sm:text-base">Request</button>
        `;
        card.querySelector('.request-btn').addEventListener('click', () => showMentorshipRequest(alum.id));
        grid.appendChild(card);
    });
}

function showMentorshipRequest(id) {
    document.getElementById('request-id').value = id;
    document.getElementById('mentorship-request-modal').classList.remove('hidden');
}

document.getElementById('mentorship-request-form').addEventListener('submit', e => {
    e.preventDefault();
    const id = parseInt(document.getElementById('request-id').value);
    const message = document.getElementById('request-message').value;
    mentorshipRequests.push({ mentorId: id, message, status: 'pending' });
    saveData();
    document.getElementById('mentorship-request-modal').classList.add('hidden');
    showToast('Request sent');
});

function renderEvents() {
    const list = document.getElementById('events-list');
    list.innerHTML = '';
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-lg';
        card.innerHTML = `
            <h4 class="font-bold text-base sm:text-lg">${event.title}</h4>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Date: ${event.date} • Venue: ${event.venue}</p>
            <p class="text-xs sm:text-sm">${event.description}</p>
            <div class="mt-3 sm:mt-4 flex items-center space-x-2 sm:space-x-3">
                <button class="bg-teal text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base rsvp-btn">${event.rsvped ? 'Enrolled' : 'Enroll'}</button>
                <span class="text-xs sm:text-sm">Attendees: ${event.attendees.length}</span>
            </div>
        `;
        card.querySelector('.rsvp-btn').addEventListener('click', () => showRSVP(event.id));
        list.appendChild(card);
    });
}



function showRSVP(id) {
    const event = events.find(e => e.id === id);
    document.getElementById('rsvp-event-title').textContent = `Register to ${event.title}?`;
    document.getElementById('confirm-rsvp').onclick = () => {
        event.rsvped = true;
        event.attendees.push({ id: 1 });
        saveData();
        document.getElementById('rsvp-modal').classList.add('hidden');
        showToast('Registration confirmed');
    };
    document.getElementById('rsvp-modal').classList.remove('hidden');
}

function renderPendingVerifications() {
    const list = document.getElementById('pending-verifications');
    list.innerHTML = '';
    pendingVerifications.forEach(pending => {
        const item = document.createElement('div');
        item.className = 'bg-white dark:bg-gray-800/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between';
        item.innerHTML = `
            <div>
                <h4 class="font-bold text-base sm:text-lg">${pending.name}</h4>
                <p class="text-xs sm:text-sm">Batch: ${pending.batch}</p>
            </div>
            <div class="mt-3 sm:mt-0 flex space-x-2 sm:space-x-3">
                <button class="bg-green-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base approve">Approve</button>
                <button class="bg-red-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base reject">Reject</button>
            </div>
        `;
        item.querySelector('.approve').addEventListener('click', () => {
            const index = alumni.findIndex(a => a.id === pending.id);
            alumni[index].verified = true;
            pendingVerifications = pendingVerifications.filter(p => p.id !== pending.id);
            saveData();
            showToast('Approved');
        });
        item.querySelector('.reject').addEventListener('click', () => {
            pendingVerifications = pendingVerifications.filter(p => p.id !== pending.id);
            saveData();
            showToast('Rejected');
        });
        list.appendChild(item);
    });
}

document.getElementById('donate-btn').addEventListener('click', () => {
    document.getElementById('donation-modal').classList.remove('hidden');
});

document.getElementById('confirm-donation').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('donation-amount').value);
    if (amount > 0) {
        donations.push({ amount, date: new Date().toISOString() });
        saveData();
        document.getElementById('donation-modal').classList.add('hidden');
        showToast('Donation received');
    } else {
        showToast('Invalid amount', 'error');
    }
});

document.getElementById('export-data').addEventListener('click', () => {
    const data = { alumni, events, mentorshipRequests, donations };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alumni-data.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-data').click());
document.getElementById('import-data').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
            const data = JSON.parse(ev.target.result);
            alumni = data.alumni || alumni;
            events = data.events || events;
            mentorshipRequests = data.mentorshipRequests || mentorshipRequests;
            donations = data.donations || donations;
            saveData();
            showToast('Data imported');
        };
        reader.readAsText(file);
    }
});

const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

if (localStorage.theme === 'dark') {
    html.classList.add('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
} else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
}

themeToggle.addEventListener('click', () => {
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.theme = 'light';
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        html.classList.add('dark');
        localStorage.theme = 'dark';
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
});

document.getElementById('close-profile').addEventListener('click', () => document.getElementById('profile-modal').classList.add('hidden'));
document.getElementById('close-edit-profile').addEventListener('click', () => document.getElementById('edit-profile-modal').classList.add('hidden'));
document.getElementById('close-mentorship-request').addEventListener('click', () => document.getElementById('mentorship-request-modal').classList.add('hidden'));
document.getElementById('close-create-event').addEventListener('click', () => document.getElementById('create-event-modal').classList.add('hidden'));
document.getElementById('close-rsvp').addEventListener('click', () => document.getElementById('rsvp-modal').classList.add('hidden'));
document.getElementById('close-donation').addEventListener('click', () => document.getElementById('donation-modal').classList.add('hidden'));

const debouncedRenderAlumni = debounce(() => renderAlumni(currentPage), 300);
document.getElementById('directory-search').addEventListener('input', debouncedRenderAlumni);
document.getElementById('batch-filter').addEventListener('change', debouncedRenderAlumni);
document.getElementById('industry-filter').addEventListener('change', debouncedRenderAlumni);
document.getElementById('location-filter').addEventListener('change', debouncedRenderAlumni);
document.getElementById('tags-filter').addEventListener('input', debouncedRenderAlumni);
document.getElementById('verified-filter').addEventListener('change', debouncedRenderAlumni);
document.getElementById('sort-select').addEventListener('change', debouncedRenderAlumni);

const debouncedRenderMentorship = debounce(renderMentorship, 300);
document.getElementById('mentorship-type').addEventListener('change', debouncedRenderMentorship);
document.getElementById('mentorship-search').addEventListener('input', debouncedRenderMentorship);

document.getElementById('global-search').addEventListener('input', debouncedRenderAlumni);

document.getElementById('notifications-bell').addEventListener('click', () => showToast('No notifications'));

// Mobile Menu Toggle
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// Section navigation and lazy loading
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById('mobile-menu').classList.add('hidden');

    const targetSection = document.getElementById(sectionId);
    targetSection.classList.remove('hidden');
    document.querySelectorAll(`.nav-link[data-section="${sectionId}"]`).forEach(link => link.classList.add('active'));
    activeSection = sectionId;

    if (!sectionsLoaded[sectionId]) {
        if (sectionId === 'directory') {
            populateFilters();
            renderAlumni();
            sectionsLoaded.directory = true;
        } else if (sectionId === 'mentorship') {
            renderMentorship();
            sectionsLoaded.mentorship = true;
        } else if (sectionId === 'events') {
            renderEvents();
            sectionsLoaded.events = true;
        } else if (sectionId === 'admin') {
            renderPendingVerifications();
            sectionsLoaded.admin = true;
        } else if (sectionId === 'donations') {
            sectionsLoaded.donations = true;
        } else if (sectionId === 'settings') {
            sectionsLoaded.settings = true;
        }
    }
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        showSection(sectionId);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    showSection('home');
});