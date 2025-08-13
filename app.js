// app.js - REVISI LENGKAP (View-Only + Fitur Like)

function waitForFirebase() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.firebaseDB && window.firebaseAuth) { // Auth diperlukan untuk like
        clearInterval(interval);
        console.log("Firebase DB dan Auth siap.");
        resolve();
      }
    }, 50);
  });
}

let lastDoc = null;
let loading = false;
let reachedEnd = false;
const PAGE_SIZE = 9;
let siteConfig = {};
let currentAlbumFilter = null;

// --- DOM Elements ---
const feed = document.getElementById('feed');
const carousel = document.getElementById('carousel');
const albumsRow = document.getElementById('albumsRow');
const albumFilter = document.getElementById('albumFilter');
const loadingEl = document.getElementById('loading');
const endOfFeed = document.getElementById('endOfFeed');
const filterInfo = document.getElementById('filterInfo');

// --- Load Site Config ---
async function loadSiteConfig() {
  try {
    const doc = await window.firebaseDB.collection('config').doc('site').get();
    if (doc.exists) {
      siteConfig = doc.data();
      document.getElementById('siteTitle').textContent = siteConfig.title || 'Galeri Publik';
      if (siteConfig.logoUrl) document.getElementById('siteLogo').src = siteConfig.logoUrl;
      document.getElementById('siteSubtitle').textContent = siteConfig.subtitle || '';
    }
  } catch (e) {
    console.error('Gagal muat config:', e);
  }
}

// --- Load Carousel ---
async function loadCarousel() {
  if (!carousel) return;
  carousel.innerHTML = '';
  try {
    const snap = await window.firebaseDB.collectionGroup('photos').orderBy('createdAt', 'desc').limit(16).get();
    snap.forEach((doc) => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'carousel-card';
      const isVideo = data.url.match(/\.(mp4|mov|webm)$/i);
      card.innerHTML = isVideo
        ? `<video src="${data.url}" muted loop autoplay playsinline style="width:100%;height:100%;object-fit:cover;"></video>`
        : `<img src="${data.url}" onerror="this.src='logo.png';" style="width:100%;height:100%;object-fit:cover;">`;
      carousel.appendChild(card);
    });
  } catch (e) {
    console.error('Gagal muat carousel:', e);
  }
}

// --- Load Albums ---
async function loadAlbums() {
  if (!albumsRow || !albumFilter) return;
  albumsRow.innerHTML = '';
  albumFilter.innerHTML = '<option value="__all">Semua Album</option>';
  try {
    const snap = await window.firebaseDB.collection('albums').orderBy('name').get();
    snap.forEach((doc) => {
      const a = { id: doc.id, ...doc.data() };
      const card = document.createElement('div');
      card.className = 'album-card clickable';
      card.dataset.id = a.id;
      card.innerHTML = `
        <div class="album-cover">
          ${a.coverUrl ? `<img src="${a.coverUrl}" onerror="this.src='logo.png';">` : '<div class="small muted">No cover</div>'}
        </div>
        <div class="small">${a.name}</div>
      `;
      albumsRow.appendChild(card);
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name;
      albumFilter.appendChild(opt);
    });
  } catch (e) {
    console.error('Gagal muat album:', e);
  }
}

// --- Share Handler ---
function handleShare(platform, url, caption = '') {
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent(caption || 'Lihat postingan ini');
  let shareUrl;
  switch (platform) {
    case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`; break;
    case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`; break;
    case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`; break;
    case 'copy':
      navigator.clipboard.writeText(url).then(() => alert('Tautan berhasil disalin!'), () => alert('Gagal menyalin.'));
      return;
    default: return;
  }
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
}

// --- Render Photo ---
function renderPhoto(doc) {
  if (!feed) return;
  const data = doc.data();
  const photoId = doc.id;
  const created = data.createdAt?.toDate().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) || '';
  const article = document.createElement('article');
  article.className = 'post';

  const isVideo = data.url.match(/\.(mp4|mov|webm)$/i);
  const mediaHtml = isVideo
    ? `<video src="${data.url}" controls style="width:100%;height:auto;display:block;"></video>`
    : `<img loading="lazy" src="${data.url}" onerror="this.src='logo.png';" style="width:100%;height:auto;display:block;">`;

  // === BAGIAN INI DITAMBAHKAN KEMBALI ===
  const likedPhotos = JSON.parse(localStorage.getItem('likedPhotos') || '[]');
  const isLiked = likedPhotos.includes(photoId);

  article.innerHTML = `
    <div class="post-header">
      <div class="author-info">
        <img src="${data.authorPhoto || 'logo.png'}" alt="author" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
        <div><strong>${data.authorName || 'User'}</strong><div class="small muted">${created}</div></div>
      </div>
    </div>
    <div class="post-media">${mediaHtml}</div>
    <div class="post-content">
      <div class="post-actions">
        <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${photoId}">
          <svg viewBox="0 0 24 24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-6.256 9.673-3.604-4.714-6.256-6.601-6.256-9.673 0-2.434 1.724-4.482 4.048-4.772a4.989 4.989 0 0 1 3.752.542z"></path></svg>
        </button>
        <div class="share-group">
          <button class="share-btn" data-platform="facebook"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></button>
          <button class="share-btn" data-platform="twitter"><svg viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></button>
          <button class="share-btn" data-platform="whatsapp"><svg viewBox="0 0 24 24"><path d="M21.37,15.54a1,1,0,0,0-1.13.28l-1.52,1.52a11.39,11.39,0,0,1-5.3-5.3l1.52-1.52a1,1,0 0,0,.28-1.13L13.7,5.55A1,1,0,0,0,12.6,5H11.23a3.47,3.47,0,0,0-3.6,3.6,13.06,13.06,0,0,0,13,13,3.47,3.47,0,0,0,3.6-3.6V12.6a1,1,0,0,0-.56-1.1Z"></path></svg></button>
          <button class="share-btn" data-platform="copy"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></button>
        </div>
      </div>
      <div class="like-count">${data.likeCount || 0} suka</div>
      <div class="caption-text"><strong>${data.authorName || 'User'}</strong> ${data.caption || ''}</div>
    </div>
  `;
  feed.appendChild(article);
  
  // === BAGIAN INI DITAMBAHKAN KEMBALI ===
  const likeBtn = article.querySelector('.like-btn');
  const countEl = article.querySelector('.like-count');
  likeBtn?.addEventListener('click', () => toggleLike(photoId, data.albumId, likeBtn, countEl));

  // Bagian untuk share button
  article.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => handleShare(btn.dataset.platform, data.url, data.caption));
  });
}

// === FUNGSI INI DITAMBAHKAN KEMBALI ===
async function toggleLike(photoId, albumId, button, countEl) {
  const likedPhotos = JSON.parse(localStorage.getItem('likedPhotos') || '[]');
  const isLiked = likedPhotos.includes(photoId);
  const photoRef = window.firebaseDB.collection('albums').doc(albumId).collection('photos').doc(photoId);

  try {
    // Jalankan update likeCount di server
    await photoRef.update({ likeCount: window.firebase.firestore.FieldValue.increment(isLiked ? -1 : 1) });
    
    // Update data di localStorage browser pengguna
    if (isLiked) {
      localStorage.setItem('likedPhotos', JSON.stringify(likedPhotos.filter(id => id !== photoId)));
    } else {
      likedPhotos.push(photoId);
      localStorage.setItem('likedPhotos', JSON.stringify(likedPhotos));
    }
    
    // Update tampilan tombol dan jumlah suka
    button.classList.toggle('liked', !isLiked);
    const snap = await photoRef.get(); // Ambil data terbaru
    if(countEl) countEl.textContent = `${snap.data().likeCount || 0} suka`;

  } catch (e) {
    console.error('Gagal like:', e);
    alert('Gagal memberikan like. Coba lagi nanti.');
  }
}

// --- Filter Feed ---
function filterFeed(albumId) {
  if (feed) feed.innerHTML = '';
  lastDoc = null;
  reachedEnd = false;
  currentAlbumFilter = albumId === '__all' ? null : albumId;

  if (albumFilter) albumFilter.value = albumId;
  if (filterInfo) {
    filterInfo.textContent = albumId === '__all'
      ? 'Menampilkan semua'
      : `Menampilkan: ${albumFilter.querySelector(`option[value="${albumId}"]`).textContent || albumId}`;
  }
  loadFeedBatch();
}

// --- Load Feed Batch ---
async function loadFeedBatch() {
  if (loading || reachedEnd) return;
  loading = true;
  if (loadingEl) loadingEl.style.display = 'block';

  let q;
  if (currentAlbumFilter) {
    q = window.firebaseDB.collection('albums').doc(currentAlbumFilter).collection('photos');
  } else {
    q = window.firebaseDB.collectionGroup('photos');
  }

  q = q.orderBy('createdAt', 'desc').limit(PAGE_SIZE);
  if (lastDoc) q = q.startAfter(lastDoc);

  try {
    const snap = await q.get();
    if (snap.empty) {
      reachedEnd = true;
      if (endOfFeed) {
        endOfFeed.style.display = 'block';
        endOfFeed.textContent = feed.children.length === 0 ? 'Belum ada postingan di album ini.' : 'Tidak ada post lagi.';
      }
    } else {
      if (endOfFeed) endOfFeed.style.display = 'none';
      snap.forEach(renderPhoto);
      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.size < PAGE_SIZE) reachedEnd = true;
    }
  } catch (e) {
    console.error('Gagal muat feed:', e);
  } finally {
    loading = false;
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// --- Inisialisasi ---
async function init() {
  await waitForFirebase();
  await loadSiteConfig();
  await loadAlbums();
  await loadCarousel();
  await loadFeedBatch();

  albumFilter?.addEventListener('change', e => filterFeed(e.target.value));
  albumsRow?.addEventListener('click', e => {
    const card = e.target.closest('.album-card');
    if (card) filterFeed(card.dataset.id);
  });

  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      loadFeedBatch();
    }
  });
}

// 🚀 Jalankan
init().catch(console.error);
