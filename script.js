const DEFAULT_DATA = {
  settings: {
    coupleNames: "Fiancé & Me ❤️",
    targetDate: "2027-12-25T00:00:00",
    counterMode: "countdown"
  },

  quotes: [
    { text: "“Har pal tumhare saath aik haseen khwab jaisa hai...”", author: "Deep Feelings" },
    { text: "“In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.”", author: "Maya Angelou" },
    { text: "“Tum meri wo khushi ho jo maang kar milli hai.”", author: "Dil Se" },
    { text: "“Together is my favorite place to be with you.”", author: "Love Notes" },
    { text: "“Aap se shuru aur aap pe hi khatam meri kahani.”", author: "Hamari Dastan" }
  ],

  bucketList: [
    {
      id: "b1",
      title: "Late Night Chai & Long Drive in Rain 🌧️",
      category: "Shugal Mela",
      date: "2026-11-01",
      completed: true,
      notes: "Best memories in Islamabad road!"
    },
    {
      id: "b2",
      title: "Trip to Hunza & Attabad Lake 🏞️",
      category: "Pre-Wedding",
      date: "2027-05-15",
      completed: false,
      notes: "Stay at cozy wooden cottage!"
    },
    {
      id: "b3",
      title: "Wedding Shopping & Theme Finalization 🛍️",
      category: "Wedding Planning",
      date: "2027-09-01",
      completed: false,
      notes: "Match dress colors together."
    },
    {
      id: "b4",
      title: "Our Dream House Interior Setup 🏡",
      category: "Life & Future",
      date: "2028-01-10",
      completed: false,
      notes: "Warm dim lighting and cozy reading corner."
    }
  ],

  movies: [
    {
      id: "m1",
      title: "Sita Ramam",
      type: "Movie",
      status: "Watched",
      rating: 5,
      review: "Most romantic movie ever! We both cried.",
      img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80"
    },
    {
      id: "m2",
      title: "Jab We Met",
      type: "Movie",
      status: "To Watch",
      rating: 4,
      review: "Classic comfy movie for weekend!",
      img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80"
    },
    {
      id: "m3",
      title: "Bridgerton",
      type: "Series",
      status: "Watching",
      rating: 5,
      review: "Watching episode by episode on call!",
      img: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&q=80"
    }
  ],

  travel: [
    {
      id: "t1",
      title: "Skardu & Shangrila Resort",
      status: "Dreamed",
      budget: "PKR 150,000",
      date: "Summer 2027",
      img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80",
      notes: "Boat ride at Shangrila lake."
    },
    {
      id: "t2",
      title: "Turkey & Cappadocia Hot Air Balloon",
      status: "Dreamed",
      budget: "USD $2,500",
      date: "Honeymoon 2028",
      img: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=500&q=80",
      notes: "Fly in the sky at sunrise together."
    }
  ],

  memories: [
    {
      id: "p1",
      title: "First Coffee Date ☕",
      date: "2025-02-14",
      tag: "Special Date",
      img: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&q=80",
      note: "The day everything felt like magic."
    },
    {
      id: "p2",
      title: "Engagement Ring Day Ring Ceremony 💍",
      date: "2025-08-20",
      tag: "Milestone",
      img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=500&q=80",
      note: "Official start of our togetherness!"
    }
  ],

  food: [
    {
      id: "f1",
      title: "Pizza Night 🍕",
      type: "Craving",
      place: "Our Favorite Pizza Place",
      date: "",
      notes: "Extra cheese + cold drink ❤️"
    },
    {
      id: "f2",
      title: "Desi Breakfast 🥞",
      type: "Food",
      place: "Weekend Breakfast",
      date: "",
      notes: "Paratha, chai aur bohat saari baatein."
    }
  ],

  loveVault: [
    {
      id: "v1",
      title: "Open On Our Wedding Morning 👰🏻‍♀️🤵🏻",
      unlockDate: "2027-12-25",
      content: "Meri jaan, aaj hamara sab se haseen din hai. Shadi mubarak ho! I promise to love you and care for you forever.",
      isLocked: true
    }
  ]
};


let appData = {};
let currentQuoteIndex = 0;
let currentUser = null;
let supabaseClient = null;
let saveQueue = Promise.resolve();


/* =========================
   SUPABASE AUTH / SECURITY
========================= */

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const config = window.HD_SUPABASE_CONFIG || {};

  if (!window.supabase || !config.url || !config.publishableKey || config.url.includes('YOUR_')) {
    return null;
  }

  supabaseClient = window.supabase.createClient(
    config.url,
    config.publishableKey,
    {
      auth: {
  persistSession: true,
  storage: window.sessionStorage,
  autoRefreshToken: true,
  detectSessionInUrl: true
}
    }
  );

  return supabaseClient;
}


async function verifyPrivateMember(client) {
  const { data, error } = await client.rpc('hd_check_access');

  if (error) {
    throw error;
  }

  return data === true;
}


async function requirePrivateAccess() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase configuration is missing.');
  }

  const { data, error } = await client.auth.getSession();

  if (error || !data?.session?.user) {
    window.location.replace('index.html');
    return null;
  }

  const allowed = await verifyPrivateMember(client);

  if (!allowed) {
    await client.auth.signOut();
    window.location.replace('index.html?access=denied');
    return null;
  }

  currentUser = data.session.user;
  return client;
}


function watchAuthState() {
  if (!supabaseClient) return;

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      window.location.replace('index.html');
    }
  });
}


/* =========================
   SAFE HTML HELPERS
========================= */

function safe(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function safeImageUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(value, window.location.href);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    return safe(url.href);
  } catch (error) {
    return '';
  }
}


/* =========================
   DATA
========================= */

async function initData() {
  const client = await requirePrivateAccess();

  if (!client) return false;

  let localData = null;
  const stored = localStorage.getItem('hamari_dastan_data');

  if (stored) {
    try {
      localData = JSON.parse(stored);
    } catch (e) {
      localData = null;
    }
  }

  if (!localData) {
    localData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  appData = localData;

  const { data, error } = await client
    .from('couple_app_state')
    .select('data')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.data && typeof data.data === 'object') {
    appData = data.data;
  } else {
    await saveData();
  }

  if (!appData.settings) {
    appData.settings = JSON.parse(JSON.stringify(DEFAULT_DATA.settings));
  }

  if (!appData.quotes) appData.quotes = [];
  if (!appData.bucketList) appData.bucketList = [];
  if (!appData.movies) appData.movies = [];
  if (!appData.travel) appData.travel = [];
  if (!appData.memories) appData.memories = [];
  if (!appData.loveVault) appData.loveVault = [];

  if (!appData.food) {
    appData.food = [];
    await saveData();
  }

  localStorage.setItem(
    'hamari_dastan_data',
    JSON.stringify(appData)
  );

  return true;
}


function saveData() {
  localStorage.setItem(
    'hamari_dastan_data',
    JSON.stringify(appData)
  );

  if (!supabaseClient || !currentUser) {
    return Promise.resolve();
  }

  const snapshot = JSON.parse(JSON.stringify(appData));

  saveQueue = saveQueue
    .catch(() => {})
    .then(async () => {
      const { error } = await supabaseClient
        .from('couple_app_state')
        .upsert({
          id: 1,
          data: snapshot,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Secure data save failed:', error);
      }
    });

  return saveQueue;
}


/* =========================
   START
========================= */

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const ready = await initData();

    if (!ready) return;

    renderAll();
    initParticles();
    startCountdownTimer();
    lucide.createIcons();
    watchAuthState();

    const loading = document.getElementById('hd-auth-loading');
    if (loading) loading.remove();
  } catch (error) {
    console.error(error);

    const loading = document.getElementById('hd-auth-loading');
    if (loading) {
      loading.innerHTML = `
        <div class="text-center px-6">
          <div class="text-4xl mb-3">🔒</div>
          <div class="font-cursive text-4xl text-roseGold glow-text-pink">Private Access</div>
          <p class="text-xs text-gray-500 mt-2">Supabase setup incomplete or access is not allowed.</p>
          <button onclick="window.location.replace('index.html')" class="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-roseGold to-champagne text-plum-900 font-bold text-sm">Back to Login</button>
        </div>
      `;
    }
  }
});


function renderAll() {
  document.getElementById('coupleHeaderNames').textContent =
    appData.settings.coupleNames;

  renderQuote();
  renderBucketList();
  renderMovies();
  renderTravel();
  renderMemories();
  renderFood();
  renderLoveVault();
}


/* =========================
   TABS
========================= */

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });

  const button = document.getElementById(`tab-${tabId}`);
  const content = document.getElementById(`content-${tabId}`);

  if (button) button.classList.add('active');
  if (content) content.classList.remove('hidden');

  lucide.createIcons();
}


/* =========================
   COUNTDOWN
========================= */

function startCountdownTimer() {
  updateTimer();

  setInterval(() => {
    updateTimer();
  }, 1000);
}


function updateTimer() {
  const target = new Date(
    appData.settings.targetDate || "2027-12-25T00:00:00"
  );

  const now = new Date();

  let diff;

  if (appData.settings.counterMode === "together") {
    diff = now - target;
  } else {
    diff = target - now;
  }

  if (diff < 0) diff = 0;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  document.getElementById('cntDays').textContent =
    String(days).padStart(2, '0');

  document.getElementById('cntHours').textContent =
    String(hours).padStart(2, '0');

  document.getElementById('cntMinutes').textContent =
    String(minutes).padStart(2, '0');

  document.getElementById('cntSeconds').textContent =
    String(seconds).padStart(2, '0');

  if (appData.settings.counterMode === "together") {
    document.getElementById('counterLabel').textContent =
      "Togetherness Clock";

    document.getElementById('counterTitle').textContent =
      "Days We Have Been Together ❤️";

    document.getElementById('counterSubtext').textContent =
      "Every second with you is precious.";
  } else {
    document.getElementById('counterLabel').textContent =
      "Wedding / Big Day Countdown";

    document.getElementById('counterTitle').textContent =
      "Time Until Our Big Day ✨";

    document.getElementById('counterSubtext').textContent =
      "Counting every moment until our forever begins.";
  }
}


function toggleCounterMode() {
  appData.settings.counterMode =
    appData.settings.counterMode === "countdown"
      ? "together"
      : "countdown";

  saveData();
  updateTimer();
}


/* =========================
   QUOTES
========================= */

function renderQuote() {
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');

  if (!quoteText || !quoteAuthor || !appData.quotes.length) return;

  const quote = appData.quotes[currentQuoteIndex];

  quoteText.style.opacity = "0";

  setTimeout(() => {
    quoteText.textContent = quote.text;
    quoteAuthor.textContent = `— ${quote.author}`;
    quoteText.style.opacity = "1";
  }, 300);
}


function nextQuote() {
  if (!appData.quotes.length) return;

  currentQuoteIndex =
    (currentQuoteIndex + 1) % appData.quotes.length;

  renderQuote();
}


function copyQuote() {
  const quote = appData.quotes[currentQuoteIndex];
  const text = `${quote.text} — ${quote.author}`;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
  } catch (e) {}

  document.body.removeChild(textarea);

  if (typeof confetti === "function") {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#ff8fa3', '#ffd700', '#ff4d6d']
    });
  }
}


/* =========================
   BUCKET LIST
========================= */

function renderBucketList() {
  const grid = document.getElementById('bucketListGrid');
  const filter = document.getElementById('bucketCategoryFilter');

  if (!grid) return;

  const selectedCategory = filter ? filter.value : "All";
  let items = appData.bucketList || [];

  if (selectedCategory && selectedCategory !== "All") {
    items = items.filter(item => item.category === selectedCategory);
  }

  const total = appData.bucketList.length;
  const completed = appData.bucketList.filter(item => item.completed).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const progressText = document.getElementById('bucketProgressText');
  const progressBar = document.getElementById('bucketProgressBar');

  if (progressText) progressText.textContent = `${completed} / ${total} completed`;
  if (progressBar) progressBar.style.width = `${progress}%`;

  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <i data-lucide="heart" class="w-10 h-10 mx-auto mb-3 opacity-40"></i>
        <p>No bucket list items yet.</p>
      </div>
    `;

    lucide.createIcons();
    return;
  }

  items.forEach(item => {
    grid.innerHTML += `
      <div class="glass-card glass-card-hover rounded-3xl p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <button
              onclick="toggleBucketComplete('${safe(item.id)}')"
              class="mt-1 w-6 h-6 rounded-full border flex items-center justify-center ${item.completed ? 'bg-roseGold border-roseGold text-plum-900' : 'border-gray-500 text-transparent'}">
              <i data-lucide="check" class="w-4 h-4"></i>
            </button>
            <div>
              <h4 class="font-semibold text-white ${item.completed ? 'line-through opacity-60' : ''}">${safe(item.title)}</h4>
              <span class="inline-block mt-2 text-xs text-roseGold">${safe(item.category || '')}</span>
            </div>
          </div>
          <div class="flex gap-1">
            <button onclick="editItem('bucket','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteItem('bucketList','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        ${item.date ? `<p class="text-xs text-gray-400 mt-4"><i data-lucide="calendar" class="w-3.5 h-3.5 inline"></i> ${safe(item.date)}</p>` : ''}
        ${item.notes ? `<p class="text-sm text-gray-400 mt-3">${safe(item.notes)}</p>` : ''}
      </div>
    `;
  });

  lucide.createIcons();
}


function toggleBucketComplete(id) {
  const item = appData.bucketList.find(item => item.id === id);
  if (!item) return;

  item.completed = !item.completed;
  saveData();
  renderBucketList();

  if (item.completed && typeof confetti === "function") {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#ff8fa3', '#ffd700', '#ff4d6d']
    });
  }
}


/* =========================
   MOVIES
========================= */

function renderMovies() {
  const grid = document.getElementById('moviesGrid');
  const filter = document.getElementById('movieStatusFilter');

  if (!grid) return;

  const selectedStatus = filter ? filter.value : "All";
  let items = appData.movies || [];

  if (selectedStatus && selectedStatus !== "All") {
    items = items.filter(item => item.status === selectedStatus);
  }

  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <i data-lucide="film" class="w-10 h-10 mx-auto mb-3 opacity-40"></i>
        <p>No movies or series found.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  items.forEach(item => {
    const rating = Number(item.rating || 0);
    const stars = "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
    const image = safeImageUrl(item.img);

    grid.innerHTML += `
      <div class="glass-card glass-card-hover rounded-3xl overflow-hidden">
        ${image ? `<img src="${image}" alt="${safe(item.title)}" class="w-full h-48 object-cover">` : ''}
        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-xs text-roseGold">${safe(item.type || 'Movie')}</span>
              <h4 class="text-lg font-bold text-white mt-1">${safe(item.title)}</h4>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-300">${safe(item.status || '')}</span>
          </div>
          <div class="text-champagne mt-3 text-sm tracking-wider">${stars}</div>
          ${item.review ? `<p class="text-sm text-gray-400 mt-3">${safe(item.review)}</p>` : ''}
          <div class="flex justify-end gap-1 mt-4">
            <button onclick="editItem('movie','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteItem('movies','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  lucide.createIcons();
}


/* =========================
   TRAVEL
========================= */

function renderTravel() {
  const grid = document.getElementById('travelGrid');
  if (!grid) return;

  grid.innerHTML = "";

  if (!appData.travel.length) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <i data-lucide="map" class="w-10 h-10 mx-auto mb-3 opacity-40"></i>
        <p>No travel dreams yet.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  appData.travel.forEach(item => {
    const image = safeImageUrl(item.img);

    grid.innerHTML += `
      <div class="glass-card glass-card-hover rounded-3xl overflow-hidden">
        ${image ? `<img src="${image}" alt="${safe(item.title)}" class="w-full h-48 object-cover">` : ''}
        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-xs text-roseGold">${safe(item.status || 'Dreamed')}</span>
              <h4 class="text-lg font-bold text-white mt-1">${safe(item.title)}</h4>
            </div>
            <div class="flex gap-1">
              <button onclick="editItem('travel','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteItem('travel','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
          ${item.budget ? `<p class="text-sm text-champagne mt-4">💰 ${safe(item.budget)}</p>` : ''}
          ${item.date ? `<p class="text-xs text-gray-400 mt-2">📅 ${safe(item.date)}</p>` : ''}
          ${item.notes ? `<p class="text-sm text-gray-400 mt-3">${safe(item.notes)}</p>` : ''}
        </div>
      </div>
    `;
  });

  lucide.createIcons();
}


/* =========================
   MEMORIES
========================= */

function renderMemories() {
  const grid = document.getElementById('memoriesGrid');
  if (!grid) return;

  grid.innerHTML = "";

  if (!appData.memories.length) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <i data-lucide="image" class="w-10 h-10 mx-auto mb-3 opacity-40"></i>
        <p>No memories added yet.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  appData.memories.forEach(item => {
    const image = safeImageUrl(item.img);

    grid.innerHTML += `
      <div class="glass-card glass-card-hover rounded-3xl overflow-hidden">
        ${image ? `<img src="${image}" alt="${safe(item.title)}" class="w-full h-56 object-cover">` : ''}
        <div class="p-5">
          ${item.tag ? `<span class="text-xs text-roseGold">${safe(item.tag)}</span>` : ''}
          <div class="flex items-start justify-between gap-3 mt-1">
            <h4 class="text-lg font-bold text-white">${safe(item.title)}</h4>
            <div class="flex gap-1 shrink-0">
              <button onclick="editItem('memory','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteItem('memories','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
          ${item.date ? `<p class="text-xs text-gray-400 mt-2">📅 ${safe(item.date)}</p>` : ''}
          ${item.note ? `<p class="text-sm text-gray-400 mt-3">${safe(item.note)}</p>` : ''}
        </div>
      </div>
    `;
  });

  lucide.createIcons();
}


/* =========================
   FOOD & CRAVINGS
========================= */

function renderFood() {
  const grid = document.getElementById('foodGrid');
  if (!grid) return;

  grid.innerHTML = "";

  if (!appData.food || !appData.food.length) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <i data-lucide="utensils" class="w-10 h-10 mx-auto mb-3 opacity-40"></i>
        <p>No food cravings added yet.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  appData.food.forEach(item => {
    grid.innerHTML += `
      <div class="glass-card glass-card-hover rounded-3xl p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="w-11 h-11 rounded-2xl bg-roseGold/10 border border-roseGold/20 flex items-center justify-center shrink-0">
              <i data-lucide="utensils" class="w-5 h-5 text-roseGold"></i>
            </div>
            <div>
              ${item.type ? `<span class="text-xs text-roseGold">${safe(item.type)}</span>` : ''}
              <h4 class="text-lg font-bold text-white mt-1">${safe(item.title)}</h4>
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="editItem('food','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteItem('food','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        ${item.place ? `<p class="text-sm text-gray-300 mt-4">📍 ${safe(item.place)}</p>` : ''}
        ${item.date ? `<p class="text-xs text-gray-400 mt-2">📅 ${safe(item.date)}</p>` : ''}
        ${item.notes ? `<p class="text-sm text-gray-400 mt-3">${safe(item.notes)}</p>` : ''}
      </div>
    `;
  });

  lucide.createIcons();
}


/* =========================
   LOVE VAULT
========================= */

function renderLoveVault() {
  const grid = document.getElementById('loveVaultGrid');
  if (!grid) return;

  grid.innerHTML = "";

  if (!appData.loveVault.length) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <i data-lucide="lock-keyhole" class="w-10 h-10 mx-auto mb-3 opacity-40"></i>
        <p>No love letters in the vault yet.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  appData.loveVault.forEach(item => {
    const unlocked = today >= item.unlockDate;

    if (unlocked) {
      grid.innerHTML += `
        <div class="glass-card glass-card-hover rounded-3xl p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-3xl mb-3">💌</div>
              <h4 class="text-lg font-bold text-white">${safe(item.title)}</h4>
              <p class="text-xs text-roseGold mt-2">Unlocked on ${safe(item.unlockDate)}</p>
            </div>
            <div class="flex gap-1">
              <button onclick="openReadVault('${safe(item.id)}')" class="p-2 rounded-lg hover:bg-roseGold/10 text-roseGold">
                <i data-lucide="mail-open" class="w-4 h-4"></i>
              </button>
              <button onclick="editItem('vault','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteItem('loveVault','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
          <button onclick="openReadVault('${safe(item.id)}')" class="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-roseGold/20 to-champagne/10 text-roseGold text-sm font-semibold">Open Love Letter 💕</button>
        </div>
      `;
    } else {
      grid.innerHTML += `
        <div class="glass-card rounded-3xl p-6 opacity-80">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-3xl mb-3">🔐</div>
              <h4 class="text-lg font-bold text-white">${safe(item.title)}</h4>
              <p class="text-xs text-gray-400 mt-2">Unlocks on ${safe(item.unlockDate)}</p>
            </div>
            <div class="flex gap-1">
              <button onclick="editItem('vault','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteItem('loveVault','${safe(item.id)}')" class="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
          <div class="mt-5 py-3 text-center rounded-xl bg-white/5 text-gray-500 text-sm">🔒 Locked until ${safe(item.unlockDate)}</div>
        </div>
      `;
    }
  });

  lucide.createIcons();
}


function openReadVault(id) {
  const item = appData.loveVault.find(item => item.id === id);
  if (!item) return;

  document.getElementById('readVaultTitle').textContent = item.title;
  document.getElementById('readVaultDate').textContent = `Unlocked on ${item.unlockDate}`;
  document.getElementById('readVaultContent').textContent = item.content;
  document.getElementById('readVaultModal').classList.remove('hidden');

  lucide.createIcons();

  if (typeof confetti === "function") {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ff8fa3', '#ffd700', '#ff4d6d']
    });
  }
}


/* =========================
   UNIVERSAL MODAL
========================= */

function openModal(type, editId = null) {
  const modal = document.getElementById('universalModal');
  const form = document.getElementById('universalForm');
  const fields = document.getElementById('formFields');

  if (!modal || !form || !fields) return;

  document.getElementById('formType').value = type;
  document.getElementById('formEditId').value = editId || '';

  const lists = {
    bucket: appData.bucketList,
    movie: appData.movies,
    travel: appData.travel,
    memory: appData.memories,
    food: appData.food,
    vault: appData.loveVault
  };

  const list = lists[type] || [];
  const item = editId ? list.find(x => x.id === editId) : null;
  fields.innerHTML = "";

  if (type === 'bucket') {
    fields.innerHTML = `
      <div>
        <label class="block text-xs text-gray-400 mb-2">Title</label>
        <input name="title" required value="${safe(item?.title || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Bucket list item">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Category</label>
        <input name="category" value="${safe(item?.category || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Category">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Date</label>
        <input type="date" name="date" value="${safe(item?.date || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Notes</label>
        <textarea name="notes" rows="3" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Notes">${safe(item?.notes || '')}</textarea>
      </div>
    `;
  }

  if (type === 'movie') {
    fields.innerHTML = `
      <div>
        <label class="block text-xs text-gray-400 mb-2">Title</label>
        <input name="title" required value="${safe(item?.title || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Movie or series">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Type</label>
        <select name="type" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold">
          <option value="Movie" ${item?.type === 'Movie' ? 'selected' : ''}>Movie</option>
          <option value="Series" ${item?.type === 'Series' ? 'selected' : ''}>Series</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Status</label>
        <select name="status" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold">
          <option value="To Watch" ${item?.status === 'To Watch' ? 'selected' : ''}>To Watch</option>
          <option value="Watching" ${item?.status === 'Watching' ? 'selected' : ''}>Watching</option>
          <option value="Watched" ${item?.status === 'Watched' ? 'selected' : ''}>Watched</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Image URL</label>
        <input name="img" value="${safe(item?.img || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="https://...">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Review</label>
        <textarea name="review" rows="3" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Your review">${safe(item?.review || '')}</textarea>
      </div>
    `;
  }

  if (type === 'travel') {
    fields.innerHTML = `
      <div>
        <label class="block text-xs text-gray-400 mb-2">Title</label>
        <input name="title" required value="${safe(item?.title || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Travel destination">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Budget</label>
        <input name="budget" value="${safe(item?.budget || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="PKR 150,000">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Date</label>
        <input name="date" value="${safe(item?.date || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Summer 2027">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Image URL</label>
        <input name="img" value="${safe(item?.img || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="https://...">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Notes</label>
        <textarea name="notes" rows="3" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Travel notes">${safe(item?.notes || '')}</textarea>
      </div>
    `;
  }

  if (type === 'memory') {
    fields.innerHTML = `
      <div>
        <label class="block text-xs text-gray-400 mb-2">Title</label>
        <input name="title" required value="${safe(item?.title || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Memory title">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Date</label>
        <input type="date" name="date" value="${safe(item?.date || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Tag</label>
        <input name="tag" value="${safe(item?.tag || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Special Date">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Image URL</label>
        <input name="img" value="${safe(item?.img || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="https://...">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Note</label>
        <textarea name="note" rows="3" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Memory note">${safe(item?.note || '')}</textarea>
      </div>
    `;
  }

  if (type === 'food') {
    fields.innerHTML = `
      <div>
        <label class="block text-xs text-gray-400 mb-2">Food / Craving</label>
        <input name="title" required value="${safe(item?.title || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Pizza Night 🍕">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Type</label>
        <select name="type" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold">
          <option value="Craving" ${item?.type === 'Craving' ? 'selected' : ''}>Craving</option>
          <option value="Food" ${item?.type === 'Food' ? 'selected' : ''}>Food</option>
          <option value="Restaurant" ${item?.type === 'Restaurant' ? 'selected' : ''}>Restaurant</option>
          <option value="To Try" ${item?.type === 'To Try' ? 'selected' : ''}>To Try</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Place / Restaurant</label>
        <input name="place" value="${safe(item?.place || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Restaurant or place">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Date</label>
        <input type="date" name="date" value="${safe(item?.date || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Notes</label>
        <textarea name="notes" rows="3" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Extra cheese, chai, dessert etc.">${safe(item?.notes || '')}</textarea>
      </div>
    `;
  }

  if (type === 'vault') {
    fields.innerHTML = `
      <div>
        <label class="block text-xs text-gray-400 mb-2">Title</label>
        <input name="title" required value="${safe(item?.title || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Open On Our Wedding Morning">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Unlock Date</label>
        <input type="date" name="unlockDate" required value="${safe(item?.unlockDate || '')}" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-2">Love Letter</label>
        <textarea name="content" required rows="6" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-roseGold" placeholder="Write your love letter...">${safe(item?.content || '')}</textarea>
      </div>
    `;
  }

  modal.classList.remove('hidden');
  lucide.createIcons();
}


function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}


function editItem(type, id) {
  openModal(type, id);
}


/* =========================
   FORM SUBMIT
========================= */

function handleFormSubmit(e) {
  e.preventDefault();

  const type = document.getElementById('formType').value;
  const editId = document.getElementById('formEditId').value;
  const formData = new FormData(document.getElementById('universalForm'));
  const obj = Object.fromEntries(formData.entries());

  if (type === 'bucket') {
    if (editId) {
      const index = appData.bucketList.findIndex(x => x.id === editId);
      if (index !== -1) {
        appData.bucketList[index] = { ...appData.bucketList[index], ...obj };
      }
    } else {
      appData.bucketList.push({ id: 'b' + Date.now(), ...obj, completed: false });
    }
    renderBucketList();
  }

  else if (type === 'movie') {
    if (editId) {
      const index = appData.movies.findIndex(x => x.id === editId);
      if (index !== -1) {
        appData.movies[index] = { ...appData.movies[index], ...obj };
      }
    } else {
      appData.movies.push({ id: 'm' + Date.now(), ...obj, rating: 5 });
    }
    renderMovies();
  }

  else if (type === 'travel') {
    if (editId) {
      const index = appData.travel.findIndex(x => x.id === editId);
      if (index !== -1) {
        appData.travel[index] = { ...appData.travel[index], ...obj };
      }
    } else {
      appData.travel.push({ id: 't' + Date.now(), ...obj, status: 'Dreamed' });
    }
    renderTravel();
  }

  else if (type === 'memory') {
    if (editId) {
      const index = appData.memories.findIndex(x => x.id === editId);
      if (index !== -1) {
        appData.memories[index] = { ...appData.memories[index], ...obj };
      }
    } else {
      appData.memories.push({ id: 'p' + Date.now(), ...obj });
    }
    renderMemories();
  }

  else if (type === 'food') {
    if (editId) {
      const index = appData.food.findIndex(x => x.id === editId);
      if (index !== -1) {
        appData.food[index] = { ...appData.food[index], ...obj };
      }
    } else {
      appData.food.push({ id: 'f' + Date.now(), ...obj });
    }
    renderFood();
  }

  else if (type === 'vault') {
    appData.loveVault.push({ id: 'v' + Date.now(), ...obj, isLocked: true });
    renderLoveVault();
  }

  saveData();
  closeModal('universalModal');
}


/* =========================
   DELETE
========================= */

function deleteItem(listKey, id) {
  if (!appData[listKey]) return;

  appData[listKey] = appData[listKey].filter(item => item.id !== id);
  saveData();
  renderAll();
}


/* =========================
   DATE SETTINGS
========================= */

function openDateModal() {
  const modal = document.getElementById('dateModal');
  const dateInput = document.getElementById('targetDateInput');
  const modeInput = document.getElementById('counterModeInput');

  if (!modal || !dateInput || !modeInput) return;

  dateInput.value = (appData.settings.targetDate || "2027-12-25T00:00:00").split('T')[0];
  modeInput.value = appData.settings.counterMode || "countdown";
  modal.classList.remove('hidden');
}


function saveDateSettings() {
  const dateInput = document.getElementById('targetDateInput');
  const modeInput = document.getElementById('counterModeInput');

  if (!dateInput.value) return;

  appData.settings.targetDate = `${dateInput.value}T00:00:00`;
  appData.settings.counterMode = modeInput.value;

  saveData();
  updateTimer();
  closeModal('dateModal');
}


/* =========================
   COUPLE NAMES
========================= */

function openNamesModal() {
  const modal = document.getElementById('namesModal');
  const input = document.getElementById('coupleNamesInput');

  if (!modal || !input) return;

  input.value = appData.settings.coupleNames || "";
  modal.classList.remove('hidden');
}


function saveCoupleNames() {
  const input = document.getElementById('coupleNamesInput');
  if (!input) return;

  appData.settings.coupleNames =
    input.value.trim() || "Fiancé & Me ❤️";

  saveData();

  document.getElementById('coupleHeaderNames').textContent =
    appData.settings.coupleNames;

  closeModal('namesModal');
}


/* =========================
   BACKUP
========================= */

function openBackupModal() {
  const modal = document.getElementById('backupModal');
  if (modal) modal.classList.remove('hidden');
}


function exportData() {
  const data = JSON.stringify(appData, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];

  a.href = url;
  a.download = `hamari_dastan_backup_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);

      if (!imported.settings) {
        throw new Error("Invalid backup");
      }

      appData = imported;

      if (!appData.food) {
        appData.food = [];
      }

      saveData();
      renderAll();
      closeModal('backupModal');
      alert("Backup imported successfully ❤️");
    } catch (error) {
      alert("Invalid backup file.");
    }
  };

  reader.readAsText(file);
}


/* =========================
   LOVE SURPRISE
========================= */

function triggerLoveSurprise() {
  if (typeof confetti !== "function") return;

  confetti({
    particleCount: 180,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#ff8fa3', '#ffd700', '#ff4d6d']
  });
}


/* =========================
   PARTICLES
========================= */

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.speedY = Math.random() * 0.5 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.2;
      this.type = Math.random() > 0.7 ? 'heart' : 'circle';
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX;

      if (this.y < -20) {
        this.reset();
        this.y = canvas.height + 20;
      }

      if (this.x < -20) this.x = canvas.width + 20;
      if (this.x > canvas.width + 20) this.x = -20;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = '#ff8fa3';

      if (this.type === 'heart') {
        ctx.font = `${this.size * 5}px Arial`;
        ctx.fillText('♥', this.x, this.y);
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  for (let i = 0; i < 45; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
}
