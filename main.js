// admin/main.js (FINAL, SELF-CONTAINED, WORKING VERSION)

import { supabase } from './supabaseClient.js';
import Quill from 'https://cdn.skypack.dev/quill@1.3.6';

// =========================================================================
// === UI HELPER FUNCTIONS (ALERT & CONFIRM) - SELF-CONTAINED HERE ===
// =========================================================================

/**
 * Displays a custom toast notification.
 */
function showAlert(message, type = 'info', duration = 5000) {
    const customAlert = document.getElementById('custom-alert');
    if (!customAlert) {
        console.error("Custom alert element not found in the DOM.");
        return;
    }
    const alertMessage = customAlert.querySelector('.alert-message');
    // Use a static variable on the function to hold the timeout, preventing clashes
    clearTimeout(showAlert.timeout);
    alertMessage.textContent = message;
    customAlert.className = 'custom-alert';
    customAlert.classList.add(`alert-${type}`);
    customAlert.classList.add('active');
    showAlert.timeout = setTimeout(() => {
        customAlert.classList.remove('active');
    }, duration);
    const closeButton = customAlert.querySelector('.close-alert');
    closeButton.addEventListener('click', () => {
        clearTimeout(showAlert.timeout);
        customAlert.classList.remove('active');
    }, { once: true });
}

/**
 * Shows a custom confirmation dialog.
 * This version finds elements *when called*, fixing the timing bug.
 */
function showConfirm(options = {}) {
    // Get elements every time to ensure they exist when the function is called
    const confirmModal = document.getElementById('confirm-modal');
    if (!confirmModal) {
        console.error("Confirmation modal element not found in the DOM!");
        return Promise.resolve(false); // Fail gracefully
    }
    const confirmTitleEl = confirmModal.querySelector('.confirm-title');
    const confirmTextEl = confirmModal.querySelector('.confirm-text');
    const btnYes = document.getElementById('confirm-btn-yes');
    const btnNo = document.getElementById('confirm-btn-no');

    const {
        title = 'Are you sure?',
        text = 'This action cannot be undone.',
        confirmButtonText = 'Delete'
    } = options;

    confirmTitleEl.textContent = title;
    confirmTextEl.textContent = text;
    btnYes.textContent = confirmButtonText;

    confirmModal.classList.add('active');

    return new Promise((resolve) => {
        // --- THIS IS THE KEY FIX ---
        // Create new "cloned" buttons to ensure old event listeners are gone
        const newBtnYes = btnYes.cloneNode(true);
        const newBtnNo = btnNo.cloneNode(true);
        btnYes.parentNode.replaceChild(newBtnYes, btnYes);
        btnNo.parentNode.replaceChild(newBtnNo, btnNo);

        const handleYes = () => {
            confirmModal.classList.remove('active');
            resolve(true);
        };

        const handleNo = () => {
            confirmModal.classList.remove('active');
            resolve(false);
        };

        newBtnYes.addEventListener('click', handleYes);
        newBtnNo.addEventListener('click', handleNo);
    });
}


// =========================================================================
// === MAIN APPLICATION LOGIC (ALL YOUR ORIGINAL CODE, UNCHANGED) ===
// =========================================================================

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
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });
    if (error) {
        loginError.textContent = error.message;
    } else {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        loginError.textContent = '';
        showAlert(`Welcome back!`, 'success', 3000);
        checkSession();
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
    const userConfirmed = await showConfirm({
        title: 'Confirm Deletion',
        text: `Are you sure you want to permanently delete this item?`,
        confirmButtonText: 'Yes, Delete'
    });

    if (userConfirmed) {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
            showAlert(`Failed to delete item. Please try again.`, 'error');
            console.error(error);
        } else {
            showAlert('Item deleted successfully!', 'success');
            callback();
        }
    } else {
        showAlert('Deletion cancelled.', 'info', 2000);
    }
}

// The rest of your CRUD functions are here, unchanged...
// They will now call the working showAlert and showConfirm functions.

async function loadBookings() {
    contentArea.innerHTML = '<h1>Loading booking requests...</h1>';
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching bookings:', error); contentArea.innerHTML = 'Error loading data.'; return; }
    contentArea.innerHTML = `<h1>View Booking Requests</h1><hr>`;
    if (data.length === 0) { contentArea.innerHTML += '<p>No booking requests yet.</p>'; return; }
    data.forEach(item => { contentArea.insertAdjacentHTML('beforeend', `<div class="item-card booking-card ${!item.is_contacted ? 'unread' : ''}" data-id="${item.id}"><div class="content"><h3>${item.full_name} - <span style="color:var(--primary-orange);">${item.service}</span></h3><div class="meta-info"><strong>Contact:</strong> ${item.email} | ${item.phone}<br><strong>Received:</strong> ${new Date(item.created_at).toLocaleString()}</div>${item.message ? `<div class="message-body">${item.message}</div>` : ''}</div><div class="actions"><button class="btn toggle-contacted-btn" data-id="${item.id}" data-is-contacted="${item.is_contacted}">Mark as ${item.is_contacted ? 'Pending' : 'Contacted'}</button><button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button></div></div>`); });
}
async function loadContacts() {
    contentArea.innerHTML = '<h1>Loading contacts...</h1>';
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching contacts:', error); contentArea.innerHTML = 'Error loading data.'; return; }
    contentArea.innerHTML = `<h1>View Contacts</h1><hr>`;
    if (data.length === 0) { contentArea.innerHTML += '<p>No contact messages yet.</p>'; return; }
    data.forEach(item => { contentArea.insertAdjacentHTML('beforeend', `<div class="item-card contact-card ${item.is_read ? '' : 'unread'}" data-id="${item.id}"><div class="content"><h3>${item.subject}</h3><div class="meta-info"><strong>From:</strong> ${item.full_name} (${item.email})<br><strong>Received:</strong> ${new Date(item.created_at).toLocaleString()}</div><div class="message-body">${item.message}</div></div><div class="actions"><button class="btn toggle-read-btn" data-id="${item.id}" data-is-read="${item.is_read}">Mark as ${item.is_read ? 'Unread' : 'Read'}</button><button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button></div></div>`); });
}
async function loadServices() {
    contentArea.innerHTML = '<h1>Loading service pricing...</h1>';
    const { data, error } = await supabase.from('services').select('id');
    if (error) { console.error('Error fetching services:', error); contentArea.innerHTML = 'Error loading data.'; return; }
    contentArea.innerHTML = `<h1>Manage Service Pricing</h1><hr>`;
    if (data.length === 0) { contentArea.innerHTML += '<p>No services found. Please setup the services table in Supabase.</p>'; return; }
    const serviceTitles = { 'one-on-one': 'One-on-One Personal Training', 'online': 'Online Coaching', 'nutrition': 'Nutrition Coaching' };
    data.forEach(item => { contentArea.insertAdjacentHTML('beforeend', `<div class="item-card service-card" data-id="${item.id}"><div class="content"><h3>${serviceTitles[item.id] || 'Unknown Service'}</h3><p>Click "Edit" to manage the pricing for this service.</p></div><div class="actions"><button class="btn edit-btn"><i class="fa-solid fa-pencil"></i> Edit Pricing</button></div></div>`); });
}
async function showEditServiceForm(id) {
    const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
    if (error) { showAlert('Could not load service pricing.', 'error'); loadServices(); return; }
    const serviceTitles = { 'one-on-one': 'One-on-One', 'online': 'Online', 'nutrition': 'Nutrition' };
    const title = serviceTitles[id] || 'Service';
    const pricingTiersHtml = data.pricing.tiers.map((tier, index) => `<div class="form-group pricing-tier-group"><h4>Tier ${index + 1}</h4><label>Name:</label><input type="text" class="pricing-name" value="${tier.name}" required><label>Price:</label><input type="text" class="pricing-price" value="${tier.price}" required><label>Note (e.g., "(Ksh75/session)"):</label><input type="text" class="pricing-note" value="${tier.note || ''}"></div>`).join('<hr style="border-style: dashed; margin: 1rem 0;">');
    contentArea.innerHTML = `<h1>Edit Pricing for ${title}</h1><form class="item-form" id="service-edit-form"><h3>Pricing Tiers</h3><div id="pricing-tiers-container">${pricingTiersHtml}</div><button type="submit" class="btn btn-primary">Update Pricing</button></form>`;
    document.getElementById('service-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const tiers = [];
        form.querySelectorAll('.pricing-tier-group').forEach(container => { tiers.push({ name: container.querySelector('.pricing-name').value, price: container.querySelector('.pricing-price').value, note: container.querySelector('.pricing-note').value }); });
        const updatedData = { pricing: { tiers } };
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
async function loadTestimonials() {
    contentArea.innerHTML = '<h1>Loading testimonials...</h1>';
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching testimonials:', error); contentArea.innerHTML = 'Error loading data.'; return; }
    contentArea.innerHTML = `<h1>Manage Testimonials</h1><button id="add-testimonial-btn" class="btn btn-primary">Add New Testimonial</button><hr>`;
    if (data.length === 0) { contentArea.innerHTML += '<p>No testimonials found. Click "Add New" to start.</p>'; return; }
    data.forEach(item => { contentArea.insertAdjacentHTML('beforeend', `<div class="item-card testimonial-card" data-id="${item.id}"><div class="content"><h3>${item.client_name}</h3><p><strong>Program:</strong> ${item.program_type || 'N/A'}</p><p><em>"${item.quote}"</em></p></div><div class="actions"><button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button><button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button></div></div>`); });
}
function showAddTestimonialForm() {
    contentArea.innerHTML = `<h1>Add New Testimonial</h1><form class="item-form" id="testimonial-form"></form>`;
    document.getElementById('testimonial-form').innerHTML = `<div class="form-group"><label for="client_name">Client Name</label><input type="text" id="client_name" required></div><div class="form-group"><label for="program_type">Program Type</label><input type="text" id="program_type"></div><div class="form-group"><label for="quote">Quote</label><textarea id="quote" rows="4" required></textarea></div><div class="form-group"><label for="image_before">"Before" Image</label><input type="file" id="image_before" accept="image/*" required></div><div class="form-group"><label for="image_after">"After" Image</label><input type="file" id="image_after" accept="image/*" required></div><div class="form-group"><label for="video_url">Video URL (optional, e.g., YouTube)</label><input type="url" id="video_url" placeholder="https://www.youtube.com/watch?v=..."></div><button type="submit" class="btn btn-primary">Save Testimonial</button>`;
    document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const beforeFile = form.querySelector('#image_before').files[0];
        const afterFile = form.querySelector('#image_after').files[0];
        if (!beforeFile || !afterFile) { return showAlert('Both "before" and "after" images are required.', 'error'); }
        const beforeFilePath = `testimonial-before-${Date.now()}-${beforeFile.name}`;
        let { error: beforeError } = await supabase.storage.from('testimonials-images').upload(beforeFilePath, beforeFile);
        if (beforeError) { showAlert('Failed to upload "before" image.', 'error'); return; }
        const { data: { publicUrl: beforeImageUrl } } = supabase.storage.from('testimonials-images').getPublicUrl(beforeFilePath);
        const afterFilePath = `testimonial-after-${Date.now()}-${afterFile.name}`;
        let { error: afterError } = await supabase.storage.from('testimonials-images').upload(afterFilePath, afterFile);
        if (afterError) { showAlert('Failed to upload "after" image.', 'error'); return; }
        const { data: { publicUrl: afterImageUrl } } = supabase.storage.from('testimonials-images').getPublicUrl(afterFilePath);
        const { error: insertError } = await supabase.from('testimonials').insert([{ client_name: form.querySelector('#client_name').value, program_type: form.querySelector('#program_type').value, quote: form.querySelector('#quote').value, image_before_url: beforeImageUrl, image_after_url: afterImageUrl, video_url: form.querySelector('#video_url').value, }]);
        if (insertError) {
            showAlert('Failed to add testimonial.', 'error');
            console.error(insertError);
        } else {
            showAlert('Testimonial added successfully!', 'success');
            loadTestimonials();
        }
    });
}
async function showEditTestimonialForm(id) {
    const { data, error } = await supabase.from('testimonials').select('*').eq('id', id).single();
    if (error) { showAlert('Could not load testimonial data.', 'error'); loadTestimonials(); return; }
    contentArea.innerHTML = `<h1>Edit Testimonial</h1><form class="item-form" id="testimonial-edit-form"></form>`;
    document.getElementById('testimonial-edit-form').innerHTML = `<div class="form-group"><label for="client_name">Client Name</label><input type="text" id="client_name" value="${data.client_name}" required></div><div class="form-group"><label for="program_type">Program Type</label><input type="text" id="program_type" value="${data.program_type || ''}"></div><div class="form-group"><label for="quote">Quote</label><textarea id="quote" rows="4" required>${data.quote}</textarea></div><div class="form-group"><label>Current "Before" Image</label><br><img src="${data.image_before_url || 'https://placehold.co/100x100'}" style="width:100px; height:100px; object-fit:cover;"></div><div class="form-group"><label for="image_before">Upload New "Before" Image (optional)</label><input type="file" id="image_before" accept="image/*"></div><div class="form-group"><label>Current "After" Image</label><br><img src="${data.image_after_url || 'https://placehold.co/100x100'}" style="width:100px; height:100px; object-fit:cover;"></div><div class="form-group"><label for="image_after">Upload New "After" Image (optional)</label><input type="file" id="image_after" accept="image/*"></div><div class="form-group"><label for="video_url">Video URL (optional)</label><input type="url" id="video_url" value="${data.video_url || ''}"></div><button type="submit" class="btn btn-primary">Update Testimonial</button>`;
    document.getElementById('testimonial-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let beforeImageUrl = data.image_before_url;
        let afterImageUrl = data.image_after_url;
        const beforeFile = form.querySelector('#image_before').files[0];
        if (beforeFile) {
            const filePath = `testimonial-before-${Date.now()}-${beforeFile.name}`;
            const { error: uploadError } = await supabase.storage.from('testimonials-images').upload(filePath, beforeFile);
            if (uploadError) { showAlert('Failed to upload new "before" image.', 'error'); return; }
            const { data: { publicUrl } } = supabase.storage.from('testimonials-images').getPublicUrl(filePath);
            beforeImageUrl = publicUrl;
        }
        const afterFile = form.querySelector('#image_after').files[0];
        if (afterFile) {
            const filePath = `testimonial-after-${Date.now()}-${afterFile.name}`;
            const { error: uploadError } = await supabase.storage.from('testimonials-images').upload(filePath, afterFile);
            if (uploadError) { showAlert('Failed to upload new "after" image.', 'error'); return; }
            const { data: { publicUrl } } = supabase.storage.from('testimonials-images').getPublicUrl(filePath);
            afterImageUrl = publicUrl;
        }
        const { error: updateError } = await supabase.from('testimonials').update({ client_name: form.querySelector('#client_name').value, program_type: form.querySelector('#program_type').value, quote: form.querySelector('#quote').value, image_before_url: beforeImageUrl, image_after_url: afterImageUrl, video_url: form.querySelector('#video_url').value, }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update testimonial.', 'error');
        } else {
            showAlert('Testimonial updated successfully!', 'success');
            loadTestimonials();
        }
    });
}
async function loadMerchandise() {
    contentArea.innerHTML = '<h1>Loading merchandise...</h1>';
    const { data, error } = await supabase.from('merchandise').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching merchandise:', error); contentArea.innerHTML = 'Error loading data.'; return; }
    contentArea.innerHTML = `<h1>Manage Merchandise</h1><button id="add-merch-btn" class="btn btn-primary">Add New Product</button><hr>`;
    if (data.length === 0) { contentArea.innerHTML += '<p>No products found. Click "Add New" to start.</p>'; return; }
    data.forEach(item => { contentArea.insertAdjacentHTML('beforeend', `<div class="item-card merch-card" data-id="${item.id}"><img src="${item.image_url}" alt="${item.name}"><div class="content"><h3>${item.name}</h3><p><strong>Price:</strong> Ksh${item.price}</p><p>${item.description || ''}</p></div><div class="actions"><button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button><button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button></div></div>`); });
}
function showAddMerchandiseForm() {
    contentArea.innerHTML = `<h1>Add New Product</h1><form class="item-form" id="merch-form"></form>`;
    document.getElementById('merch-form').innerHTML = `<div class="form-group"><label for="name">Product Name</label><input type="text" id="name" required></div><div class="form-group"><label for="price">Price (e.g., 25.00)</label><input type="number" step="0.01" id="price" required></div><div class="form-group"><label for="description">Description</label><textarea id="description" rows="4"></textarea></div><div class="form-group"><label for="image">Product Image</label><input type="file" id="image" accept="image/*" required></div><button type="submit" class="btn btn-primary">Save Product</button>`;
    document.getElementById('merch-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const imageFile = form.querySelector('#image').files[0];
        if (!imageFile) { return showAlert('Product image is required.', 'error'); }
        const filePath = `merch-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('merchandise-images').upload(filePath, imageFile);
        if (uploadError) { showAlert('Failed to upload image.', 'error'); console.error(uploadError); return; }
        const { data: { publicUrl } } = supabase.storage.from('merchandise-images').getPublicUrl(filePath);
        const { error: insertError } = await supabase.from('merchandise').insert([{ name: form.querySelector('#name').value, price: form.querySelector('#price').value, description: form.querySelector('#description').value, image_url: publicUrl, }]);
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
    contentArea.innerHTML = `<h1>Edit Product</h1><form class="item-form" id="merch-edit-form"></form>`;
    document.getElementById('merch-edit-form').innerHTML = `<div class="form-group"><label for="name">Product Name</label><input type="text" id="name" value="${data.name}" required></div><div class="form-group"><label for="price">Price</label><input type="number" step="0.01" id="price" value="${data.price}" required></div><div class="form-group"><label for="description">Description</label><textarea id="description" rows="4">${data.description || ''}</textarea></div><div class="form-group"><label>Current Image</label><br><img src="${data.image_url}" alt="${data.name}" style="width:100px; height:100px; object-fit:cover;"></div><div class="form-group"><label for="image">Upload New Image (optional)</label><input type="file" id="image" accept="image/*"></div><button type="submit" class="btn btn-primary">Update Product</button>`;
    document.getElementById('merch-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let imageUrl = data.image_url;
        const imageFile = form.querySelector('#image').files[0];
        if (imageFile) {
            const filePath = `merch-${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('merchandise-images').upload(filePath, imageFile);
            if (uploadError) { showAlert('Failed to upload new image.', 'error'); return; }
            const { data: { publicUrl } } = supabase.storage.from('merchandise-images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }
        const { error: updateError } = await supabase.from('merchandise').update({ name: form.querySelector('#name').value, price: form.querySelector('#price').value, description: form.querySelector('#description').value, image_url: imageUrl, }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update product.', 'error');
        } else {
            showAlert('Product updated successfully!', 'success');
            loadMerchandise();
        }
    });
}
async function loadPosts() {
    contentArea.innerHTML = '<h1>Loading posts...</h1>';
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching posts:', error); contentArea.innerHTML = 'Error loading data.'; return; }
    contentArea.innerHTML = `<h1>Manage Posts</h1><button id="add-post-btn" class="btn btn-primary">Add New Post</button><hr>`;
    if (data.length === 0) { contentArea.innerHTML += '<p>No posts found. Click "Add New" to start.</p>'; return; }
    data.forEach(item => { contentArea.insertAdjacentHTML('beforeend', `<div class="item-card post-card" data-id="${item.id}"><img src="${item.image_url}" alt="${item.title}"><div class="content"><h3>${item.title}</h3><p><strong>Type:</strong> ${item.post_type}</p></div><div class="actions"><button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button><button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button></div></div>`); });
}
function showAddPostForm() {
    contentArea.innerHTML = `<h1>Add New Post</h1><form class="item-form" id="post-form"></form>`;
    document.getElementById('post-form').innerHTML = `<div class="form-group"><label for="title">Title</label><input type="text" id="title" required></div><div class="form-group"><label for="post_type">Post Type</label><select id="post_type" required><option value="blog">Blog</option><option value="vlog">Vlog</option></select></div><div class="form-group"><label for="content-editor">Content</label><div id="content-editor"></div></div><div class="form-group"><label for="video_url">Video URL (for vlogs, e.g., YouTube)</label><input type="url" id="video_url" placeholder="https://www.youtube.com/watch?v=..."></div><div class="form-group"><label for="image">Cover Image</label><input type="file" id="image" accept="image/*" required></div><button type="submit" class="btn btn-primary">Save Post</button>`;
    const quill = new Quill('#content-editor', { theme: 'snow', modules: { toolbar: fullToolbarOptions } });
    document.getElementById('post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const imageFile = form.querySelector('#image').files[0];
        if (!imageFile) { return showAlert('Cover image is required.', 'error'); }
        const filePath = `post-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageFile);
        if (uploadError) { showAlert('Failed to upload image.', 'error'); console.error(uploadError); return; }
        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
        const content = quill.root.innerHTML;
        const { error: insertError } = await supabase.from('posts').insert([{ title: form.querySelector('#title').value, post_type: form.querySelector('#post_type').value, content, video_url: form.querySelector('#video_url').value, image_url: publicUrl, }]);
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
    contentArea.innerHTML = `<h1>Edit Post</h1><form class="item-form" id="post-edit-form"></form>`;
    document.getElementById('post-edit-form').innerHTML = `<div class="form-group"><label for="title">Title</label><input type="text" id="title" value="${data.title}" required></div><div class="form-group"><label for="post_type">Post Type</label><select id="post_type" required><option value="blog" ${data.post_type === 'blog' ? 'selected' : ''}>Blog</option><option value="vlog" ${data.post_type === 'vlog' ? 'selected' : ''}>Vlog</option></select></div><div class="form-group"><label for="content-editor">Content</label><div id="content-editor"></div></div><div class="form-group"><label for="video_url">Video URL (for vlogs)</label><input type="url" id="video_url" value="${data.video_url || ''}"></div><div class="form-group"><label>Current Image</label><br><img src="${data.image_url}" alt="${data.title}" style="width:100px; height:100px; object-fit:cover;"></div><div class="form-group"><label for="image">Upload New Image (optional)</label><input type="file" id="image" accept="image/*"></div><button type="submit" class="btn btn-primary">Update Post</button>`;
    const quill = new Quill('#content-editor', { theme: 'snow', modules: { toolbar: fullToolbarOptions } });
    quill.root.innerHTML = data.content || '';
    document.getElementById('post-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let imageUrl = data.image_url;
        const imageFile = form.querySelector('#image').files[0];
        if (imageFile) {
            const filePath = `post-${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageFile);
            if (uploadError) { showAlert('Failed to upload new image.', 'error'); return; }
            const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }
        const content = quill.root.innerHTML;
        const { error: updateError } = await supabase.from('posts').update({ title: form.querySelector('#title').value, post_type: form.querySelector('#post_type').value, content, video_url: form.querySelector('#video_url').value, image_url: imageUrl, }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update post.', 'error');
        } else {
            showAlert('Post updated successfully!', 'success');
            loadPosts();
        }
    });
}
async function loadSchedule() {
    contentArea.innerHTML = '<h1>Loading schedule...</h1>';
    const { data, error } = await supabase.from('schedule').select('*').order('start_time');
    if (error) { console.error('Error fetching schedule:', error); contentArea.innerHTML = 'Error loading data.'; return; }
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let scheduleByDay = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    if (data) data.forEach(item => scheduleByDay[item.day_of_week].push(item));
    let tableHtml = `<table class="schedule-table"><thead><tr>${daysOfWeek.map(day => `<th>${day}</th>`).join('')}</tr></thead><tbody><tr>`;
    for (let i = 1; i <= 7; i++) {
        tableHtml += `<td>`;
        scheduleByDay[i].forEach(item => {
            tableHtml += `<div class="item-card class-item" data-id="${item.id}"><strong>${item.class_name}</strong><br><small>${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}</small><div class="actions"><button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button><button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button></div></div>`;
        });
        tableHtml += `</td>`;
    }
    tableHtml += `</tr></tbody></table>`;
    contentArea.innerHTML = `<h1>Manage Schedule</h1><button id="add-class-btn" class="btn btn-primary">Add New Class</button><hr>${tableHtml}`;
}
function showAddScheduleForm() {
    contentArea.innerHTML = `<h1>Add New Class</h1><form class="item-form" id="schedule-form"></form>`;
    document.getElementById('schedule-form').innerHTML = `<div class="form-group"><label for="class_name">Class Name</label><input type="text" id="class_name" required></div><div class="form-group"><label for="day_of_week">Day of Week</label><select id="day_of_week" required><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="7">Sunday</option></select></div><div class="form-group"><label for="start_time">Start Time</label><input type="time" id="start_time" required></div><div class="form-group"><label for="end_time">End Time</label><input type="time" id="end_time" required></div><button type="submit" class="btn btn-primary">Save Class</button>`;
    document.getElementById('schedule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('schedule').insert([{ class_name: document.getElementById('class_name').value, day_of_week: document.getElementById('day_of_week').value, start_time: document.getElementById('start_time').value, end_time: document.getElementById('end_time').value }]);
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
    contentArea.innerHTML = `<h1>Edit Class</h1><form class="item-form" id="schedule-edit-form"></form>`;
    document.getElementById('schedule-edit-form').innerHTML = `<div class="form-group"><label for="class_name">Class Name</label><input type="text" id="class_name" value="${data.class_name}" required></div><div class="form-group"><label for="day_of_week">Day of Week</label><select id="day_of_week" required></select></div><div class="form-group"><label for="start_time">Start Time</label><input type="time" id="start_time" value="${data.start_time}" required></div><div class="form-group"><label for="end_time">End Time</label><input type="time" id="end_time" value="${data.end_time}" required></div><button type="submit" class="btn btn-primary">Update Class</button>`;
    const daySelect = document.getElementById('day_of_week');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach((day, index) => { const option = document.createElement('option'); option.value = index + 1; option.textContent = day; if ((index + 1) === data.day_of_week) option.selected = true; daySelect.appendChild(option); });
    document.getElementById('schedule-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error: updateError } = await supabase.from('schedule').update({ class_name: document.getElementById('class_name').value, day_of_week: document.getElementById('day_of_week').value, start_time: document.getElementById('start_time').value, end_time: document.getElementById('end_time').value }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update class.', 'error');
        } else {
            showAlert('Class updated successfully!', 'success');
            loadSchedule();
        }
    });
}


// --- EVENTS MANAGEMENT ---

async function loadEvents() {
    contentArea.innerHTML = '<h1>Loading events...</h1>';
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
    
    if (error) {
        console.error('Error fetching events:', error);
        contentArea.innerHTML = 'Error loading data.';
        return;
    }

    contentArea.innerHTML = `<h1>Manage Events</h1><button id="add-event-btn" class="btn btn-primary">Add New Event</button><hr>`;
    
    if (data.length === 0) {
        contentArea.innerHTML += '<p>No events found. Click "Add New" to start.</p>';
        return;
    }

    data.forEach(event => {
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const eventCard = `
            <div class="item-card event-card" data-id="${event.id}">
                <img src="${event.poster_url}" alt="${event.title}" style="width:150px; height:150px; object-fit:cover; border-radius:8px;">
                <div class="content">
                    <h3>${event.title}</h3>
                    <p><strong>Date:</strong> ${formattedDate} at ${event.event_time}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <p><strong>Type:</strong> ${event.event_type || 'N/A'}</p>
                    <p><strong>Status:</strong> ${event.status || 'upcoming'}</p>
                    ${event.description ? `<p>${event.description.substring(0, 100)}...</p>` : ''}
                </div>
                <div class="actions">
                    <button class="btn edit-btn"><i class="fa-solid fa-pencil"></i> Edit</button>
                    <button class="btn delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>`;
        contentArea.insertAdjacentHTML('beforeend', eventCard);
    });
}// --- SESSION CHECK ---
async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        if (contentArea.innerHTML.trim() === '') {
            loadBookings();
            document.querySelector('.sidebar button[data-target="bookings"]')?.classList.add('active');
        }
    } else {
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
    }
}
checkSession();