// Global variables
let currentUser = null;
let currentPage = 'home';
let currentPostId = null;

// API Base URL
const API_BASE = '/api';

// Utility functions
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
};

const showLoading = () => {
    document.getElementById('loadingSpinner').style.display = 'flex';
};

const hideLoading = () => {
    document.getElementById('loadingSpinner').style.display = 'none';
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
};

// API functions
const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Authentication functions
const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    localStorage.setItem('token', data.token);
    currentUser = data.user;
    updateAuthUI();
    showToast('Login successful!');
    return data;
};

const register = async (username, email, password) => {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
    });
    
    localStorage.setItem('token', data.token);
    currentUser = data.user;
    updateAuthUI();
    showToast('Registration successful!');
    return data;
};

const logout = () => {
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthUI();
    showToast('Logged out successfully');
    navigateTo('home');
};

const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const data = await apiRequest('/auth/me');
        currentUser = data.user;
        updateAuthUI();
    } catch (error) {
        localStorage.removeItem('token');
        currentUser = null;
        updateAuthUI();
    }
};

// UI functions
const updateAuthUI = () => {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (currentUser) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        userAvatar.src = currentUser.avatar || 'https://via.placeholder.com/32';
        userName.textContent = currentUser.username;
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
    }
};

const showModal = (modalId) => {
    document.getElementById(modalId).classList.add('show');
};

const hideModal = (modalId) => {
    document.getElementById(modalId).classList.remove('show');
};

const navigateTo = (page) => {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    document.getElementById(`${page}Page`).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    
    currentPage = page;
    
    // Load page-specific content
    switch (page) {
        case 'home':
            loadFeaturedPosts();
            break;
        case 'explore':
            loadExplorePosts();
            break;
        case 'profile':
            loadUserProfile();
            break;
        case 'my-posts':
            loadMyPosts();
            break;
    }
};

// Post functions
const loadFeaturedPosts = async () => {
    try {
        showLoading();
        const data = await apiRequest('/posts?limit=6');
        renderPosts(data.posts, 'featuredPosts');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
};

const loadExplorePosts = async (page = 1, search = '', tag = '') => {
    try {
        showLoading();
        let endpoint = `/posts?page=${page}&limit=12`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;
        if (tag) endpoint += `&tag=${encodeURIComponent(tag)}`;
        
        const data = await apiRequest(endpoint);
        renderPosts(data.posts, 'explorePosts');
        renderPagination(data.pagination, 'explorePagination');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
};

const loadMyPosts = async () => {
    if (!currentUser) {
        showToast('Please login to view your posts', 'error');
        return;
    }
    
    try {
        showLoading();
        const data = await apiRequest(`/posts/user/${currentUser._id}`);
        renderPosts(data.posts, 'myPosts', true);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
};

const loadPostDetail = async (postId) => {
    try {
        showLoading();
        const data = await apiRequest(`/posts/${postId}`);
        renderPostDetail(data.post);
        navigateTo('post-detail');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
};

const createPost = async (postData) => {
    try {
        showLoading();
        const data = await apiRequest('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
        showToast('Post created successfully!');
        navigateTo('my-posts');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
};

const updatePost = async (postId, postData) => {
    try {
        showLoading();
        const data = await apiRequest(`/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
        showToast('Post updated successfully!');
        loadPostDetail(postId);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
};

const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        showLoading();
        await apiRequest(`/posts/${postId}`, {
            method: 'DELETE'
        });
        showToast('Post deleted successfully!');
        navigateTo('my-posts');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
};

const likePost = async (postId) => {
    try {
        const data = await apiRequest(`/posts/${postId}/like`, {
            method: 'POST'
        });
        // Update the like button state
        const likeBtn = document.querySelector(`[data-post-id="${postId}"] .like-btn`);
        if (likeBtn) {
            likeBtn.classList.toggle('liked');
            const likeCount = likeBtn.querySelector('.like-count');
            if (likeCount) {
                likeCount.textContent = data.post.likes.length;
            }
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// Comment functions
const loadComments = async (postId) => {
    try {
        const data = await apiRequest(`/comments/post/${postId}`);
        renderComments(data.comments, postId);
    } catch (error) {
        showToast(error.message, 'error');
    }
};

const addComment = async (postId, content, parentCommentId = null) => {
    try {
        const data = await apiRequest('/comments', {
            method: 'POST',
            body: JSON.stringify({
                postId,
                content,
                parentCommentId
            })
        });
        showToast('Comment added successfully!');
        loadComments(postId);
    } catch (error) {
        showToast(error.message, 'error');
    }
};

const likeComment = async (commentId) => {
    try {
        const data = await apiRequest(`/comments/${commentId}/like`, {
            method: 'POST'
        });
        // Update comment like state
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (comment) {
            const likeBtn = comment.querySelector('.like-btn');
            likeBtn.classList.toggle('liked');
            const likeCount = likeBtn.querySelector('.like-count');
            if (likeCount) {
                likeCount.textContent = data.comment.likes.length;
            }
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// Rendering functions
const renderPosts = (posts, containerId, showActions = false) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = posts.length === 0 ? 
        '<p class="no-posts">No posts found</p>' : 
        posts.map(post => `
            <article class="post-card" data-post-id="${post._id}">
                <img src="${post.featuredImage || 'https://via.placeholder.com/400x200'}" 
                     alt="${post.title}" class="post-image">
                <div class="post-content">
                    <h3 class="post-title">
                        <a href="#" onclick="loadPostDetail('${post._id}')">${post.title}</a>
                    </h3>
                    <p class="post-excerpt">${post.excerpt || post.content.substring(0, 150)}...</p>
                    
                    <div class="post-meta">
                        <div class="post-author">
                            <img src="${post.author.avatar || 'https://via.placeholder.com/24'}" 
                                 alt="${post.author.username}">
                            <span>${post.author.username}</span>
                        </div>
                        <span>${formatTimeAgo(post.createdAt)}</span>
                    </div>
                    
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="post-tags">
                            ${post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="post-actions">
                        <div class="post-stats">
                            <span class="post-stat">
                                <i class="fas fa-heart"></i>
                                <span class="like-count">${post.likes.length}</span>
                            </span>
                            <span class="post-stat">
                                <i class="fas fa-comment"></i>
                                <span>${post.comments ? post.comments.length : 0}</span>
                            </span>
                            <span class="post-stat">
                                <i class="fas fa-clock"></i>
                                <span>${post.readTime} min read</span>
                            </span>
                        </div>
                        
                        ${currentUser ? `
                            <button class="like-btn ${post.isLiked ? 'liked' : ''}" 
                                    onclick="likePost('${post._id}')">
                                <i class="fas fa-heart"></i>
                            </button>
                        ` : ''}
                        
                        ${showActions && currentUser && post.author._id === currentUser._id ? `
                            <div class="post-actions-buttons">
                                <button class="btn btn-secondary btn-sm" 
                                        onclick="editPost('${post._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-secondary btn-sm" 
                                        onclick="deletePost('${post._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </article>
        `).join('');
};

const renderPostDetail = (post) => {
    const container = document.getElementById('postDetail');
    container.innerHTML = `
        <div class="post-detail-header">
            <h1 class="post-detail-title">${post.title}</h1>
            <div class="post-detail-meta">
                <div class="post-author">
                    <img src="${post.author.avatar || 'https://via.placeholder.com/32'}" 
                         alt="${post.author.username}">
                    <span>${post.author.username}</span>
                </div>
                <span>${formatDate(post.createdAt)}</span>
                <span>${post.readTime} min read</span>
            </div>
            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
        
        ${post.featuredImage ? `
            <img src="${post.featuredImage}" alt="${post.title}" class="post-detail-image">
        ` : ''}
        
        <div class="post-detail-content">
            ${post.content}
        </div>
        
        <div class="post-detail-actions">
            <div class="post-stats">
                <span class="post-stat">
                    <i class="fas fa-heart"></i>
                    <span class="like-count">${post.likes.length}</span>
                </span>
                <span class="post-stat">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments ? post.comments.length : 0}</span>
                </span>
            </div>
            
            ${currentUser ? `
                <button class="like-btn ${post.isLiked ? 'liked' : ''}" 
                        onclick="likePost('${post._id}')">
                    <i class="fas fa-heart"></i>
                    ${post.isLiked ? 'Liked' : 'Like'}
                </button>
            ` : ''}
        </div>
        
        <div class="comments-section">
            <h3>Comments</h3>
            ${currentUser ? `
                <form class="comment-form" onsubmit="submitComment(event, '${post._id}')">
                    <textarea name="comment" placeholder="Write a comment..." required></textarea>
                    <button type="submit" class="btn btn-primary">Post Comment</button>
                </form>
            ` : '<p>Please <a href="#" onclick="showModal(\'loginModal\')">login</a> to comment.</p>'}
            
            <div id="commentsContainer">
                <!-- Comments will be loaded here -->
            </div>
        </div>
    `;
    
    loadComments(post._id);
};

const renderComments = (comments, postId) => {
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    
    container.innerHTML = comments.length === 0 ? 
        '<p>No comments yet. Be the first to comment!</p>' : 
        comments.map(comment => `
            <div class="comment" data-comment-id="${comment._id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${comment.author.avatar || 'https://via.placeholder.com/32'}" 
                             alt="${comment.author.username}">
                        <span>${comment.author.username}</span>
                    </div>
                    <span>${formatTimeAgo(comment.createdAt)}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-actions">
                    ${currentUser ? `
                        <button class="comment-action like-btn ${comment.isLiked ? 'liked' : ''}" 
                                onclick="likeComment('${comment._id}')">
                            <i class="fas fa-heart"></i>
                            <span class="like-count">${comment.likes.length}</span>
                        </button>
                        <button class="comment-action" onclick="replyToComment('${comment._id}')">
                            <i class="fas fa-reply"></i>
                            Reply
                        </button>
                        ${comment.author._id === currentUser._id ? `
                            <button class="comment-action" onclick="editComment('${comment._id}')">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="comment-action" onclick="deleteComment('${comment._id}')">
                                <i class="fas fa-trash"></i>
                                Delete
                            </button>
                        ` : ''}
                    ` : ''}
                </div>
            </div>
        `).join('');
};

const renderPagination = (pagination, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { current, pages, total } = pagination;
    
    let paginationHTML = '';
    
    if (pages > 1) {
        paginationHTML += `
            <button class="pagination-btn" ${current === 1 ? 'disabled' : ''} 
                    onclick="loadExplorePosts(${current - 1})">
                Previous
            </button>
        `;
        
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= current - 2 && i <= current + 2)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === current ? 'active' : ''}" 
                            onclick="loadExplorePosts(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === current - 3 || i === current + 3) {
                paginationHTML += '<span>...</span>';
            }
        }
        
        paginationHTML += `
            <button class="pagination-btn" ${current === pages ? 'disabled' : ''} 
                    onclick="loadExplorePosts(${current + 1})">
                Next
            </button>
        `;
    }
    
    container.innerHTML = paginationHTML;
};

// Event handlers
const submitComment = (event, postId) => {
    event.preventDefault();
    const form = event.target;
    const content = form.comment.value.trim();
    
    if (!content) return;
    
    addComment(postId, content);
    form.reset();
};

const editPost = (postId) => {
    // Implementation for editing posts
    showToast('Edit functionality coming soon!', 'warning');
};

const replyToComment = (commentId) => {
    // Implementation for replying to comments
    showToast('Reply functionality coming soon!', 'warning');
};

const editComment = (commentId) => {
    // Implementation for editing comments
    showToast('Edit comment functionality coming soon!', 'warning');
};

const deleteComment = (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    // Implementation for deleting comments
    showToast('Delete comment functionality coming soon!', 'warning');
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status
    checkAuth();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial content
    loadFeaturedPosts();
});

const setupEventListeners = () => {
    // Navigation
    document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) navigateTo(page);
        });
    });
    
    // User menu
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    userMenuBtn?.addEventListener('click', () => {
        userDropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', (e) => {
        if (!userMenuBtn?.contains(e.target)) {
            userDropdown?.classList.remove('show');
        }
    });
    
    // Authentication buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        showModal('loginModal');
    });
    
    document.getElementById('registerBtn')?.addEventListener('click', () => {
        showModal('registerModal');
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // Forms
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await login(formData.get('email'), formData.get('password'));
            hideModal('loginModal');
            e.target.reset();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
    
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await register(
                formData.get('username'),
                formData.get('email'),
                formData.get('password')
            );
            hideModal('registerModal');
            e.target.reset();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
    
    document.getElementById('newPostForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const postData = {
            title: formData.get('title'),
            content: formData.get('content'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            featuredImage: formData.get('featuredImage') || undefined
        };
        
        try {
            await createPost(postData);
            e.target.reset();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.trim();
            loadExplorePosts(1, searchTerm);
        }, 500);
    });
    
    // Hero buttons
    document.getElementById('getStartedBtn')?.addEventListener('click', () => {
        if (currentUser) {
            navigateTo('new-post');
        } else {
            showModal('registerModal');
        }
    });
    
    document.getElementById('exploreBtn')?.addEventListener('click', () => {
        navigateTo('explore');
    });
    
    // Modal links
    document.getElementById('showRegisterModal')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal('loginModal');
        showModal('registerModal');
    });
    
    document.getElementById('showLoginModal')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal('registerModal');
        showModal('loginModal');
    });
    
    // Profile edit
    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        showModal('editProfileModal');
        // Populate form with current user data
        const form = document.getElementById('editProfileForm');
        form.username.value = currentUser.username;
        form.bio.value = currentUser.bio || '';
        form.avatar.value = currentUser.avatar || '';
    });
    
    document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const data = await apiRequest('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    username: formData.get('username'),
                    bio: formData.get('bio'),
                    avatar: formData.get('avatar')
                })
            });
            
            currentUser = data.user;
            updateAuthUI();
            hideModal('editProfileModal');
            showToast('Profile updated successfully!');
            loadUserProfile();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
};

const loadUserProfile = () => {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = currentUser.username;
    document.getElementById('profileBio').textContent = currentUser.bio || 'No bio yet';
    document.getElementById('profileAvatar').src = currentUser.avatar || 'https://via.placeholder.com/150';
    
    loadMyPosts();
};

// Make functions globally available
window.loadPostDetail = loadPostDetail;
window.likePost = likePost;
window.editPost = editPost;
window.deletePost = deletePost;
window.replyToComment = replyToComment;
window.editComment = editComment;
window.deleteComment = deleteComment;
window.submitComment = submitComment;
window.showModal = showModal;
window.hideModal = hideModal;
window.navigateTo = navigateTo; 