// dennison-admin/main.js

import { supabase } from './supabaseClient.js';
import Quill from 'https://cdn.skypack.dev/quill@1.3.6';

// --- DOM ELEMENTS AND AUTHENTICATION LOGIC (UNCHANGED) ---
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const logoutButton = document.getElementById('logout-button');
const contentArea = document.getElementById('content-area');
const dashboardNav = document.querySelector('#dashboard-screen nav');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });
    if (error) { loginError.textContent = error.message; }
    else { loginScreen.style.display = 'none'; dashboardScreen.style.display = 'block'; loginError.textContent = ''; }
});
logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    dashboardScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
    emailInput.value = '';
    passwordInput.value = '';
});

// --- DASHBOARD ROUTER AND EVENT LISTENERS (UNCHANGED) ---
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
    if (target.classList.contains('toggle-read-btn')) { const toggleId = target.dataset.id; const currentStatus = target.dataset.isRead === 'true'; const { error } = await supabase.from('contacts').update({ is_read: !currentStatus }).eq('id', toggleId); if (error) { alert('Could not update status.'); } else { loadContacts(); } }
    if (target.classList.contains('toggle-contacted-btn')) { const toggleId = target.dataset.id; const currentStatus = target.dataset.isContacted === 'true'; const { error } = await supabase.from('bookings').update({ is_contacted: !currentStatus }).eq('id', toggleId); if (error) { alert('Could not update status.'); } else { loadBookings(); } }
});
async function handleDelete(tableName, id, callback) { if (confirm(`Are you sure you want to delete this item?`)) { const { error } = await supabase.from(tableName).delete().eq('id', id); if (error) { alert('Failed to delete item.'); } else { callback(); } } }

// --- OTHER CRUD FUNCTIONS (UNCHANGED) ---
async function loadBookings() { /* Unchanged */ }
async function loadContacts() { /* Unchanged */ }
async function loadServices() { /* Unchanged */ }
async function showEditServiceForm(id) { /* Unchanged */ }
async function loadTestimonials() { /* Unchanged */ }
function showAddTestimonialForm() { /* Unchanged */ }
async function showEditTestimonialForm(id) { /* Unchanged */ }
async function loadMerchandise() { /* Unchanged */ }
function showAddMerchandiseForm() { /* Unchanged */ }
async function showEditMerchandiseForm(id) { /* Unchanged */ }
async function loadSchedule() { /* Unchanged */ }
function showAddScheduleForm() { /* Unchanged */ }
async function showEditScheduleForm(id) { /* Unchanged */ }


// --- POSTS CRUD FUNCTIONS (WITH UPGRADED EDITOR) ---
async function loadPosts() {
    contentArea.innerHTML = '<h1>Loading posts...</h1>';
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching posts:', error); contentArea.innerHTML = 'Error loading data.'; return; }
    contentArea.innerHTML = `<h1>Manage Posts</h1><button id="add-post-btn" class="btn btn-primary">Add New Post</button><hr>`;
    if (data.length === 0) { contentArea.innerHTML += '<p>No posts found. Click "Add New" to start.</p>'; return; }
    data.forEach(item => {
        contentArea.insertAdjacentHTML('beforeend', `<div class="item-card post-card" data-id="${item.id}"><img src="${item.image_url}" alt="${item.title}"><div class="content"><h3>${item.title}</h3><p><strong>Type:</strong> ${item.post_type}</p></div><div class="actions"><button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button><button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button></div></div>`);
    });
}

function showAddPostForm() {
    contentArea.innerHTML = `<h1>Add New Post</h1><form class="item-form" id="post-form"></form>`;
    document.getElementById('post-form').innerHTML = `
        <div class="form-group"><label for="title">Title</label><input type="text" id="title" required></div>
        <div class="form-group"><label for="post_type">Post Type</label><select id="post_type" required><option value="blog">Blog</option><option value="vlog">Vlog</option></select></div>
        <div class="form-group"><label for="content-editor">Content</label><div id="content-editor"></div></div>
        <div class="form-group"><label for="video_url">Video URL (for vlogs, e.g., YouTube)</label><input type="url" id="video_url" placeholder="https://www.youtube.com/watch?v=..."></div>
        <div class="form-group"><label for="image">Cover Image</label><input type="file" id="image" accept="image/*" required></div>
        <button type="submit" class="btn btn-primary">Save Post</button>`;

    // --- UPGRADED QUILL TOOLBAR OPTIONS ---
    const toolbarOptions = [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
    ];

    const quill = new Quill('#content-editor', {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        }
    });

    document.getElementById('post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const imageFile = form.querySelector('#image').files[0];
        const filePath = `post-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageFile);
        if (uploadError) { alert('Failed to upload image.'); console.error(uploadError); return; }
        const imageUrl = supabase.storage.from('post-images').getPublicUrl(filePath).data.publicUrl;

        const content = quill.root.innerHTML;

        const { error: insertError } = await supabase.from('posts').insert([{ title: form.querySelector('#title').value, post_type: form.querySelector('#post_type').value, content: content, video_url: form.querySelector('#video_url').value, image_url: imageUrl, }]);
        if (insertError) { alert('Failed to save post data.'); } else { alert('Post added successfully!'); loadPosts(); }
    });
}

async function showEditPostForm(id) {
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
    if (error) { alert('Could not load post data.'); loadPosts(); return; }
    contentArea.innerHTML = `<h1>Edit Post</h1><form class="item-form" id="post-edit-form"></form>`;
    document.getElementById('post-edit-form').innerHTML = `
        <div class="form-group"><label for="title">Title</label><input type="text" id="title" value="${data.title}" required></div>
        <div class="form-group"><label for="post_type">Post Type</label><select id="post_type" required><option value="blog" ${data.post_type === 'blog' ? 'selected' : ''}>Blog</option><option value="vlog" ${data.post_type === 'vlog' ? 'selected' : ''}>Vlog</option></select></div>
        <div class="form-group"><label for="content-editor">Content</label><div id="content-editor"></div></div>
        <div class="form-group"><label for="video_url">Video URL (for vlogs)</label><input type="url" id="video_url" value="${data.video_url || ''}"></div>
        <div class="form-group"><label>Current Image</label><br><img src="${data.image_url}" alt="${data.title}" style="width:100px; height:100px; object-fit:cover;"></div>
        <div class="form-group"><label for="image">Upload New Image (optional)</label><input type="file" id="image" accept="image/*"></div>
        <button type="submit" class="btn btn-primary">Update Post</button>`;

    // --- UPGRADED QUILL TOOLBAR OPTIONS ---
    const toolbarOptions = [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
    ];

    const quill = new Quill('#content-editor', {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        }
    });
    quill.root.innerHTML = data.content || '';

    document.getElementById('post-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let imageUrl = data.image_url;
        const imageFile = form.querySelector('#image').files[0];
        if (imageFile) {
            const filePath = `post-${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageFile);
            if (uploadError) { alert('Failed to upload new image.'); return; }
            imageUrl = supabase.storage.from('post-images').getPublicUrl(filePath).data.publicUrl;
        }

        const content = quill.root.innerHTML;

        const { error: updateError } = await supabase.from('posts').update({ title: form.querySelector('#title').value, post_type: form.querySelector('#post_type').value, content: content, video_url: form.querySelector('#video_url').value, image_url: imageUrl, }).eq('id', id);
        if (updateError) { alert('Failed to update post.'); } else { alert('Post updated successfully!'); loadPosts(); }
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