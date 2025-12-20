import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// --- SUPABASE CONFIGURATION ---
const supabaseUrl = 'https://wsssggnrfxdldeoahvso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzc3NnZ25yZnhkbGRlb2FodnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzkyMDMsImV4cCI6MjA3NzQxNTIwM30.N7UvKcH0VZKFezrVKOBPWR6vrOtmuyZR1e3sGxZtGoQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    }
});

// =========================================================================
// === UTILITIES (ALERTS & CONFIRMS) ===
// =========================================================================

function validateYouTubeUrl(url) {
    if (!url) return true; // Optional field
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
}

// --- MISSING FUNCTION ADDED HERE ---
function showAlert(message, type = 'info', duration = 5000) {
    const customAlert = document.getElementById('custom-alert');
    if (!customAlert) {
        // Fallback if the HTML element is missing
        alert(message);
        return;
    }

    const alertMessage = customAlert.querySelector('.alert-message');
    const closeBtn = customAlert.querySelector('.close-alert');

    // Set message and type
    alertMessage.textContent = message;
    customAlert.className = 'custom-alert'; // Reset classes
    customAlert.classList.add(`alert-${type}`);
    customAlert.classList.add('active');

    // Handle auto-close
    if (customAlert.timeoutId) clearTimeout(customAlert.timeoutId);
    customAlert.timeoutId = setTimeout(() => {
        customAlert.classList.remove('active');
    }, duration);

    // Handle close button click
    if (closeBtn) {
        closeBtn.onclick = () => {
            clearTimeout(customAlert.timeoutId);
            customAlert.classList.remove('active');
        };
    }
}

function showConfirm(options = {}) {
    const confirmModal = document.getElementById('confirm-modal');
    if (!confirmModal) {
        console.error('Confirm modal element not found');
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
// === MAIN APPLICATION LOGIC ===
// =========================================================================

// --- CONFIGURATION ---
const fullToolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'image', 'video'],
    ['clean']
];

// --- DOM ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const logoutButton = document.getElementById('logout-button');
const dashboardNav = document.querySelector('.sidebar');
const contentArea = document.getElementById('content-area');

// --- AUTHENTICATION LOGIC ---

// 1. Handle Login Form Submit
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;
        loginError.textContent = 'Logging in...';

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            loginError.textContent = error.message;
        } else {
            loginError.textContent = '';
        }
    });
}

// 2. Handle Logout
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await supabase.auth.signOut();
    });
}

// 3. Listen for Auth State Changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        checkSession();
    } else if (event === 'SIGNED_OUT') {
        checkSession();
    }
});


// --- NAVIGATION LOGIC ---
if (dashboardNav) {
    dashboardNav.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        dashboardNav.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const target = button.dataset.target;

        switch (target) {
            case 'bookings':
                loadBookings();
                break;
            case 'contacts':
                contentArea.innerHTML = '<h1>Contacts</h1><p>Contact management coming soon.</p>';
                break;
            case 'services':
                loadServices();
                break;
            case 'testimonials':
                loadTestimonials();
                break;
            case 'posts':
                loadPosts();
                break;
            case 'merchandise':
                loadMerchandise();
                break;
            case 'schedule':
                loadSchedule();
                break;
            case 'events':
                loadEvents();
                break;
            case 'event-bookings':
                loadEventBookings();
                break;
            case 'library':
                loadTutorials();
                break;
            default:
                contentArea.innerHTML = '<h1>Welcome</h1><p>Select an option from the menu.</p>';
        }
    });
}

// --- MISSING FUNCTION: LOAD BOOKINGS ---
async function loadBookings() {
    contentArea.innerHTML = '<h1>Loading Bookings...</h1>';
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });

    if (error) {
        console.warn('Bookings table might not exist yet:', error);
        contentArea.innerHTML = '<h1>Manage Bookings</h1><hr><p>No bookings found or table not setup.</p>';
        return;
    }

    contentArea.innerHTML = `<h1>Manage Bookings</h1><hr>`;
    if (!data || data.length === 0) {
        contentArea.innerHTML += '<p>No bookings found.</p>';
        return;
    }

    data.forEach(item => {
        contentArea.insertAdjacentHTML('beforeend', `
            <div class="item-card booking-card">
                <div class="content">
                    <h3>Booking #${item.id}</h3>
                    <p>Details: ${JSON.stringify(item)}</p>
                </div>
            </div>`);
    });
}


// --- SERVICES MANAGEMENT ---
async function loadServices() {
    contentArea.innerHTML = '<h1>Loading services...</h1>';
    const { data, error } = await supabase.from('services').select('*');
    if (error) {
        console.error('Error fetching services:', error);
        contentArea.innerHTML = 'Error loading data.';
        return;
    }
    contentArea.innerHTML = `<h1>Manage Services</h1><hr>`;
    if (data.length === 0) {
        contentArea.innerHTML += '<p>No services found. Please setup the services table in Supabase.</p>';
        return;
    }
    const serviceTitles = {
        'one-on-one': 'One-on-One Personal Training',
        'online': 'Online Coaching',
        'nutrition': 'Nutrition Coaching'
    };
    data.forEach(item => {
        contentArea.insertAdjacentHTML('beforeend', `
            <div class="item-card service-card" data-id="${item.id}">
                <div class="content">
                    <h3>${serviceTitles[item.id] || 'Unknown Service'}</h3>
                    <p>Click "Edit" to manage the content for this service.</p>
                </div>
                <div class="actions">
                    <button class="btn edit-btn"><i class="fa-solid fa-pencil"></i> Edit Service</button>
                </div>
            </div>`);
    });

    contentArea.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.item-card').dataset.id;
            showEditServiceForm(id);
        });
    });
}

async function showEditServiceForm(id) {
    const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
    if (error) {
        showAlert('Could not load service data.', 'error');
        loadServices();
        return;
    }
    const serviceTitles = {
        'one-on-one': 'One-on-One Personal Training',
        'online': 'Online Coaching',
        'nutrition': 'Nutrition Coaching'
    };
    const title = serviceTitles[id] || 'Service';

    // Prepare existing data or defaults
    const serviceName = data.name || title;
    const serviceDescription = data.description || '';
    const whoFor = data.who_for || [];
    const whatsIncluded = data.whats_included || [];

    contentArea.innerHTML = `
        <h1>Edit ${title}</h1>
        <form class="item-form" id="service-edit-form">
            <div class="form-group">
                <label for="service-name">Service Name:</label>
                <input type="text" id="service-name" value="${serviceName}" required>
            </div>
            <div class="form-group">
                <label for="service-description">Description:</label>
                <textarea id="service-description" rows="4" required>${serviceDescription}</textarea>
            </div>
            <div class="form-group">
                <label for="service-who-for">Who This Is For (one item per line):</label>
                <textarea id="service-who-for" rows="5" placeholder="Enter each point on a new line">${whoFor.join('\n')}</textarea>
            </div>
            <div class="form-group">
                <label for="service-whats-included">What's Included (one item per line):</label>
                <textarea id="service-whats-included" rows="6" placeholder="Enter each point on a new line">${whatsIncluded.join('\n')}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">Update Service</button>
        </form>`;

    document.getElementById('service-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        // Parse textarea inputs into arrays (split by newline, filter empty lines)
        const whoForArray = form.querySelector('#service-who-for').value
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        const whatsIncludedArray = form.querySelector('#service-whats-included').value
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);

        const updatedData = {
            name: form.querySelector('#service-name').value,
            description: form.querySelector('#service-description').value,
            who_for: whoForArray,
            whats_included: whatsIncludedArray
        };

        const { error: updateError } = await supabase.from('services').update(updatedData).eq('id', id);
        if (updateError) {
            showAlert('Failed to update service.', 'error');
            console.error(updateError);
        } else {
            showAlert('Service updated successfully!', 'success');
            loadServices();
        }
    });
}


// --- TESTIMONIALS MANAGEMENT ---
async function loadTestimonials() {
    contentArea.innerHTML = '<h1>Loading testimonials...</h1>';
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching testimonials:', error);
        contentArea.innerHTML = 'Error loading data.';
        return;
    }
    contentArea.innerHTML = `<h1>Manage Testimonials</h1><button id="add-testimonial-btn" class="btn btn-primary">Add New Testimonial</button><hr>`;

    if (data.length === 0) {
        contentArea.insertAdjacentHTML('beforeend', '<p>No testimonials found. Click "Add New" to start.</p>');
    } else {
        data.forEach(item => {
            contentArea.insertAdjacentHTML('beforeend', `
                <div class="item-card testimonial-card" data-id="${item.id}">
                    <div class="content">
                        <h3>${item.client_name}</h3>
                        <p><strong>Program:</strong> ${item.program_type || 'N/A'}</p>
                        <p><em>"${item.quote}"</em></p>
                    </div>
                    <div class="actions">
                        <button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`);
        });
    }

    // Attach listener AFTER HTML updates
    const addBtn = document.getElementById('add-testimonial-btn');
    if (addBtn) addBtn.addEventListener('click', showAddTestimonialForm);

    contentArea.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showEditTestimonialForm(e.target.closest('.item-card').dataset.id));
    });
    contentArea.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('.item-card').dataset.id;
            const confirmed = await showConfirm({ title: 'Delete Testimonial?', text: 'This will permanently remove this testimonial.' });
            if (confirmed) {
                await supabase.from('testimonials').delete().eq('id', id);
                loadTestimonials();
            }
        });
    });
}

function showAddTestimonialForm() {
    contentArea.innerHTML = `<h1>Add New Testimonial</h1><form class="item-form" id="testimonial-form"></form>`;
    document.getElementById('testimonial-form').innerHTML = `
        <div class="form-group"><label for="client_name">Client Name</label><input type="text" id="client_name" required></div>
        <div class="form-group"><label for="program_type">Program Type</label><input type="text" id="program_type"></div>
        <div class="form-group"><label for="quote">Quote</label><textarea id="quote" rows="4" required></textarea></div>
        <div class="form-group"><label for="image_before">"Before" Image</label><input type="file" id="image_before" accept="image/*" required></div>
        <div class="form-group"><label for="image_after">"After" Image</label><input type="file" id="image_after" accept="image/*" required></div>
        <div class="form-group"><label for="video_url">Video URL (optional, e.g., YouTube)</label><input type="url" id="video_url" placeholder="https://www.youtube.com/watch?v=..."></div>
        <button type="submit" class="btn btn-primary">Save Testimonial</button>`;

    document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const beforeFile = form.querySelector('#image_before').files[0];
        const afterFile = form.querySelector('#image_after').files[0];
        if (!beforeFile || !afterFile) {
            return showAlert('Both "before" and "after" images are required.', 'error');
        }

        const beforeFilePath = `testimonial-before-${Date.now()}-${beforeFile.name}`;
        let { error: beforeError } = await supabase.storage.from('testimonials-images').upload(beforeFilePath, beforeFile);
        if (beforeError) {
            showAlert('Failed to upload "before" image.', 'error');
            return;
        }
        const { data: { publicUrl: beforeImageUrl } } = supabase.storage.from('testimonials-images').getPublicUrl(beforeFilePath);

        const afterFilePath = `testimonial-after-${Date.now()}-${afterFile.name}`;
        let { error: afterError } = await supabase.storage.from('testimonials-images').upload(afterFilePath, afterFile);
        if (afterError) {
            showAlert('Failed to upload "after" image.', 'error');
            return;
        }
        const { data: { publicUrl: afterImageUrl } } = supabase.storage.from('testimonials-images').getPublicUrl(afterFilePath);

        const { error: insertError } = await supabase.from('testimonials').insert([{
            client_name: form.querySelector('#client_name').value,
            program_type: form.querySelector('#program_type').value,
            quote: form.querySelector('#quote').value,
            image_before_url: beforeImageUrl,
            image_after_url: afterImageUrl,
            video_url: form.querySelector('#video_url').value,
        }]);

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
    if (error) {
        showAlert('Could not load testimonial data.', 'error');
        loadTestimonials();
        return;
    }
    contentArea.innerHTML = `<h1>Edit Testimonial</h1><form class="item-form" id="testimonial-edit-form"></form>`;
    document.getElementById('testimonial-edit-form').innerHTML = `
        <div class="form-group"><label for="client_name">Client Name</label><input type="text" id="client_name" value="${data.client_name}" required></div>
        <div class="form-group"><label for="program_type">Program Type</label><input type="text" id="program_type" value="${data.program_type || ''}"></div>
        <div class="form-group"><label for="quote">Quote</label><textarea id="quote" rows="4" required>${data.quote}</textarea></div>
        <div class="form-group"><label>Current "Before" Image</label><br><img src="${data.image_before_url || 'https://placehold.co/100x100'}" style="width:100px; height:100px; object-fit:cover;"></div>
        <div class="form-group"><label for="image_before">Upload New "Before" Image (optional)</label><input type="file" id="image_before" accept="image/*"></div>
        <div class="form-group"><label>Current "After" Image</label><br><img src="${data.image_after_url || 'https://placehold.co/100x100'}" style="width:100px; height:100px; object-fit:cover;"></div>
        <div class="form-group"><label for="image_after">Upload New "After" Image (optional)</label><input type="file" id="image_after" accept="image/*"></div>
        <div class="form-group"><label for="video_url">Video URL (optional)</label><input type="url" id="video_url" value="${data.video_url || ''}"></div>
        <button type="submit" class="btn btn-primary">Update Testimonial</button>`;

    document.getElementById('testimonial-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let beforeImageUrl = data.image_before_url;
        let afterImageUrl = data.image_after_url;

        const beforeFile = form.querySelector('#image_before').files[0];
        if (beforeFile) {
            const filePath = `testimonial-before-${Date.now()}-${beforeFile.name}`;
            const { error: uploadError } = await supabase.storage.from('testimonials-images').upload(filePath, beforeFile);
            if (uploadError) {
                showAlert('Failed to upload new "before" image.', 'error');
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('testimonials-images').getPublicUrl(filePath);
            beforeImageUrl = publicUrl;
        }

        const afterFile = form.querySelector('#image_after').files[0];
        if (afterFile) {
            const filePath = `testimonial-after-${Date.now()}-${afterFile.name}`;
            const { error: uploadError } = await supabase.storage.from('testimonials-images').upload(filePath, afterFile);
            if (uploadError) {
                showAlert('Failed to upload new "after" image.', 'error');
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('testimonials-images').getPublicUrl(filePath);
            afterImageUrl = publicUrl;
        }

        const { error: updateError } = await supabase.from('testimonials').update({
            client_name: form.querySelector('#client_name').value,
            program_type: form.querySelector('#program_type').value,
            quote: form.querySelector('#quote').value,
            image_before_url: beforeImageUrl,
            image_after_url: afterImageUrl,
            video_url: form.querySelector('#video_url').value,
        }).eq('id', id);

        if (updateError) {
            showAlert('Failed to update testimonial.', 'error');
        } else {
            showAlert('Testimonial updated successfully!', 'success');
            loadTestimonials();
        }
    });
}

// --- MERCHANDISE MANAGEMENT ---
async function loadMerchandise() {
    contentArea.innerHTML = '<h1>Loading merchandise...</h1>';
    const { data, error } = await supabase.from('merchandise').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching merchandise:', error);
        contentArea.innerHTML = 'Error loading data.';
        return;
    }
    contentArea.innerHTML = `<h1>Manage Merchandise</h1><button id="add-merch-btn" class="btn btn-primary">Add New Product</button><hr>`;

    if (data.length === 0) {
        contentArea.insertAdjacentHTML('beforeend', '<p>No products found. Click "Add New" to start.</p>');
    } else {
        data.forEach(item => {
            contentArea.insertAdjacentHTML('beforeend', `
                <div class="item-card merch-card" data-id="${item.id}">
                    <img src="${item.image_url}" alt="${item.name}">
                    <div class="content">
                        <h3>${item.name}</h3>
                        <p><strong>Price:</strong> Ksh${item.price}</p>
                        <p>${item.description || ''}</p>
                    </div>
                    <div class="actions">
                        <button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`);
        });
    }

    const addBtn = document.getElementById('add-merch-btn');
    if (addBtn) addBtn.addEventListener('click', showAddMerchandiseForm);

    contentArea.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showEditMerchandiseForm(e.target.closest('.item-card').dataset.id));
    });
    contentArea.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('.item-card').dataset.id;
            if (await showConfirm({ title: 'Delete Product?' })) {
                await supabase.from('merchandise').delete().eq('id', id);
                loadMerchandise();
            }
        });
    });
}

function showAddMerchandiseForm() {
    contentArea.innerHTML = `<h1>Add New Product</h1><form class="item-form" id="merch-form"></form>`;
    document.getElementById('merch-form').innerHTML = `
        <div class="form-group"><label for="name">Product Name</label><input type="text" id="name" required></div>
        <div class="form-group"><label for="price">Price (e.g., 25.00)</label><input type="number" step="0.01" id="price" required></div>
        <div class="form-group"><label for="description">Description</label><textarea id="description" rows="4"></textarea></div>
        <div class="form-group"><label for="image">Product Image</label><input type="file" id="image" accept="image/*" required></div>
        <button type="submit" class="btn btn-primary">Save Product</button>`;

    document.getElementById('merch-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const imageFile = form.querySelector('#image').files[0];
        if (!imageFile) {
            return showAlert('Product image is required.', 'error');
        }
        const filePath = `merch-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('merchandise-images').upload(filePath, imageFile);
        if (uploadError) {
            showAlert('Failed to upload image.', 'error');
            console.error(uploadError);
            return;
        }
        const { data: { publicUrl } } = supabase.storage.from('merchandise-images').getPublicUrl(filePath);
        const { error: insertError } = await supabase.from('merchandise').insert([{
            name: form.querySelector('#name').value,
            price: form.querySelector('#price').value,
            description: form.querySelector('#description').value,
            image_url: publicUrl,
        }]);
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
    if (error) {
        showAlert('Could not load product data.', 'error');
        loadMerchandise();
        return;
    }
    contentArea.innerHTML = `<h1>Edit Product</h1><form class="item-form" id="merch-edit-form"></form>`;
    document.getElementById('merch-edit-form').innerHTML = `
        <div class="form-group"><label for="name">Product Name</label><input type="text" id="name" value="${data.name}" required></div>
        <div class="form-group"><label for="price">Price</label><input type="number" step="0.01" id="price" value="${data.price}" required></div>
        <div class="form-group"><label for="description">Description</label><textarea id="description" rows="4">${data.description || ''}</textarea></div>
        <div class="form-group"><label>Current Image</label><br><img src="${data.image_url}" alt="${data.name}" style="width:100px; height:100px; object-fit:cover;"></div>
        <div class="form-group"><label for="image">Upload New Image (optional)</label><input type="file" id="image" accept="image/*"></div>
        <button type="submit" class="btn btn-primary">Update Product</button>`;

    document.getElementById('merch-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let imageUrl = data.image_url;
        const imageFile = form.querySelector('#image').files[0];
        if (imageFile) {
            const filePath = `merch-${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('merchandise-images').upload(filePath, imageFile);
            if (uploadError) {
                showAlert('Failed to upload new image.', 'error');
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('merchandise-images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }
        const { error: updateError } = await supabase.from('merchandise').update({
            name: form.querySelector('#name').value,
            price: form.querySelector('#price').value,
            description: form.querySelector('#description').value,
            image_url: imageUrl,
        }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update product.', 'error');
        } else {
            showAlert('Product updated successfully!', 'success');
            loadMerchandise();
        }
    });
}

// --- POSTS MANAGEMENT ---
async function loadPosts() {
    contentArea.innerHTML = '<h1>Loading posts...</h1>';
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching posts:', error);
        contentArea.innerHTML = 'Error loading data.';
        return;
    }
    contentArea.innerHTML = `<h1>Manage Posts</h1><button id="add-post-btn" class="btn btn-primary">Add New Post</button><hr>`;

    if (data.length === 0) {
        contentArea.insertAdjacentHTML('beforeend', '<p>No posts found. Click "Add New" to start.</p>');
    } else {
        data.forEach(item => {
            contentArea.insertAdjacentHTML('beforeend', `
                <div class="item-card post-card" data-id="${item.id}">
                    <img src="${item.image_url}" alt="${item.title}">
                    <div class="content">
                        <h3>${item.title}</h3>
                        <p><strong>Type:</strong> ${item.post_type}</p>
                    </div>
                    <div class="actions">
                        <button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`);
        });
    }

    const addBtn = document.getElementById('add-post-btn');
    if (addBtn) addBtn.addEventListener('click', showAddPostForm);

    contentArea.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showEditPostForm(e.target.closest('.item-card').dataset.id));
    });
    contentArea.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('.item-card').dataset.id;
            if (await showConfirm({ title: 'Delete Post?' })) {
                await supabase.from('posts').delete().eq('id', id);
                loadPosts();
            }
        });
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

    const quill = new Quill('#content-editor', { theme: 'snow', modules: { toolbar: fullToolbarOptions } });

    document.getElementById('post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const imageFile = form.querySelector('#image').files[0];
        if (!imageFile) {
            return showAlert('Cover image is required.', 'error');
        }
        const filePath = `post-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageFile);
        if (uploadError) {
            showAlert('Failed to upload image.', 'error');
            console.error(uploadError);
            return;
        }
        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
        const content = quill.root.innerHTML;
        const { error: insertError } = await supabase.from('posts').insert([{
            title: form.querySelector('#title').value,
            post_type: form.querySelector('#post_type').value,
            content,
            video_url: form.querySelector('#video_url').value,
            image_url: publicUrl,
        }]);
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
    if (error) {
        showAlert('Could not load post data.', 'error');
        loadPosts();
        return;
    }
    contentArea.innerHTML = `<h1>Edit Post</h1><form class="item-form" id="post-edit-form"></form>`;
    document.getElementById('post-edit-form').innerHTML = `
        <div class="form-group"><label for="title">Title</label><input type="text" id="title" value="${data.title}" required></div>
        <div class="form-group"><label for="post_type">Post Type</label><select id="post_type" required><option value="blog" ${data.post_type === 'blog' ? 'selected' : ''}>Blog</option><option value="vlog" ${data.post_type === 'vlog' ? 'selected' : ''}>Vlog</option></select></div>
        <div class="form-group"><label for="content-editor">Content</label><div id="content-editor"></div></div>
        <div class="form-group"><label for="video_url">Video URL (for vlogs)</label><input type="url" id="video_url" value="${data.video_url || ''}"></div>
        <div class="form-group"><label>Current Image</label><br><img src="${data.image_url}" alt="${data.title}" style="width:100px; height:100px; object-fit:cover;"></div>
        <div class="form-group"><label for="image">Upload New Image (optional)</label><input type="file" id="image" accept="image/*"></div>
        <button type="submit" class="btn btn-primary">Update Post</button>`;

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
            if (uploadError) {
                showAlert('Failed to upload new image.', 'error');
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }
        const content = quill.root.innerHTML;
        const { error: updateError } = await supabase.from('posts').update({
            title: form.querySelector('#title').value,
            post_type: form.querySelector('#post_type').value,
            content,
            video_url: form.querySelector('#video_url').value,
            image_url: imageUrl,
        }).eq('id', id);
        if (updateError) {
            showAlert('Failed to update post.', 'error');
        } else {
            showAlert('Post updated successfully!', 'success');
            loadPosts();
        }
    });
}

// --- SCHEDULE MANAGEMENT ---
async function loadSchedule() {
    contentArea.innerHTML = '<h1>Loading schedule...</h1>';
    const { data, error } = await supabase.from('schedule').select('*').order('start_time');
    if (error) {
        console.error('Error fetching schedule:', error);
        contentArea.innerHTML = 'Error loading data.';
        return;
    }
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let scheduleByDay = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    if (data) data.forEach(item => scheduleByDay[item.day_of_week].push(item));

    let tableHtml = `<table class="schedule-table"><thead><tr>${daysOfWeek.map(day => `<th>${day}</th>`).join('')}</tr></thead><tbody><tr>`;
    for (let i = 1; i <= 7; i++) {
        tableHtml += `<td>`;
        scheduleByDay[i].forEach(item => {
            tableHtml += `
                <div class="item-card class-item" data-id="${item.id}">
                    <strong>${item.class_name}</strong><br>
                    <small>${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}</small>
                    <div class="actions">
                        <button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`;
        });
        tableHtml += `</td>`;
    }
    tableHtml += `</tr></tbody></table>`;
    contentArea.innerHTML = `<h1>Manage Schedule</h1><button id="add-class-btn" class="btn btn-primary">Add New Class</button><hr>${tableHtml}`;

    const addBtn = document.getElementById('add-class-btn');
    if (addBtn) addBtn.addEventListener('click', showAddScheduleForm);

    contentArea.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showEditScheduleForm(e.target.closest('.item-card').dataset.id));
    });
    contentArea.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('.item-card').dataset.id;
            if (await showConfirm({ title: 'Delete Class?' })) {
                await supabase.from('schedule').delete().eq('id', id);
                loadSchedule();
            }
        });
    });
}

function showAddScheduleForm() {
    contentArea.innerHTML = `<h1>Add New Class</h1><form class="item-form" id="schedule-form"></form>`;
    document.getElementById('schedule-form').innerHTML = `
        <div class="form-group"><label for="class_name">Class Name</label><input type="text" id="class_name" required></div>
        <div class="form-group"><label for="day_of_week">Day of Week</label><select id="day_of_week" required><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="7">Sunday</option></select></div>
        <div class="form-group"><label for="start_time">Start Time</label><input type="time" id="start_time" required></div>
        <div class="form-group"><label for="end_time">End Time</label><input type="time" id="end_time" required></div>
        <button type="submit" class="btn btn-primary">Save Class</button>`;

    document.getElementById('schedule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('schedule').insert([{
            class_name: document.getElementById('class_name').value,
            day_of_week: document.getElementById('day_of_week').value,
            start_time: document.getElementById('start_time').value,
            end_time: document.getElementById('end_time').value
        }]);
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
    if (error) {
        showAlert('Could not load class data.', 'error');
        loadSchedule();
        return;
    }
    contentArea.innerHTML = `<h1>Edit Class</h1><form class="item-form" id="schedule-edit-form"></form>`;
    document.getElementById('schedule-edit-form').innerHTML = `
        <div class="form-group"><label for="class_name">Class Name</label><input type="text" id="class_name" value="${data.class_name}" required></div>
        <div class="form-group"><label for="day_of_week">Day of Week</label><select id="day_of_week" required></select></div>
        <div class="form-group"><label for="start_time">Start Time</label><input type="time" id="start_time" value="${data.start_time}" required></div>
        <div class="form-group"><label for="end_time">End Time</label><input type="time" id="end_time" value="${data.end_time}" required></div>
        <button type="submit" class="btn btn-primary">Update Class</button>`;

    const daySelect = document.getElementById('day_of_week');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach((day, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = day;
        if ((index + 1) === data.day_of_week) option.selected = true;
        daySelect.appendChild(option);
    });

    document.getElementById('schedule-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error: updateError } = await supabase.from('schedule').update({
            class_name: document.getElementById('class_name').value,
            day_of_week: document.getElementById('day_of_week').value,
            start_time: document.getElementById('start_time').value,
            end_time: document.getElementById('end_time').value
        }).eq('id', id);
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
        contentArea.insertAdjacentHTML('beforeend', '<p>No events found. Click "Add New" to start.</p>');
    } else {
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
    }

    const addBtn = document.getElementById('add-event-btn');
    if (addBtn) addBtn.addEventListener('click', showAddEventForm);

    contentArea.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showEditEventForm(e.target.closest('.item-card').dataset.id));
    });
    contentArea.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('.item-card').dataset.id;
            if (await showConfirm({ title: 'Delete Event?' })) {
                await supabase.from('events').delete().eq('id', id);
                loadEvents();
            }
        });
    });
}

function showAddEventForm() {
    contentArea.innerHTML = `
        <h1>Add New Event</h1>
        <form class="item-form" id="event-form">
            <div class="form-group">
                <label for="event_title">Event Title</label>
                <input type="text" id="event_title" required>
            </div>
            <div class="form-group">
                <label for="event_description">Description</label>
                <textarea id="event_description" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="event_date">Event Date</label>
                <input type="date" id="event_date" required>
            </div>
            <div class="form-group">
                <label for="event_time">Event Time</label>
                <input type="time" id="event_time" required>
            </div>
            <div class="form-group">
                <label for="event_location">Location</label>
                <input type="text" id="event_location" required>
            </div>
            <div class="form-group">
                <label for="event_type">Event Type</label>
                <select id="event_type">
                    <option value="challenge">Challenge</option>
                    <option value="workshop">Workshop</option>
                    <option value="class">Class</option>
                    <option value="special">Special Event</option>
                </select>
            </div>
            <div class="form-group">
                <label for="event_status">Status</label>
                <select id="event_status">
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            <div class="form-group">
                <label for="max_participants">Max Participants (optional)</label>
                <input type="number" id="max_participants" min="1">
            </div>
            <div class="form-group">
                <label for="event_poster">Event Poster</label>
                <input type="file" id="event_poster" accept="image/*" required>
            </div>
            <button type="submit" class="btn btn-primary">Save Event</button>
        </form>`;

    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const posterFile = form.querySelector('#event_poster').files[0];

        if (!posterFile) {
            return showAlert('Event poster is required.', 'error');
        }

        const filePath = `event-poster-${Date.now()}-${posterFile.name}`;
        const { error: uploadError } = await supabase.storage
            .from('event-posters')
            .upload(filePath, posterFile);

        if (uploadError) {
            showAlert('Failed to upload poster.', 'error');
            console.error(uploadError);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('event-posters')
            .getPublicUrl(filePath);

        const { error: insertError } = await supabase.from('events').insert([{
            title: form.querySelector('#event_title').value,
            description: form.querySelector('#event_description').value,
            event_date: form.querySelector('#event_date').value,
            event_time: form.querySelector('#event_time').value,
            location: form.querySelector('#event_location').value,
            event_type: form.querySelector('#event_type').value,
            status: form.querySelector('#event_status').value,
            max_participants: form.querySelector('#max_participants').value || null,
            poster_url: publicUrl,
        }]);

        if (insertError) {
            showAlert('Failed to add event.', 'error');
            console.error(insertError);
        } else {
            showAlert('Event added successfully!', 'success');
            loadEvents();
        }
    });
}

async function showEditEventForm(id) {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();

    if (error) {
        showAlert('Could not load event data.', 'error');
        loadEvents();
        return;
    }

    contentArea.innerHTML = `
        <h1>Edit Event</h1>
        <form class="item-form" id="event-edit-form">
            <div class="form-group">
                <label for="event_title">Event Title</label>
                <input type="text" id="event_title" value="${data.title}" required>
            </div>
            <div class="form-group">
                <label for="event_description">Description</label>
                <textarea id="event_description" rows="4">${data.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="event_date">Event Date</label>
                <input type="date" id="event_date" value="${data.event_date}" required>
            </div>
            <div class="form-group">
                <label for="event_time">Event Time</label>
                <input type="time" id="event_time" value="${data.event_time}" required>
            </div>
            <div class="form-group">
                <label for="event_location">Location</label>
                <input type="text" id="event_location" value="${data.location}" required>
            </div>
            <div class="form-group">
                <label for="event_type">Event Type</label>
                <select id="event_type">
                    <option value="challenge" ${data.event_type === 'challenge' ? 'selected' : ''}>Challenge</option>
                    <option value="workshop" ${data.event_type === 'workshop' ? 'selected' : ''}>Workshop</option>
                    <option value="class" ${data.event_type === 'class' ? 'selected' : ''}>Class</option>
                    <option value="special" ${data.event_type === 'special' ? 'selected' : ''}>Special Event</option>
                </select>
            </div>
            <div class="form-group">
                <label for="event_status">Status</label>
                <select id="event_status">
                    <option value="upcoming" ${data.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                    <option value="past" ${data.status === 'past' ? 'selected' : ''}>Past</option>
                    <option value="cancelled" ${data.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            <div class="form-group">
                <label for="max_participants">Max Participants</label>
                <input type="number" id="max_participants" value="${data.max_participants || ''}" min="1">
            </div>
            <div class="form-group">
                <label>Current Poster</label><br>
                <img src="${data.poster_url}" style="width:200px; height:200px; object-fit:cover; border-radius:8px;">
            </div>
            <div class="form-group">
                <label for="event_poster">Upload New Poster (optional)</label>
                <input type="file" id="event_poster" accept="image/*">
            </div>
            <button type="submit" class="btn btn-primary">Update Event</button>
        </form>`;

    document.getElementById('event-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let posterUrl = data.poster_url;

        const posterFile = form.querySelector('#event_poster').files[0];
        if (posterFile) {
            const filePath = `event-poster-${Date.now()}-${posterFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('event-posters')
                .upload(filePath, posterFile);

            if (uploadError) {
                showAlert('Failed to upload new poster.', 'error');
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('event-posters')
                .getPublicUrl(filePath);
            posterUrl = publicUrl;
        }

        const { error: updateError } = await supabase.from('events').update({
            title: form.querySelector('#event_title').value,
            description: form.querySelector('#event_description').value,
            event_date: form.querySelector('#event_date').value,
            event_time: form.querySelector('#event_time').value,
            location: form.querySelector('#event_location').value,
            event_type: form.querySelector('#event_type').value,
            status: form.querySelector('#event_status').value,
            max_participants: form.querySelector('#max_participants').value || null,
            poster_url: posterUrl,
        }).eq('id', id);

        if (updateError) {
            showAlert('Failed to update event.', 'error');
        } else {
            showAlert('Event updated successfully!', 'success');
            loadEvents();
        }
    });
}

// --- EVENT BOOKINGS MANAGEMENT ---
async function loadEventBookings() {
    contentArea.innerHTML = '<h1>Loading event bookings...</h1>';

    const { data, error } = await supabase
        .from('event_bookings')
        .select(`
            *,
            events (
                title,
                event_date,
                event_time
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching event bookings:', error);
        contentArea.innerHTML = 'Error loading data.';
        return;
    }

    contentArea.innerHTML = `<h1>Event Bookings</h1><button id="add-event-booking-btn" class="btn btn-primary">Add Manual Booking</button><hr>`;

    if (data.length === 0) {
        contentArea.insertAdjacentHTML('beforeend', '<p>No event bookings yet.</p>');
    } else {
        data.forEach(booking => {
            const eventDate = booking.events ? new Date(booking.events.event_date).toLocaleDateString() : 'N/A';
            const bookingCard = `
                <div class="item-card event-booking-card ${!booking.is_contacted ? 'unread' : ''}" data-id="${booking.id}">
                    <div class="content">
                        <h3>${booking.full_name} - ${booking.events?.title || 'Event Deleted'}</h3>
                        <div class="meta-info">
                            <strong>Event:</strong> ${booking.events?.title || 'N/A'} (${eventDate})<br>
                            <strong>Contact:</strong> ${booking.email} | ${booking.phone}<br>
                            <strong>Participants:</strong> ${booking.number_of_participants}<br>
                            <strong>Registered:</strong> ${new Date(booking.created_at).toLocaleString()}
                        </div>
                        ${booking.message ? `<div class="message-body">${booking.message}</div>` : ''}
                    </div>
                    <div class="actions">
                        <button class="btn edit-booking-btn"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn toggle-contacted-btn" data-id="${booking.id}" data-is-contacted="${booking.is_contacted}">
                            Mark as ${booking.is_contacted ? 'Pending' : 'Contacted'}
                        </button>
                        <button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`;
            contentArea.insertAdjacentHTML('beforeend', bookingCard);
        });
    }

    const addBtn = document.getElementById('add-event-booking-btn');
    if (addBtn) addBtn.addEventListener('click', showAddEventBookingForm);

    // Add toggle contacted handlers
    document.querySelectorAll('.toggle-contacted-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const isContacted = e.target.dataset.isContacted === 'true';
            const { error } = await supabase
                .from('event_bookings')
                .update({ is_contacted: !isContacted })
                .eq('id', id);
            if (error) {
                showAlert('Could not update status.', 'error');
            } else {
                loadEventBookings();
            }
        });
    });

    // Add edit booking handlers
    document.querySelectorAll('.edit-booking-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.event-booking-card').dataset.id;
            showEditEventBookingForm(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('.event-booking-card').dataset.id;
            if (await showConfirm({ title: 'Delete Booking?' })) {
                await supabase.from('event_bookings').delete().eq('id', id);
                loadEventBookings();
            }
        });
    });
}

async function showAddEventBookingForm() {
    // Fetch events for dropdown
    const { data: events } = await supabase.from('events').select('id, title, event_date').order('event_date');

    const eventOptions = events.map(e =>
        `<option value="${e.id}">${e.title} (${new Date(e.event_date).toLocaleDateString()})</option>`
    ).join('');

    contentArea.innerHTML = `
        <h1>Add Manual Event Booking</h1>
        <form class="item-form" id="event-booking-form">
            <div class="form-group">
                <label for="booking_event">Select Event</label>
                <select id="booking_event" required>
                    <option value="">Choose an event...</option>
                    ${eventOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="booking_name">Full Name</label>
                <input type="text" id="booking_name" required>
            </div>
            <div class="form-group">
                <label for="booking_email">Email</label>
                <input type="email" id="booking_email" required>
            </div>
            <div class="form-group">
                <label for="booking_phone">Phone</label>
                <input type="tel" id="booking_phone" required>
            </div>
            <div class="form-group">
                <label for="booking_participants">Number of Participants</label>
                <input type="number" id="booking_participants" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label for="booking_message">Message/Notes</label>
                <textarea id="booking_message" rows="3"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Save Booking</button>
        </form>`;

    document.getElementById('event-booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        const { error } = await supabase.from('event_bookings').insert([{
            event_id: form.querySelector('#booking_event').value,
            full_name: form.querySelector('#booking_name').value,
            email: form.querySelector('#booking_email').value,
            phone: form.querySelector('#booking_phone').value,
            number_of_participants: parseInt(form.querySelector('#booking_participants').value),
            message: form.querySelector('#booking_message').value,
        }]);

        if (error) {
            showAlert('Failed to add booking.', 'error');
            console.error(error);
        } else {
            showAlert('Booking added successfully!', 'success');
            loadEventBookings();
        }
    });
}

async function showEditEventBookingForm(id) {
    const { data, error } = await supabase
        .from('event_bookings')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showAlert('Could not load booking data.', 'error');
        loadEventBookings();
        return;
    }

    // Fetch events for dropdown
    const { data: events } = await supabase.from('events').select('id, title, event_date').order('event_date');

    const eventOptions = events.map(e =>
        `<option value="${e.id}" ${e.id === data.event_id ? 'selected' : ''}>${e.title} (${new Date(e.event_date).toLocaleDateString()})</option>`
    ).join('');

    contentArea.innerHTML = `
        <h1>Edit Event Booking</h1>
        <form class="item-form" id="event-booking-edit-form">
            <div class="form-group">
                <label for="booking_event">Event</label>
                <select id="booking_event" required>
                    ${eventOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="booking_name">Full Name</label>
                <input type="text" id="booking_name" value="${data.full_name}" required>
            </div>
            <div class="form-group">
                <label for="booking_email">Email</label>
                <input type="email" id="booking_email" value="${data.email}" required>
            </div>
            <div class="form-group">
                <label for="booking_phone">Phone</label>
                <input type="tel" id="booking_phone" value="${data.phone}" required>
            </div>
            <div class="form-group">
                <label for="booking_participants">Number of Participants</label>
                <input type="number" id="booking_participants" value="${data.number_of_participants}" min="1" required>
            </div>
            <div class="form-group">
                <label for="booking_message">Message/Notes</label>
                <textarea id="booking_message" rows="3">${data.message || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">Update Booking</button>
        </form>`;

    document.getElementById('event-booking-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        const { error: updateError } = await supabase.from('event_bookings').update({
            event_id: form.querySelector('#booking_event').value,
            full_name: form.querySelector('#booking_name').value,
            email: form.querySelector('#booking_email').value,
            phone: form.querySelector('#booking_phone').value,
            number_of_participants: parseInt(form.querySelector('#booking_participants').value),
            message: form.querySelector('#booking_message').value,
        }).eq('id', id);

        if (updateError) {
            showAlert('Failed to update booking.', 'error');
        } else {
            showAlert('Booking updated successfully!', 'success');
            loadEventBookings();
        }
    });
}

// --- LIBRARY (TUTORIALS) MANAGEMENT ---
async function loadTutorials() {
    contentArea.innerHTML = '<h1>Loading tutorials...</h1>';
    const { data, error } = await supabase.from('tutorials').select('*').order('display_order', { ascending: true });
    if (error) {
        console.error('Error fetching tutorials:', error);
        contentArea.innerHTML = '<h1>Manage Library</h1><hr><p>Error loading tutorials. Make sure the "tutorials" table exists in Supabase.</p>';
        return;
    }
    contentArea.innerHTML = `<h1>Manage Library</h1><button id="add-tutorial-btn" class="btn btn-primary">Add New Tutorial</button><hr>`;

    if (!data || data.length === 0) {
        contentArea.insertAdjacentHTML('beforeend', '<p>No tutorials found. Click "Add New Tutorial" to start.</p>');
    } else {
        data.forEach(item => {
            const difficultyClass = item.difficulty || 'beginner';
            contentArea.insertAdjacentHTML('beforeend', `
                <div class="item-card tutorial-card" data-id="${item.id}">
                    <div class="content">
                        <h3>${item.title}</h3>
                        <p>${item.description || ''}</p>
                        <p>
                            <span class="badge badge-${difficultyClass}">${item.difficulty || 'N/A'}</span>
                            <span class="badge badge-category">${item.category || 'N/A'}</span>
                            <span class="badge badge-duration"><i class="fa-solid fa-clock"></i> ${item.duration || 'N/A'}</span>
                        </p>
                    </div>
                    <div class="actions">
                        <button class="btn edit-btn"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn delete-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`);
        });
    }

    // Attach event listeners
    const addBtn = document.getElementById('add-tutorial-btn');
    if (addBtn) addBtn.addEventListener('click', showAddTutorialForm);

    contentArea.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showEditTutorialForm(e.target.closest('.item-card').dataset.id));
    });
    contentArea.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('.item-card').dataset.id;
            const confirmed = await showConfirm({ title: 'Delete Tutorial?', text: 'This will permanently remove this tutorial from the library.' });
            if (confirmed) {
                const { error: deleteError } = await supabase.from('tutorials').delete().eq('id', id);
                if (deleteError) {
                    showAlert('Failed to delete tutorial.', 'error');
                } else {
                    showAlert('Tutorial deleted successfully!', 'success');
                    loadTutorials();
                }
            }
        });
    });
}

function showAddTutorialForm() {
    contentArea.innerHTML = `<h1>Add New Tutorial</h1><form class="item-form" id="tutorial-form"></form>`;
    document.getElementById('tutorial-form').innerHTML = `
        <div class="form-group">
            <label for="title">Tutorial Title</label>
            <input type="text" id="title" placeholder="e.g., Proper Squat Form & Technique" required>
        </div>
        <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" rows="3" placeholder="Brief description of what viewers will learn"></textarea>
        </div>
        <div class="form-group">
            <label for="category">Category</label>
            <select id="category" required>
                <option value="upper-body">Upper Body</option>
                <option value="lower-body">Lower Body</option>
                <option value="core">Core</option>
                <option value="cardio">Cardio</option>
                <option value="full-body">Full Body</option>
            </select>
        </div>
        <div class="form-group">
            <label for="difficulty">Difficulty Level</label>
            <select id="difficulty" required>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
            </select>
        </div>
        <div class="form-group">
            <label for="duration">Duration (e.g., 8:45)</label>
            <input type="text" id="duration" placeholder="8:45" required>
        </div>
        <div class="form-group">
            <label for="video_url">YouTube Video URL</label>
            <input type="url" id="video_url" placeholder="https://www.youtube.com/watch?v=...">
        </div>
        <div class="form-group">
            <label for="thumbnail">Thumbnail Image (optional)</label>
            <input type="file" id="thumbnail" accept="image/*">
        </div>
        <div class="form-group">
            <label for="display_order">Display Order (lower = shown first)</label>
            <input type="number" id="display_order" value="0">
        </div>
        <button type="submit" class="btn btn-primary">Save Tutorial</button>`;

    document.getElementById('tutorial-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        const videoUrl = form.querySelector('#video_url').value;
        if (!validateYouTubeUrl(videoUrl)) {
            return showAlert('Please enter a valid YouTube URL.', 'error');
        }

        let thumbnailUrl = null;
        const thumbnailFile = form.querySelector('#thumbnail').files[0];
        if (thumbnailFile) {
            const filePath = `tutorial-${Date.now()}-${thumbnailFile.name}`;
            const { error: uploadError } = await supabase.storage.from('tutorial-images').upload(filePath, thumbnailFile);
            if (uploadError) {
                console.warn('Thumbnail upload failed, continuing without thumbnail:', uploadError);
            } else {
                const { data: { publicUrl } } = supabase.storage.from('tutorial-images').getPublicUrl(filePath);
                thumbnailUrl = publicUrl;
            }
        }

        const { error: insertError } = await supabase.from('tutorials').insert([{
            title: form.querySelector('#title').value,
            description: form.querySelector('#description').value,
            category: form.querySelector('#category').value,
            difficulty: form.querySelector('#difficulty').value,
            duration: form.querySelector('#duration').value,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            display_order: parseInt(form.querySelector('#display_order').value) || 0
        }]);

        if (insertError) {
            showAlert('Failed to add tutorial.', 'error');
            console.error(insertError);
        } else {
            showAlert('Tutorial added successfully!', 'success');
            loadTutorials();
        }
    });
}

async function showEditTutorialForm(id) {
    const { data, error } = await supabase.from('tutorials').select('*').eq('id', id).single();
    if (error) {
        showAlert('Could not load tutorial data.', 'error');
        loadTutorials();
        return;
    }

    contentArea.innerHTML = `<h1>Edit Tutorial</h1><form class="item-form" id="tutorial-edit-form"></form>`;
    document.getElementById('tutorial-edit-form').innerHTML = `
        <div class="form-group">
            <label for="title">Tutorial Title</label>
            <input type="text" id="title" value="${data.title || ''}" required>
        </div>
        <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" rows="3">${data.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label for="category">Category</label>
            <select id="category" required>
                <option value="upper-body" ${data.category === 'upper-body' ? 'selected' : ''}>Upper Body</option>
                <option value="lower-body" ${data.category === 'lower-body' ? 'selected' : ''}>Lower Body</option>
                <option value="core" ${data.category === 'core' ? 'selected' : ''}>Core</option>
                <option value="cardio" ${data.category === 'cardio' ? 'selected' : ''}>Cardio</option>
                <option value="full-body" ${data.category === 'full-body' ? 'selected' : ''}>Full Body</option>
            </select>
        </div>
        <div class="form-group">
            <label for="difficulty">Difficulty Level</label>
            <select id="difficulty" required>
                <option value="beginner" ${data.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                <option value="intermediate" ${data.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                <option value="advanced" ${data.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
            </select>
        </div>
        <div class="form-group">
            <label for="duration">Duration (e.g., 8:45)</label>
            <input type="text" id="duration" value="${data.duration || ''}" required>
        </div>
        <div class="form-group">
            <label for="video_url">YouTube Video URL</label>
            <input type="url" id="video_url" value="${data.video_url || ''}">
        </div>
        ${data.thumbnail_url ? `<div class="form-group"><label>Current Thumbnail</label><br><img src="${data.thumbnail_url}" style="width:150px; height:100px; object-fit:cover;"></div>` : ''}
        <div class="form-group">
            <label for="thumbnail">Upload New Thumbnail (optional)</label>
            <input type="file" id="thumbnail" accept="image/*">
        </div>
        <div class="form-group">
            <label for="display_order">Display Order (lower = shown first)</label>
            <input type="number" id="display_order" value="${data.display_order || 0}">
        </div>
        <button type="submit" class="btn btn-primary">Update Tutorial</button>`;

    document.getElementById('tutorial-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        const videoUrl = form.querySelector('#video_url').value;
        if (!validateYouTubeUrl(videoUrl)) {
            return showAlert('Please enter a valid YouTube URL.', 'error');
        }

        let thumbnailUrl = data.thumbnail_url;
        const thumbnailFile = form.querySelector('#thumbnail').files[0];
        if (thumbnailFile) {
            const filePath = `tutorial-${Date.now()}-${thumbnailFile.name}`;
            const { error: uploadError } = await supabase.storage.from('tutorial-images').upload(filePath, thumbnailFile);
            if (uploadError) {
                console.warn('Thumbnail upload failed, keeping existing thumbnail:', uploadError);
            } else {
                const { data: { publicUrl } } = supabase.storage.from('tutorial-images').getPublicUrl(filePath);
                thumbnailUrl = publicUrl;
            }
        }

        const { error: updateError } = await supabase.from('tutorials').update({
            title: form.querySelector('#title').value,
            description: form.querySelector('#description').value,
            category: form.querySelector('#category').value,
            difficulty: form.querySelector('#difficulty').value,
            duration: form.querySelector('#duration').value,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            display_order: parseInt(form.querySelector('#display_order').value) || 0
        }).eq('id', id);

        if (updateError) {
            showAlert('Failed to update tutorial.', 'error');
            console.error(updateError);
        } else {
            showAlert('Tutorial updated successfully!', 'success');
            loadTutorials();
        }
    });
}

// --- SESSION CHECK ---
async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';

        // Load bookings if content area is empty (initial load)
        if (contentArea.innerHTML.trim() === '') {
            loadBookings();
            document.querySelector('.sidebar button[data-target="bookings"]')?.classList.add('active');
        }
    } else {
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';

        // Reset Inputs
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (loginError) loginError.textContent = '';
    }
}

// Initialize the app
checkSession();