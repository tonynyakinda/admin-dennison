import { supabase } from './supabaseClient.js';
import Quill from 'https://cdn.skypack.dev/quill@1.3.6';

// --- DOM ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const logoutButton = document.getElementById('logout-button');
const contentArea = document.getElementById('content-area');
const dashboardNav = document.querySelector('#dashboard-screen nav');

// === NEW: CUSTOM ALERT LOGIC ===
const customAlert = document.getElementById('custom-alert');
let alertTimeout;

/**
 * Displays a custom toast notification.
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - The type of alert ('success', 'error', 'info').
 * @param {number} [duration=5000] - How long the alert stays visible in ms.
 */
function showAlert(message, type = 'info', duration = 5000) {
    if (!customAlert) return;

    const alertMessage = customAlert.querySelector('.alert-message');
    clearTimeout(alertTimeout);
    alertMessage.textContent = message;
    customAlert.className = 'custom-alert'; // Reset classes
    customAlert.classList.add(`alert-${type}`);
    customAlert.classList.add('active');

    alertTimeout = setTimeout(() => {
        customAlert.classList.remove('active');
    }, duration);
}

if (customAlert) {
    const closeButton = customAlert.querySelector('.close-alert');
    closeButton.addEventListener('click', () => {
        clearTimeout(alertTimeout);
        customAlert.classList.remove('active');
    });
}
// === END NEW ALERT LOGIC ===

// --- QUILL EDITOR TOOLBAR CONFIG ---
const fullToolbarOptions = [
    [{ 'font': [] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['link', 'image', 'video', 'blockquote', 'code-block'],
    ['clean']
];

// --- AUTHENTICATION LOGIC ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });
    if (error) {
        loginError.textContent = error.message;
    } else {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        loginError.textContent = '';
    }
});
logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    dashboardScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
    emailInput.value = '';
    passwordInput.value = '';
});

// --- DASHBOARD ROUTER ---
dashboardNav.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button) {
        document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const section = button.dataset.target;
        switch (section) {
            case 'bookings': loadBookings(); break;
            case 'contacts': loadContacts(); break;
            case 'services': loadServices(); break;
            case 'testimonials': loadTestimonials(); break;
            case 'merchandise': loadMerchandise(); break;
            case 'posts': loadPosts(); break;
            case 'schedule': loadSchedule(); break;
            default: contentArea.innerHTML = `<h2>Welcome, Admin!</h2><p>Select a category to begin.</p>`;
        }
    }
});

// --- DYNAMIC CONTENT EVENT LISTENER ---
contentArea.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const card = target.closest('.item-card');
    const id = card ? card.dataset.id : null;
    if (target.id === 'add-testimonial-btn') return showAddTestimonialForm();
    if (target.id === 'add-merch-btn') return showAddMerchandiseForm();
    if (target.id === 'add-post-btn') return showAddPostForm();
    if (target.id === 'add-class-btn') return showAddScheduleForm();
    if (target.classList.contains('edit-btn')) {
        if (card.classList.contains('service-card')) return showEditServiceForm(id);
        if (card.classList.contains('testimonial-card')) return showEditTestimonialForm(id);
        if (card.classList.contains('merch-card')) return showEditMerchandiseForm(id);
        if (card.classList.contains('post-card')) return showEditPostForm(id);
        if (card.classList.contains('class-item')) return showEditScheduleForm(id);
    }
    if (target.classList.contains('delete-btn')) {
        if (card.classList.contains('booking-card')) return handleDelete('bookings', id, loadBookings);
        if (card.classList.contains('contact-card')) return handleDelete('contacts', id, loadContacts);
        if (card.classList.contains('testimonial-card')) return handleDelete('testimonials', id, loadTestimonials);
        if (card.classList.contains('merch-card')) return handleDelete('merchandise', id, loadMerchandise);
        if (card.classList.contains('post-card')) return handleDelete('posts', id, loadPosts);
        if (card.classList.contains('class-item')) return handleDelete('schedule', id, loadSchedule);
    }
    if (target.classList.contains('toggle-read-btn')) {
        const toggleId = target.dataset.id;
        const currentStatus = target.dataset.isRead === 'true';
        const { error } = await supabase.from('contacts').update({ is_read: !currentStatus }).eq('id', toggleId);
        if (error) { showAlert('Could not update status.', 'error'); } else { loadContacts(); }
    }
    if (target.classList.contains('toggle-contacted-btn')) {
        const toggleId = target.dataset.id;
        const currentStatus = target.dataset.isContacted === 'true';
        const { error } = await supabase.from('bookings').update({ is_contacted: !currentStatus }).eq('id', toggleId);
        if (error) { showAlert('Could not update status.', 'error'); } else { loadBookings(); }
    }
});

// --- GENERALIZED DELETE FUNCTION ---
async function handleDelete(tableName, id, callback) {
    if (confirm(`Are you sure you want to delete this item? This action cannot be undone.`)) {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
            showAlert(`Failed to delete item. Please try again.`, 'error');
            console.error(error);
        } else {
            showAlert('Item deleted successfully!', 'success');
            callback();
        }
    }
}

// --- BOOKINGS & CONTACTS (Read/Delete) ---
async function loadBookings() { /* ... content unchanged ... */ }
async function loadContacts() { /* ... content unchanged ... */ }

// --- SERVICES (Read/Update) ---
async function loadServices() { /* ... content unchanged ... */ }
async function showEditServiceForm(id) {
    const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
    if (error) { showAlert('Could not load service pricing.', 'error'); loadServices(); return; }
    // ... rest of form generation ...
    document.getElementById('service-edit-form').addEventListener('submit', async (e) => {
        // ... form data collection ...
        const { error: updateError } = await supabase.from('services').update(updatedData).eq('id', id);
        if (updateError) {
            showAlert('Failed to update pricing.', 'error');
            console.error(updateError);
        } else {
            showAlert('Pricing updated successfully!', 'success');
            loadServices();
        }
    });
}

// --- TESTIMONIALS (CRUD) ---
async function loadTestimonials() { /* ... content unchanged ... */ }
function showAddTestimonialForm() {
    // ... form generation ...
    document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
        // ... file uploads ...
        if (beforeError) { showAlert('Failed to upload "before" image.', 'error'); return; }
        if (afterError) { showAlert('Failed to upload "after" image.', 'error'); return; }

        const { error } = await supabase.from('testimonials').insert([/* ... data ... */]);
        if (error) {
            showAlert('Failed to add testimonial.', 'error');
            console.error(error);
        } else {
            showAlert('Testimonial added successfully!', 'success');
            loadTestimonials();
        }
    });
}
async function showEditTestimonialForm(id) {
    const { data, error } = await supabase.from('testimonials').select('*').eq('id', id).single();
    if (error) { showAlert('Could not load testimonial data.', 'error'); loadTestimonials(); return; }
    // ... form generation ...
    document.getElementById('testimonial-edit-form').addEventListener('submit', async (e) => {
        // ... file upload logic ...
        if (uploadError) { showAlert('Failed to upload new image.', 'error'); return; }

        const { error: updateError } = await supabase.from('testimonials').update({ /* ... data ... */ }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update testimonial.', 'error');
        } else {
            showAlert('Testimonial updated successfully!', 'success');
            loadTestimonials();
        }
    });
}

// --- MERCHANDISE (CRUD) ---
async function loadMerchandise() { /* ... content unchanged ... */ }
function showAddMerchandiseForm() {
    // ... form generation ...
    document.getElementById('merch-form').addEventListener('submit', async (e) => {
        // ... file upload ...
        if (uploadError) { showAlert('Failed to upload image.', 'error'); console.error(uploadError); return; }

        const { error: insertError } = await supabase.from('merchandise').insert([/* ... data ... */]);
        if (insertError) {
            showAlert('Failed to save product data.', 'error');
        } else {
            showAlert('Product added successfully!', 'success');
            loadMerchandise();
        }
    });
}
async function showEditMerchandiseForm(id) {
    const { data, error } = await supabase.from('merchandise').select('*').eq('id', id).single();
    if (error) { showAlert('Could not load product data.', 'error'); loadMerchandise(); return; }
    // ... form generation ...
    document.getElementById('merch-edit-form').addEventListener('submit', async (e) => {
        // ... file upload ...
        if (uploadError) { showAlert('Failed to upload new image.', 'error'); return; }

        const { error: updateError } = await supabase.from('merchandise').update({ /* ... data ... */ }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update product.', 'error');
        } else {
            showAlert('Product updated successfully!', 'success');
            loadMerchandise();
        }
    });
}

// --- POSTS (CRUD) ---
async function loadPosts() { /* ... content unchanged ... */ }
function showAddPostForm() {
    // ... form generation ...
    const quill = new Quill('#content-editor', { theme: 'snow', modules: { toolbar: fullToolbarOptions } });
    document.getElementById('post-form').addEventListener('submit', async (e) => {
        // ... file upload ...
        if (uploadError) { showAlert('Failed to upload image.', 'error'); console.error(uploadError); return; }

        const { error: insertError } = await supabase.from('posts').insert([/* ... data ... */]);
        if (insertError) {
            showAlert('Failed to save post data.', 'error');
        } else {
            showAlert('Post added successfully!', 'success');
            loadPosts();
        }
    });
}
async function showEditPostForm(id) {
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
    if (error) { showAlert('Could not load post data.', 'error'); loadPosts(); return; }
    // ... form generation ...
    const quill = new Quill('#content-editor', { theme: 'snow', modules: { toolbar: fullToolbarOptions } });
    quill.root.innerHTML = data.content || '';
    document.getElementById('post-edit-form').addEventListener('submit', async (e) => {
        // ... file upload ...
        if (uploadError) { showAlert('Failed to upload new image.', 'error'); return; }

        const { error: updateError } = await supabase.from('posts').update({ /* ... data ... */ }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update post.', 'error');
        } else {
            showAlert('Post updated successfully!', 'success');
            loadPosts();
        }
    });
}

// --- SCHEDULE (CRUD) ---
async function loadSchedule() { /* ... content unchanged ... */ }
function showAddScheduleForm() {
    // ... form generation ...
    document.getElementById('schedule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('schedule').insert([/* ... data ... */]);
        if (error) {
            showAlert('Failed to add class.', 'error');
            console.error(error);
        } else {
            showAlert('Class added successfully!', 'success');
            loadSchedule();
        }
    });
}
async function showEditScheduleForm(id) {
    const { data, error } = await supabase.from('schedule').select('*').eq('id', id).single();
    if (error) { showAlert('Could not load class data.', 'error'); loadSchedule(); return; }
    // ... form generation ...
    document.getElementById('schedule-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error: updateError } = await supabase.from('schedule').update({ /* ... data ... */ }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update class.', 'error');
        } else {
            showAlert('Class updated successfully!', 'success');
            loadSchedule();
        }
    });
}

// --- SESSION CHECK ---
async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
    } else {
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
    }
}
checkSession();