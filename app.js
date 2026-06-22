// ======================== UTILITIES & FIREBASE ========================
const FIREBASE_DB_URL = "https://rt-ku-2d49f-default-rtdb.asia-southeast1.firebasedatabase.app";

function showLoading(show) {
    document.getElementById('global-loader').style.display = show ? 'flex' : 'none';
}

// ===== Modern Alert & Confirm (SweetAlert2) =====
function swalAlert(message, icon = 'success', title = '') {
    return Swal.fire({
        icon,
        title: title || (icon === 'success' ? 'Berhasil!' : icon === 'error' ? 'Perhatian!' : 'Info'),
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4f46e5',
        background: '#ffffff',
        borderRadius: '16px',
        customClass: {
            popup: 'swal-popup-custom',
            confirmButton: 'swal-btn-custom'
        }
    });
}

function swalConfirm(message, title = 'Konfirmasi', icon = 'warning') {
    return Swal.fire({
        icon,
        title,
        text: message,
        showCancelButton: true,
        confirmButtonText: 'Ya, Lanjutkan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        background: '#ffffff',
        reverseButtons: true,
        customClass: {
            popup: 'swal-popup-custom'
        }
    }).then(r => r.isConfirmed);
}

async function firebaseGet(path) {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        return data || null;
    } catch (e) {
        console.error("Firebase GET Error:", e);
        return null;
    }
}

async function firebasePut(path, data) {
    try {
        await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        console.error("Firebase PUT Error:", e);
    }
}

function generateNoReg() {
    return String(Math.floor(10000000 + Math.random() * 90000000));
}

// ======================== AUTHENTICATION ========================
let currentUser = null;
let currentName = "";
let activeRT = null;

const daftarPekerjaan = [
    "BELUM/TIDAK BEKERJA", "MENGURUS RUMAH TANGGA", "PELAJAR/MAHASISWA", "PENSIUNAN",
    "PEGAWAI NEGERI SIPIL (PNS)", "TENTARA NASIONAL INDONESIA (TNI)", "KEPOLISIAN RI (POLRI)",
    "PERDAGANGAN", "PETANI/PEKEBUN", "PETERNAK", "NELAYAN/PERIKANAN", "INDUSTRI", "KONSTRUKSI",
    "TRANSPORTASI", "KARYAWAN SWASTA", "KARYAWAN BUMN", "KARYAWAN BUMD", "KARYAWAN HONORER",
    "BURUH HARIAN LEPAS", "BURUH TANI/PERKEBUNAN", "BURUH NELAYAN/PERIKANAN", "BURUH PETERNAKAN",
    "PEMBANTU RUMAH TANGGA", "TUKANG CUKUR", "TUKANG LISTRIK", "TUKANG BATU", "TUKANG KAYU",
    "TUKANG SOL SEPATU", "TUKANG LAS/PANDAI BESI", "TUKANG JAHIT", "TUKANG GIGI", "PENATA RIAS",
    "PENATA BUSANA", "PENATA RAMBUT", "MEKANIK", "SENIMAN", "TABIB", "PARAJI", "PERANCANG BUSANA",
    "PENTERJEMAH", "IMAM MASJID", "PENDETA", "PASTOR", "WARTAWAN", "USTADZ/MUBALIGH", "JURU MASAK",
    "PROMOTOR ACARA", "ANGGOTA DPR-RI", "ANGGOTA DPD", "ANGGOTA BPK", "PRESIDEN", "WAKIL PRESIDEN",
    "ANGGOTA MAHKAMAH KONSTITUSI", "ANGGOTA KABINET/KEMENTERIAN", "DUTA BESAR", "GUBERNUR",
    "WAKIL GUBERNUR", "BUPATI", "WAKIL BUPATI", "WALIKOTA", "WAKIL WALIKOTA", "ANGGOTA DPRD PROVINSI",
    "ANGGOTA DPRD KABUPATEN/KOTA", "DOSEN", "GURU", "PILOT", "PENGACARA", "NOTARIS", "ARSITEK",
    "AKUNTAN", "KONSULTAN", "DOKTER", "BIDAN", "PERAWAT", "APOTEKER", "PSIKIATER/PSIKOLOG",
    "PENYIAR TELEVISI", "PENYIAR RADIO", "PELAUT", "PENELITI", "SOPIR", "PIALANG", "PARANORMAL",
    "PEDAGANG", "PERANGKAT DESA", "KEPALA DESA", "BIARAWATI", "WIRASWASTA"
];

(async function initSuperAdmin() {
    let users = await firebaseGet('rtku_users') || {};
    if (!users['admin']) {
        const initUsers = {
            'admin': { name: 'Super Admin', password: '@Agustus27', role: 'superadmin' },
            'rt01': { name: 'RT 01 / RW 01', password: '123456', role: 'admin' },
            'rt02': { name: 'RT 02 / RW 01', password: '123456', role: 'admin' }
        };
        await firebasePut('rtku_users', initUsers);
    }
    
    // Populate dropdown pekerjaan
    const selects = document.querySelectorAll('.pekerjaan-select');
    selects.forEach(select => {
        daftarPekerjaan.forEach(pek => {
            const opt = document.createElement('option');
            opt.value = pek;
            opt.innerText = pek;
            select.appendChild(opt);
        });
    });
})();

function toggleAuth(type) {
    if (type === 'register') {
        document.getElementById('login-card').style.display = 'none';
        document.getElementById('register-card').style.display = 'block';
    } else {
        document.getElementById('register-card').style.display = 'none';
        document.getElementById('login-card').style.display = 'block';
    }
}

document.getElementById('form-register')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading(true);
    const name     = document.getElementById('reg-name').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    
    let users = await firebaseGet('rtku_users') || {};
    if (users[username]) { 
        showLoading(false);
        await swalAlert('Username sudah terpakai!', 'error'); 
        return; 
    }
    users[username] = { name, password, role: "admin", verified: false };
    await firebasePut('rtku_users', users);
    showLoading(false);
    await swalAlert('Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi dari Superadmin.', 'success', 'Pendaftaran Berhasil');
    toggleAuth('login');
});

document.getElementById('form-login')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading(true);
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    let users = await firebaseGet('rtku_users') || {};
    if (users[username] && users[username].password === password) {
        if (users[username].role !== 'superadmin' && users[username].verified === false) {
            showLoading(false);
            await swalAlert('Akun Anda belum diverifikasi oleh Superadmin. Harap tunggu atau hubungi Superadmin.', 'warning', 'Akun Belum Aktif');
            return;
        }
        currentUser = username;
        currentName = users[username].name;
        activeRT    = (username === 'admin') ? 'all' : username;
        
        if (username !== 'admin') {
            const deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            users[username].deviceId = deviceId;
            await firebasePut('rtku_users', users);
            localStorage.setItem('session_device_id', deviceId);
        }

        localStorage.setItem('session_user', JSON.stringify({ username: currentUser, name: currentName, activeRT: activeRT }));
        
        document.getElementById('auth-container').style.opacity = '0';
        setTimeout(async () => {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            await initApp();
            showLoading(false);
        }, 300);
    } else {
        showLoading(false);
        await swalAlert('Username atau password salah!', 'error', 'Login Gagal');
    }
});

async function logout() {
    const confirmed = await Swal.fire({
        icon: 'question',
        title: 'Keluar dari Aplikasi?',
        text: 'Anda akan keluar dari sesi ini.',
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-right-from-bracket"></i> Keluar',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        reverseButtons: true
    });
    if (!confirmed.isConfirmed) return;

    currentUser = null; currentName = ""; activeRT = null;
    localStorage.removeItem('session_user');
    localStorage.removeItem('session_device_id');
    document.getElementById('app-container').style.display = 'none';
    const auth = document.getElementById('auth-container');
    auth.style.display = 'flex';
    setTimeout(() => auth.style.opacity = '1', 50);
    document.getElementById('form-login').reset();
    document.getElementById('admin-rt-selector').style.display = 'none';
    document.getElementById('nav-manajemen-user').style.display = 'none';
    document.getElementById('nav-pindah').style.display = 'none';
    document.getElementById('nav-arsip').style.display = 'none';
}

// ======================== DATA LAYER ========================
let dataKK = [], dataSuratMasuk = [], dataSuratKeluar = [];
let dataAgenda = [], dataLapor = [], dataDokumentasi = [], dataPindah = [];

async function loadData() {
    if (!currentUser) return;
    showLoading(true);
    dataKK = []; dataSuratMasuk = []; dataSuratKeluar = [];
    dataAgenda = []; dataLapor = []; dataDokumentasi = []; dataPindah = [];

    if (activeRT === 'all') {
        let users = await firebaseGet('rtku_users') || {};
        const fetchPromises = [];
        
        Object.keys(users).forEach(u => {
            if (u === 'admin') return;
            fetchPromises.push((async () => {
                const kkData = await firebaseGet(`${u}_rtku_kk`) || [];
                const smData = await firebaseGet(`${u}_rtku_sm`) || [];
                const skData = await firebaseGet(`${u}_rtku_sk`) || [];
                const agendaData = await firebaseGet(`${u}_rtku_agenda`) || [];
                const laporData = await firebaseGet(`${u}_rtku_lapor`) || [];
                const dokData = await firebaseGet(`${u}_rtku_dok`) || [];
                const pindahRT = await firebaseGet(`${u}_rtku_pindah`) || [];
                
                dataKK = dataKK.concat(kkData);
                dataSuratMasuk = dataSuratMasuk.concat(smData);
                dataSuratKeluar = dataSuratKeluar.concat(skData);
                dataAgenda = dataAgenda.concat(agendaData);
                dataLapor = dataLapor.concat(laporData);
                dataDokumentasi = dataDokumentasi.concat(dokData);
                pindahRT.forEach(p => dataPindah.push({ ...p, _rtUser: u, _rtNama: users[u].name }));
            })());
        });
        await Promise.all(fetchPromises);
    } else {
        dataKK          = await firebaseGet(`${activeRT}_rtku_kk`) || [];
        dataSuratMasuk  = await firebaseGet(`${activeRT}_rtku_sm`) || [];
        dataSuratKeluar = await firebaseGet(`${activeRT}_rtku_sk`) || [];
        dataAgenda      = await firebaseGet(`${activeRT}_rtku_agenda`) || [];
        dataLapor       = await firebaseGet(`${activeRT}_rtku_lapor`) || [];
        dataDokumentasi = await firebaseGet(`${activeRT}_rtku_dok`) || [];
        dataPindah      = await firebaseGet(`${activeRT}_rtku_pindah`) || [];
    }
    showLoading(false);
}

async function appendDataToStorage(rtName, key, item) {
    showLoading(true);
    const sk = `${rtName}_rtku_${key}`;
    let arr = await firebaseGet(sk) || [];
    arr.push(item);
    await firebasePut(sk, arr);
    await loadData();
    updateDashboardStats();
    showLoading(false);
}

// ======================== APP INIT ========================
async function initApp() {
    document.getElementById('topbar-name').innerText = currentName;
    document.getElementById('topbar-avatar').innerText = currentName.substring(0,2).toUpperCase();
    const selector     = document.getElementById('admin-rt-selector');
    const navManajemen = document.getElementById('nav-manajemen-user');
    const navPindah    = document.getElementById('nav-pindah');

    if (currentUser === 'admin') {
        selector.style.display     = 'block';
        navManajemen.style.display = 'flex';
        navPindah.style.display    = 'flex';
        document.getElementById('nav-arsip').style.display = 'flex';
        await populateAdminSelector();
        document.getElementById('dash-username').innerText = "Super Admin (Global)";
    } else {
        selector.style.display     = 'none';
        navManajemen.style.display = 'none';
        navPindah.style.display    = 'flex';
        document.getElementById('nav-arsip').style.display = 'none';
        document.getElementById('dash-username').innerText = currentName;
    }

    await loadData();
    updateDashboardStats();
    document.querySelector('.nav-item[data-target="dashboard"]').click();
}

async function populateAdminSelector() {
    const selector = document.getElementById('admin-rt-selector');
    selector.innerHTML = '<option value="all">Semua Data (Global)</option>';
    let users = await firebaseGet('rtku_users') || {};
    Object.keys(users).forEach(u => {
        if (u !== 'admin') selector.innerHTML += `<option value="${u}">Data ${users[u].name} (${u})</option>`;
    });
    selector.value = activeRT;
}

async function changeAdminView(val) {
    activeRT = val;
    const users = await firebaseGet('rtku_users') || {};
    document.getElementById('dash-username').innerText =
        (val === 'all') ? "Super Admin (Global)" : (users[val]?.name || val);
    await loadData(); 
    updateDashboardStats();
    const active = document.querySelector('.nav-item.active')?.getAttribute('data-target');
    refreshSection(active);
}

function refreshSection(id) {
    if (id === 'data-masyarakat') { backToKKList(); renderKKList(); }
    else if (id === 'surat')      { renderSuratMasuk(); renderSuratKeluar(); }
    else if (id === 'agenda')     { renderAgenda(); }
    else if (id === 'lapor')      { renderLapor(); }
    else if (id === 'dokumentasi'){ renderDokumentasi(); }
    else if (id === 'pindah-domisili') { renderPindah(); }
    else if (id === 'manajemen-user')  { renderUserManagement(); }
    else if (id === 'arsip-data')      { renderArsip(); }
}

// ======================== NAVIGATION ========================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        if (!currentUser) return;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        const id = this.getAttribute('data-target');
        document.getElementById(id).classList.add('active');
        const titles = {
            dashboard: 'Dashboard', surat: 'Surat Menyurat',
            'data-masyarakat': 'Data Masyarakat', agenda: 'Agenda RT',
            lapor: 'Lapor RT', dokumentasi: 'Dokumentasi RT',
            'pindah-domisili': 'Pindah Domisili',
            'manajemen-user': 'Manajemen User',
            'arsip-data': 'Arsip Data'
        };
        document.getElementById('topbar-title').innerText = titles[id] || id;
        refreshSection(id);
    });
});

// ======================== MODAL HELPERS ========================
async function showModal(id) {
    if (currentUser === 'admin' && id !== 'modal-ganti-password') {
        const form = document.querySelector(`#${id} form`);
        if (form && !form.querySelector('.dynamic-rt-target')) {
            showLoading(true);
            let users = await firebaseGet('rtku_users') || {};
            let opts = '<option value="">-- Pilih RT Tujuan --</option>';
            let hasUsers = false;
            Object.keys(users).forEach(u => {
                if (u !== 'admin') { opts += `<option value="${u}">Data ${users[u].name} (${u})</option>`; hasUsers = true; }
            });
            if (!hasUsers) { await swalAlert('Belum ada akun RT terdaftar.', 'info'); return; }
            const div = document.createElement('div');
            div.className = 'form-group dynamic-rt-target';
            div.style.cssText = 'background:#fef2f2;padding:0.75rem;border-radius:var(--radius-md);border:1px dashed var(--danger-color);';
            div.innerHTML = `<label class="form-label" style="color:var(--danger-color);font-weight:600;"><i class="fa-solid fa-location-crosshairs"></i> Kirim ke RT Tujuan</label><select class="form-control target-rt-select" required>${opts}</select>`;
            form.insertBefore(div, form.firstChild);
        }
        if (form?.querySelector('.target-rt-select') && activeRT !== 'all') {
            form.querySelector('.target-rt-select').value = activeRT;
        }
        showLoading(false);
    }
    document.getElementById(id).classList.add('active');
}

function hideModal(id) {
    document.getElementById(id).classList.remove('active');
    const form = document.querySelector(`#${id} form`);
    if (form) {
        form.reset();
        form.querySelector('.dynamic-rt-target')?.remove();
    }
}

function getTargetRT(formEl) {
    if (currentUser === 'admin') {
        const sel = formEl.querySelector('.target-rt-select');
        if (sel) return sel.value;
    }
    return activeRT;
}

// ======================== DASHBOARD ========================
async function updateDashboardStats() {
    document.getElementById('stat-kk').innerText = dataKK.length;
    let totalWarga = 0;
    let totalLk = 0;
    let totalPr = 0;

    dataKK.forEach(k => {
        totalWarga += k.anggota.length;
        k.anggota.forEach(a => {
            if (a.jk === 'Laki-laki') totalLk++;
            else if (a.jk === 'Perempuan') totalPr++;
        });
    });

    const wargaEl = document.getElementById('stat-warga');
    if (wargaEl) wargaEl.innerText = totalWarga;
    
    const lkEl = document.getElementById('stat-lk');
    if (lkEl) lkEl.innerText = totalLk;
    
    const prEl = document.getElementById('stat-pr');
    if (prEl) prEl.innerText = totalPr;

    const pindahEl = document.getElementById('stat-pindah');
    const pindahCard = document.getElementById('stat-pindah-card');
    if (pindahEl) {
        pindahEl.innerText = dataPindah.length;
        if (pindahCard) pindahCard.style.display = (currentUser !== 'admin') ? 'block' : 'none';
    }

    // Populate placeholder RT Info
    const infoKetua = document.getElementById('info-ketua-rt');
    const infoSekretaris = document.getElementById('info-sekretaris');
    const infoBendahara = document.getElementById('info-bendahara');
    const infoAlamat = document.getElementById('info-alamat-rt');
    const infoRs = document.getElementById('info-kontak-rs');
    const infoDamkar = document.getElementById('info-kontak-damkar');
    const infoPolisi = document.getElementById('info-kontak-polisi');
    const infoKeamanan = document.getElementById('info-kontak-keamanan');

    if (infoKetua) {
        // we already fetched users in loadData if activeRT === 'all', but let's fetch again for safety, or better just rely on a local cache? No, let's fetch it since it's just dashboard.
        let targetRtKey = activeRT === 'all' ? null : activeRT;
        let users = await firebaseGet('rtku_users') || {};
        let namaRT = targetRtKey ? (users[targetRtKey]?.name || '-') : '-';
        let isGlobal = activeRT === 'all';
        infoKetua.innerText = isGlobal ? '-' : namaRT;
        infoSekretaris.innerText = isGlobal ? '-' : 'Belum diatur';
        infoBendahara.innerText = isGlobal ? '-' : 'Belum diatur';
        infoAlamat.innerText = isGlobal ? 'Pilih satu RT di dropdown (pojok kanan atas) untuk melihat detail info' : 'Belum diatur (Silakan update di profil)';
        infoRs.innerText = isGlobal ? '-' : '118 / 119';
        infoDamkar.innerText = isGlobal ? '-' : '113';
        infoPolisi.innerText = isGlobal ? '-' : '110';
        infoKeamanan.innerText = isGlobal ? '-' : 'Belum diatur';
    }
}

// ======================== DATA MASYARAKAT — KK LIST ========================
function renderKKList(searchQuery = '') {
    const tbody = document.getElementById('tbody-kk');
    if (!tbody) return;
    tbody.innerHTML = '';
    const filtered = dataKK.filter(kk => {
        const q = searchQuery.toLowerCase();
        return kk.noKK.toLowerCase().includes(q) || kk.kepalaKeluarga.toLowerCase().includes(q);
    });
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><i class="fa-solid fa-users-slash"></i>Tidak ada data KK ditemukan.</td></tr>`;
        return;
    }
    filtered.forEach(kk => {
        const canEdit = !(currentUser === 'admin' && activeRT === 'all');
        tbody.innerHTML += `
        <tr>
            <td><span class="badge badge-primary">${kk.noReg || '-'}</span></td>
            <td style="font-family:monospace;font-weight:700;color:var(--primary-color);">${kk.noKK}</td>
            <td style="font-weight:600;">${kk.kepalaKeluarga}</td>
            <td><a href="tel:${kk.ponsel}" style="color:var(--primary-color);text-decoration:none;"><i class="fa-solid fa-phone" style="font-size:0.7rem;"></i> ${kk.ponsel || '-'}</a></td>
            <td style="color:var(--text-secondary);">${kk.alamat}</td>
            <td><span class="badge badge-success"><i class="fa-solid fa-person"></i> ${kk.anggota.length} org</span></td>
            <td>
                <div class="btn-action-group">
                    <button class="btn btn-outline" onclick="viewDetailKK('${kk.noKK}')">
                        <i class="fa-solid fa-eye"></i> Detail
                    </button>
                    ${canEdit ? `
                    <button class="btn" style="background:#f59e0b;color:#fff;" onclick="openPindahKK('${kk.noKK}')">
                        <i class="fa-solid fa-truck-moving"></i> Pindah
                    </button>
                    <button class="btn btn-danger" onclick="hapusKK('${kk.noKK}')">
                        <i class="fa-solid fa-trash"></i> Hapus
                    </button>` : ''}
                </div>
            </td>
        </tr>`;
    });
}

document.getElementById('btn-search')?.addEventListener('click', () => renderKKList(document.getElementById('search-kk').value));
document.getElementById('search-kk')?.addEventListener('keyup', e => { if (e.key === 'Enter') renderKKList(e.target.value); });

document.getElementById('input-kk-kelurahan')?.addEventListener('change', function(e) {
    const val = e.target.value;
    let kec = '';
    const barat = ['Tanjungpinang Barat', 'Kemboja', 'Bukit Cermin', 'Kampung Baru'];
    const kota = ['Tanjungpinang Kota', 'Kampung Bugis', 'Senggarang', 'Penyengat'];
    const timur = ['Melayu Kota Piring', 'Kampung Bulang', 'Batu IX', 'Pinang Kencana', 'Air Raja'];
    const bestari = ['Dompak', 'Tanjung Unggat', 'Tanjung Ayun Sakti', 'Tanjungpinang Timur', 'Sei Jang'];

    if (barat.includes(val)) kec = 'TANJUNGPINANG BARAT';
    else if (kota.includes(val)) kec = 'TANJUNGPINANG KOTA';
    else if (timur.includes(val)) kec = 'TANJUNGPINANG TIMUR';
    else if (bestari.includes(val)) kec = 'BUKIT BESTARI';

    document.getElementById('input-kk-kecamatan').value = kec;
});

document.getElementById('form-add-kk')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading(true);
    const noKK = document.getElementById('input-nokk').value;
    let isExist = false;
    let users = await firebaseGet('rtku_users') || {};
    for (const u of Object.keys(users)) {
        const kks = await firebaseGet(`${u}_rtku_kk`) || [];
        if (kks.find(k => k.noKK === noKK)) isExist = true;
    }
    if (isExist) { showLoading(false); await swalAlert('Nomor KK sudah terdaftar!', 'error'); return; }
    const targetRT = getTargetRT(this);
    if (!targetRT) { showLoading(false); await swalAlert('Pilih RT tujuan!', 'info'); return; }
    const newKK = {
        noReg: generateNoReg(), noKK,
        kepalaKeluarga: document.getElementById('input-kepala').value,
        ponsel: document.getElementById('input-kk-ponsel').value,
        tempatLahir: document.getElementById('input-kk-tempat-lahir').value,
        tanggalLahir: document.getElementById('input-kk-tgl-lahir').value,
        agama: document.getElementById('input-kk-agama').value,
        pekerjaan: document.getElementById('input-kk-pekerjaan').value,
        alamat: document.getElementById('input-alamat').value,
        rtRw: document.getElementById('input-kk-rtrw').value,
        kelurahan: document.getElementById('input-kk-kelurahan').value,
        kecamatan: document.getElementById('input-kk-kecamatan').value,
        anggota: []
    };

    // Auto-insert Kepala Keluarga as the first member
    const kkNik = document.getElementById('input-kk-nik').value || "-";
    newKK.anggota.push({
        noReg: newKK.noReg,
        nik: kkNik,
        nama: newKK.kepalaKeluarga,
        jk: "Laki-laki", // Default to Laki-laki
        hubungan: "Kepala Keluarga",
        tempatLahir: newKK.tempatLahir,
        tanggalLahir: newKK.tanggalLahir,
        pekerjaan: newKK.pekerjaan,
        ponsel: newKK.ponsel
    });

    await appendDataToStorage(targetRT, 'kk', newKK);
    renderKKList();
    hideModal('modal-add-kk');
    showLoading(false);
    await swalAlert(`Data KK disimpan! No. Reg: ${newKK.noReg}`, 'success', 'Data Tersimpan');
});

// ======================== HAPUS KK → ARSIP ========================
async function hapusKK(noKK) {
    const rtTarget = activeRT === 'all' ? null : activeRT;
    if (!rtTarget) { await swalAlert('Pilih RT terlebih dahulu.', 'info'); return; }
    const kk = dataKK.find(k => k.noKK === noKK);
    if (!kk) return;
    const ok1 = await swalConfirm(`Apakah Anda yakin ingin menghapus KK "${kk.kepalaKeluarga}" (${noKK}) beserta ${kk.anggota.length} anggota?`, 'Hapus KK?');
    if (!ok1) return;

    showLoading(true);
    await simpanKeArsip(rtTarget, 'kk', {
        tglHapus: new Date().toLocaleDateString('id-ID'),
        noReg: kk.noReg || '-',
        noKK: kk.noKK,
        kepalaKeluarga: kk.kepalaKeluarga,
        ponsel: kk.ponsel || '-',
        alamat: kk.alamat,
        jumlahAnggota: kk.anggota.length,
        dataAsli: { ...kk }
    });

    let kks = await firebaseGet(`${rtTarget}_rtku_kk`) || [];
    kks = kks.filter(k => k.noKK !== noKK);
    await firebasePut(`${rtTarget}_rtku_kk`, kks);
    await loadData(); updateDashboardStats(); renderKKList();
    showLoading(false);
    await swalAlert(`KK ${noKK} berhasil dihapus dari daftar.`, 'success', 'Berhasil Dihapus');
}

// ======================== DETAIL KK & ANGGOTA ========================
let currentViewKK = null;
let currentViewRTOwner = null; 

async function viewDetailKK(noKK) {
    const kk = dataKK.find(k => k.noKK === noKK);
    if (!kk) return;
    currentViewKK = noKK;

    if (currentUser === 'admin') {
        showLoading(true);
        let users = await firebaseGet('rtku_users') || {};
        currentViewRTOwner = null;
        for (const u of Object.keys(users)) {
            if (u === 'admin') continue;
            const kks = await firebaseGet(`${u}_rtku_kk`) || [];
            if (kks.find(k => k.noKK === noKK)) currentViewRTOwner = u;
        }
        showLoading(false);
    } else {
        currentViewRTOwner = activeRT;
    }

    document.getElementById('kk-list-view').style.display = 'none';
    document.getElementById('kk-detail-view').style.display = 'block';
    document.getElementById('detail-no-kk').innerText = kk.noKK;
    document.getElementById('detail-kepala').innerText = kk.kepalaKeluarga;
    document.getElementById('detail-alamat').innerText = [
        kk.alamat,
        kk.rtRw ? `RT/RW ${kk.rtRw}` : '',
        kk.kelurahan || '',
        kk.kecamatan || ''
    ].filter(Boolean).join(', ');
    document.getElementById('detail-ponsel').innerText = kk.ponsel || '-';

    let infoExtra = document.getElementById('detail-kk-extra');
    if (!infoExtra) {
        infoExtra = document.createElement('div');
        infoExtra.id = 'detail-kk-extra';
        infoExtra.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;margin-top:0.5rem;';
        document.getElementById('detail-ponsel')?.parentElement?.after(infoExtra);
    }
    const ttl = kk.tempatLahir && kk.tanggalLahir
        ? `${kk.tempatLahir}, ${new Date(kk.tanggalLahir).toLocaleDateString('id-ID')}`
        : (kk.tempatLahir || kk.tanggalLahir || '-');
    infoExtra.innerHTML = `
        <span style="font-size:0.85rem;color:var(--text-secondary);"><i class="fa-solid fa-cake-candles" style="color:var(--primary-color);"></i> <strong>TTL:</strong> ${ttl}</span>
        <span style="font-size:0.85rem;color:var(--text-secondary);"><i class="fa-solid fa-star-and-crescent" style="color:var(--primary-color);"></i> <strong>Agama:</strong> ${kk.agama || '-'}</span>
        <span style="font-size:0.85rem;color:var(--text-secondary);"><i class="fa-solid fa-briefcase" style="color:var(--primary-color);"></i> <strong>Pekerjaan:</strong> ${kk.pekerjaan || '-'}</span>
    `;
    renderAnggotaList(kk);
}

function renderAnggotaList(kk) {
    const tbody = document.getElementById('tbody-anggota');
    tbody.innerHTML = '';
    if (kk.anggota.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty-state"><i class="fa-solid fa-user-slash"></i>Belum ada anggota keluarga.</td></tr>`;
        return;
    }
    const canEdit = !(currentUser === 'admin' && activeRT === 'all');
    kk.anggota.forEach(ang => {
        const ttl = ang.tempatLahir && ang.tanggalLahir
            ? `${ang.tempatLahir}, ${new Date(ang.tanggalLahir).toLocaleDateString('id-ID')}`
            : (ang.tempatLahir || (ang.tanggalLahir ? new Date(ang.tanggalLahir).toLocaleDateString('id-ID') : '-'));
        tbody.innerHTML += `
        <tr>
            <td><span class="badge badge-primary">${ang.noReg || '-'}</span></td>
            <td style="font-family:monospace;font-weight:700;color:var(--primary-color);">${ang.nik}</td>
            <td>
                <div style="font-weight:600;">${ang.nama}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);">${ang.jk || ''}</div>
            </td>
            <td><span class="badge badge-gray">${ang.hubungan}</span></td>
            <td style="font-size:0.82rem;color:var(--text-secondary);">${ttl}</td>
            <td style="font-size:0.82rem;">${ang.pekerjaan || '-'}</td>
            <td><a href="tel:${ang.ponsel}" style="color:var(--primary-color);text-decoration:none;"><i class="fa-solid fa-phone" style="font-size:0.7rem;"></i> ${ang.ponsel || '-'}</a></td>
            <td>
                <div class="btn-action-group">
                    ${canEdit ? `
                    <button class="btn btn-outline" onclick="openEditMemberModal('${kk.noKK}','${ang.nik}')">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn" style="background:#f59e0b;color:#fff;" onclick="openPindahAnggota('${kk.noKK}','${ang.nik}')">
                        <i class="fa-solid fa-truck-moving"></i> Pindah
                    </button>
                    <button class="btn btn-danger" onclick="hapusAnggota('${kk.noKK}','${ang.nik}')">
                        <i class="fa-solid fa-trash"></i> Hapus
                    </button>` : '<span style="color:var(--text-secondary);font-size:0.8rem;">View only</span>'}
                </div>
            </td>
        </tr>`;
    });
}

async function hapusAnggota(noKK, nik) {
    const rtTarget = currentViewRTOwner || activeRT;
    showLoading(true);
    let kks = await firebaseGet(`${rtTarget}_rtku_kk`) || [];
    const kkIndex = kks.findIndex(k => k.noKK === noKK);
    if (kkIndex === -1) { showLoading(false); return; }
    const anggota = kks[kkIndex].anggota.find(a => a.nik === nik);
    if (!anggota) { showLoading(false); return; }
    const ok2 = await swalConfirm(`Apakah Anda yakin ingin menghapus data "${anggota.nama}" (NIK: ${nik})?`, 'Hapus Anggota?');
    if (!ok2) { showLoading(false); return; }

    await simpanKeArsip(rtTarget, 'anggota', {
        tglHapus: new Date().toLocaleDateString('id-ID'),
        noKKAsal: noKK,
        noReg: anggota.noReg || '-',
        nik: anggota.nik,
        nama: anggota.nama,
        hubungan: anggota.hubungan,
        ponsel: anggota.ponsel || '-',
        dataAsli: { ...anggota }
    });

    kks[kkIndex].anggota = kks[kkIndex].anggota.filter(a => a.nik !== nik);
    await firebasePut(`${rtTarget}_rtku_kk`, kks);
    await loadData();
    const updatedKK = dataKK.find(k => k.noKK === noKK);
    if (updatedKK) renderAnggotaList(updatedKK);
    updateDashboardStats();
    showLoading(false);
    await swalAlert(`Anggota "${anggota.nama}" berhasil dihapus dari daftar.`, 'success', 'Berhasil Dihapus');
}

async function simpanKeArsip(rtUser, jenis, data) {
    const users = await firebaseGet('rtku_users') || {};
    const rtNama = users[rtUser]?.name || rtUser;
    const key = `superadmin_arsip_${jenis}`;
    let arr = await firebaseGet(key) || [];
    arr.push({ ...data, _rtUser: rtUser, _rtNama: rtNama });
    await firebasePut(key, arr);
}

function backToKKList() {
    currentViewKK = null; currentViewRTOwner = null;
    document.getElementById('kk-detail-view').style.display = 'none';
    document.getElementById('kk-list-view').style.display = 'block';
    renderKKList();
}

function openAddMemberModal() {
    if (!currentViewKK) return;
    document.getElementById('input-member-nokk').value = currentViewKK;
    showModal('modal-add-member');
}

function openEditMemberModal(noKK, nik) {
    const kk = dataKK.find(k => k.noKK === noKK);
    if (!kk) return;
    const ang = kk.anggota.find(a => a.nik === nik);
    if (!ang) return;

    document.getElementById('edit-member-nokk').value            = noKK;
    document.getElementById('edit-member-nik-original').value    = nik;
    document.getElementById('edit-member-nik-display').value     = nik;
    document.getElementById('edit-member-nama').value            = ang.nama;
    document.getElementById('edit-member-tempat-lahir').value    = ang.tempatLahir || '';
    document.getElementById('edit-member-tgl-lahir').value       = ang.tanggalLahir || '';
    document.getElementById('edit-member-ponsel').value          = ang.ponsel || '';
    document.getElementById('edit-member-jk').value              = ang.jk || '';
    document.getElementById('edit-member-hubungan').value        = ang.hubungan || '';
    document.getElementById('edit-member-pekerjaan').value       = ang.pekerjaan || '';

    document.getElementById('modal-edit-member').classList.add('active');
}

document.getElementById('form-edit-member')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading(true);
    const noKK  = document.getElementById('edit-member-nokk').value;
    const nik   = document.getElementById('edit-member-nik-original').value;
    const rtTarget = currentViewRTOwner || (activeRT !== 'all' ? activeRT : null);
    if (!rtTarget) { showLoading(false); await swalAlert('RT tidak ditemukan.', 'error'); return; }

    let kks = await firebaseGet(`${rtTarget}_rtku_kk`) || [];
    const kkIndex  = kks.findIndex(k => k.noKK === noKK);
    if (kkIndex === -1) { showLoading(false); await swalAlert('Data KK tidak ditemukan.', 'error'); return; }
    const angIndex = kks[kkIndex].anggota.findIndex(a => a.nik === nik);
    if (angIndex === -1) { showLoading(false); await swalAlert('Data anggota tidak ditemukan.', 'error'); return; }

    kks[kkIndex].anggota[angIndex] = {
        ...kks[kkIndex].anggota[angIndex],
        nama        : document.getElementById('edit-member-nama').value,
        tempatLahir : document.getElementById('edit-member-tempat-lahir').value,
        tanggalLahir: document.getElementById('edit-member-tgl-lahir').value,
        ponsel      : document.getElementById('edit-member-ponsel').value,
        jk          : document.getElementById('edit-member-jk').value,
        hubungan    : document.getElementById('edit-member-hubungan').value,
        pekerjaan   : document.getElementById('edit-member-pekerjaan').value
    };

    await firebasePut(`${rtTarget}_rtku_kk`, kks);
    await loadData();
    const updatedKK = dataKK.find(k => k.noKK === noKK);
    if (updatedKK) renderAnggotaList(updatedKK);
    hideModal('modal-edit-member');
    showLoading(false);
    await swalAlert('Data anggota berhasil diperbarui!', 'success');
});

document.getElementById('form-add-member')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading(true);
    const noKK     = document.getElementById('input-member-nokk').value;
    const targetRT = getTargetRT(this) || currentViewRTOwner || activeRT;
    let kks = await firebaseGet(`${targetRT}_rtku_kk`) || [];
    const kkIndex = kks.findIndex(k => k.noKK === noKK);
    if (kkIndex === -1) { showLoading(false); await swalAlert('Data KK tidak ditemukan.', 'error'); return; }

    const nik = document.getElementById('input-nik').value;
    let isExist = false;
    let users = await firebaseGet('rtku_users') || {};
    for (const u of Object.keys(users)) {
        const allKk = await firebaseGet(`${u}_rtku_kk`) || [];
        allKk.forEach(k => { if (k.anggota.find(a => a.nik === nik)) isExist = true; });
    }
    if (isExist) { showLoading(false); await swalAlert('NIK sudah terdaftar!', 'error'); return; }

    const newAnggota = {
        noReg: generateNoReg(), nik,
        nama        : document.getElementById('input-nama').value,
        tempatLahir : document.getElementById('input-tempat-lahir').value,
        tanggalLahir: document.getElementById('input-tgl-lahir').value,
        ponsel      : document.getElementById('input-member-ponsel').value,
        jk          : document.getElementById('input-jk').value,
        hubungan    : document.getElementById('input-hubungan').value,
        pekerjaan   : document.getElementById('input-pekerjaan').value
    };
    kks[kkIndex].anggota.push(newAnggota);
    await firebasePut(`${targetRT}_rtku_kk`, kks);
    await loadData();
    const updatedKK = dataKK.find(k => k.noKK === noKK);
    if (updatedKK) renderAnggotaList(updatedKK);
    updateDashboardStats();
    hideModal('modal-add-member');
    showLoading(false);
    await swalAlert(`Anggota ditambahkan! No. Reg: ${newAnggota.noReg}`, 'success', 'Anggota Ditambahkan');
});

function openPindahKK(noKK) {
    const kk = dataKK.find(k => k.noKK === noKK);
    if (!kk) return;
    document.getElementById('input-pindah-nokk').value           = noKK;
    document.getElementById('input-pindah-nik').value            = '';
    document.getElementById('input-pindah-jenis').value          = 'kk';
    document.getElementById('input-pindah-nama-display').value   = `[KK] ${kk.kepalaKeluarga} — No. KK: ${noKK}`;
    document.getElementById('input-pindah-tgl').value            = new Date().toISOString().split('T')[0];
    document.getElementById('modal-pindah').classList.add('active');
}

function openPindahAnggota(noKK, nik) {
    const kk = dataKK.find(k => k.noKK === noKK);
    if (!kk) return;
    const ang = kk.anggota.find(a => a.nik === nik);
    if (!ang) return;
    document.getElementById('input-pindah-nokk').value           = noKK;
    document.getElementById('input-pindah-nik').value            = nik;
    document.getElementById('input-pindah-jenis').value          = 'anggota';
    document.getElementById('input-pindah-nama-display').value   = `[Anggota] ${ang.nama} — NIK: ${nik}`;
    document.getElementById('input-pindah-tgl').value            = new Date().toISOString().split('T')[0];
    document.getElementById('modal-pindah').classList.add('active');
}

document.getElementById('form-pindah')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading(true);
    const noKK       = document.getElementById('input-pindah-nokk').value;
    const nik        = document.getElementById('input-pindah-nik').value;
    const jenis      = document.getElementById('input-pindah-jenis').value;
    const tgl        = document.getElementById('input-pindah-tgl').value;
    const alamatBaru = document.getElementById('input-pindah-alamat-baru').value;
    const alasan     = document.getElementById('input-pindah-alasan').value;
    const keterangan = document.getElementById('input-pindah-keterangan').value;

    const rtTarget = currentViewRTOwner || (activeRT !== 'all' ? activeRT : null);
    if (!rtTarget) { showLoading(false); await swalAlert('Tidak bisa menentukan RT pemilik data.', 'error'); return; }

    let kks = await firebaseGet(`${rtTarget}_rtku_kk`) || [];
    const kkIndex = kks.findIndex(k => k.noKK === noKK);
    if (kkIndex === -1) { showLoading(false); await swalAlert('Data KK tidak ditemukan.', 'error'); return; }
    const kk = kks[kkIndex];

    let recordPindah = null;

    if (jenis === 'kk') {
        recordPindah = {
            tgl, jenis: 'Seluruh KK', nama: kk.kepalaKeluarga,
            noKK, nik: '-', alamatBaru, alasan, keterangan,
            dataAsli: { ...kk }
        };
        kks.splice(kkIndex, 1);
    } else {
        const angIndex = kk.anggota.findIndex(a => a.nik === nik);
        if (angIndex === -1) { showLoading(false); await swalAlert('Data anggota tidak ditemukan.', 'error'); return; }
        const ang = kk.anggota[angIndex];
        recordPindah = {
            tgl, jenis: 'Anggota', nama: ang.nama,
            noKK, nik, alamatBaru, alasan, keterangan,
            dataAsli: { ...ang }
        };
        kks[kkIndex].anggota.splice(angIndex, 1);
    }

    await firebasePut(`${rtTarget}_rtku_kk`, kks);

    const pindahKey = `${rtTarget}_rtku_pindah`;
    let pindahArr = await firebaseGet(pindahKey) || [];
    pindahArr.push(recordPindah);
    await firebasePut(pindahKey, pindahArr);

    await loadData(); updateDashboardStats();
    hideModal('modal-pindah');
    backToKKList();
    showLoading(false);
    await swalAlert(`Data "${recordPindah.nama}" berhasil dicatat sebagai Pindah Domisili.`, 'success', 'Pindah Dicatat');
});

function renderPindah() {
    const tbody = document.getElementById('tbody-pindah');
    if (!tbody) return;
    tbody.innerHTML = '';

    let pindahArr = dataPindah;
    const isSuperAdmin = (currentUser === 'admin');

    const theadRow = document.getElementById('thead-pindah-row');
    if (theadRow) {
        theadRow.innerHTML = isSuperAdmin
            ? `<th>Tgl Pindah</th><th>Nama RT</th><th>Jenis</th><th>Nama / KK</th><th>No. KK</th><th>NIK</th><th>Alamat Baru</th><th>Alasan</th>`
            : `<th>Tgl Pindah</th><th>Jenis</th><th>Nama / KK</th><th>No. KK</th><th>NIK</th><th>Alamat Baru</th><th>Alasan</th>`;
    }

    if (pindahArr.length === 0) {
        const colSpan = isSuperAdmin ? 8 : 7;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center" style="color:var(--text-secondary);">Belum ada data pindah domisili.</td></tr>`;
        return;
    }

    pindahArr.forEach(p => {
        const rtCol = isSuperAdmin
            ? `<td><span class="badge badge-success" style="font-size:0.75rem;">${p._rtNama || '-'}</span></td>`
            : '';
        tbody.innerHTML += `
        <tr>
            <td>${p.tgl}</td>
            ${rtCol}
            <td><span class="badge ${p.jenis === 'Seluruh KK' ? 'badge-warning' : 'badge-primary'}">${p.jenis}</span></td>
            <td style="font-weight:500;">${p.nama}</td>
            <td style="font-family:monospace;">${p.noKK}</td>
            <td style="font-family:monospace;">${p.nik}</td>
            <td>${p.alamatBaru}</td>
            <td>${p.alasan}${p.keterangan ? ' — ' + p.keterangan : ''}</td>
        </tr>`;
    });
}

function switchSuratTab(tab) {
    const isMasuk = tab === 'masuk';
    document.getElementById('view-surat-masuk').style.display  = isMasuk ? 'block' : 'none';
    document.getElementById('view-surat-keluar').style.display = isMasuk ? 'none'  : 'block';
    document.getElementById('btn-tab-masuk').className  = 'btn ' + (isMasuk ? 'btn-primary' : 'btn-outline');
    document.getElementById('btn-tab-keluar').className = 'btn ' + (isMasuk ? 'btn-outline'  : 'btn-primary');
}

function renderSuratMasuk() {
    const tbody = document.getElementById('tbody-surat-masuk');
    if (!tbody) return;
    tbody.innerHTML = dataSuratMasuk.length === 0
        ? `<tr><td colspan="6" class="text-center">Belum ada surat masuk.</td></tr>`
        : dataSuratMasuk.map(s => `<tr>
            <td><span class="badge badge-primary" style="font-family:monospace;">${s.noReg}</span></td>
            <td>${s.no}</td><td>${s.tgl}</td><td>${s.pengirim}</td><td>${s.perihal}</td>
            <td><a href="tel:${s.ponsel}" style="color:var(--primary-color);">${s.ponsel}</a></td>
          </tr>`).join('');
}

function renderSuratKeluar() {
    const tbody = document.getElementById('tbody-surat-keluar');
    if (!tbody) return;
    tbody.innerHTML = dataSuratKeluar.length === 0
        ? `<tr><td colspan="6" class="text-center">Belum ada surat keluar.</td></tr>`
        : dataSuratKeluar.map(s => `<tr>
            <td><span class="badge badge-primary" style="font-family:monospace;">${s.noReg}</span></td>
            <td>${s.no}</td><td>${s.tgl}</td><td>${s.tujuan}</td><td>${s.perihal}</td>
            <td><a href="tel:${s.ponsel}" style="color:var(--primary-color);">${s.ponsel}</a></td>
          </tr>`).join('');
}

document.getElementById('form-add-surat-masuk')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const targetRT = getTargetRT(this);
    if (!targetRT) { await swalAlert('Pilih RT tujuan!', 'info'); return; }
    const noReg = generateNoReg();
    await appendDataToStorage(targetRT, 'sm', {
        noReg, no: document.getElementById('input-sm-no').value,
        tgl: document.getElementById('input-sm-tgl').value,
        pengirim: document.getElementById('input-sm-pengirim').value,
        ponsel: document.getElementById('input-sm-ponsel').value,
        perihal: document.getElementById('input-sm-perihal').value
    });
    renderSuratMasuk(); hideModal('modal-add-surat-masuk');
    await swalAlert(`Surat Masuk disimpan! No. Reg: ${noReg}`, 'success', 'Tersimpan');
});

document.getElementById('form-add-surat-keluar')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const targetRT = getTargetRT(this);
    if (!targetRT) { await swalAlert('Pilih RT tujuan!', 'info'); return; }
    const noReg = generateNoReg();
    await appendDataToStorage(targetRT, 'sk', {
        noReg, no: document.getElementById('input-sk-no').value,
        tgl: document.getElementById('input-sk-tgl').value,
        tujuan: document.getElementById('input-sk-tujuan').value,
        ponsel: document.getElementById('input-sk-ponsel').value,
        perihal: document.getElementById('input-sk-perihal').value
    });
    renderSuratKeluar(); hideModal('modal-add-surat-keluar'); switchSuratTab('keluar');
    await swalAlert(`Surat Keluar disimpan! No. Reg: ${noReg}`, 'success', 'Tersimpan');
});

function renderAgenda() {
    const list = document.getElementById('list-agenda');
    if (!list) return;
    if (dataAgenda.length === 0) { list.innerHTML = `<div class="placeholder-block">Belum ada agenda.</div>`; return; }
    list.innerHTML = dataAgenda.map(a => `
        <div style="border-left:4px solid var(--primary-color);padding:1rem;background:#f9fafb;border-radius:var(--radius-md);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <h3 style="margin-bottom:0.5rem;">${a.nama}</h3>
                <span class="badge badge-primary" style="font-family:monospace;font-size:0.7rem;">${a.noReg}</span>
            </div>
            <div style="display:flex;gap:1.5rem;color:var(--text-secondary);font-size:0.875rem;flex-wrap:wrap;">
                <span><i class="fa-regular fa-calendar"></i> ${a.tgl}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${a.tempat}</span>
                <span><i class="fa-solid fa-phone"></i> <a href="tel:${a.ponsel}" style="color:var(--primary-color);">${a.ponsel}</a></span>
            </div>
        </div>`).join('');
}

document.getElementById('form-add-agenda')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const targetRT = getTargetRT(this);
    if (!targetRT) { await swalAlert('Pilih RT tujuan!', 'info'); return; }
    const noReg = generateNoReg();
    await appendDataToStorage(targetRT, 'agenda', {
        noReg, nama: document.getElementById('input-agenda-nama').value,
        tgl: document.getElementById('input-agenda-tgl').value,
        tempat: document.getElementById('input-agenda-tempat').value,
        ponsel: document.getElementById('input-agenda-ponsel').value
    });
    renderAgenda(); hideModal('modal-add-agenda');
    await swalAlert(`Agenda disimpan! No. Reg: ${noReg}`, 'success', 'Tersimpan');
});

function renderLapor() {
    const tbody = document.getElementById('tbody-lapor');
    if (!tbody) return;
    tbody.innerHTML = dataLapor.length === 0
        ? `<tr><td colspan="6" class="text-center">Belum ada laporan.</td></tr>`
        : dataLapor.map(l => `<tr>
            <td><span class="badge badge-primary" style="font-family:monospace;">${l.noReg}</span></td>
            <td>${l.tgl}</td><td style="font-weight:500;">${l.nama}</td>
            <td><a href="tel:${l.ponsel}" style="color:var(--primary-color);">${l.ponsel}</a></td>
            <td><span class="badge badge-warning">${l.kategori}</span></td>
            <td>${l.isi}</td>
          </tr>`).join('');
}

document.getElementById('form-add-lapor')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const targetRT = getTargetRT(this);
    if (!targetRT) { await swalAlert('Pilih RT tujuan!', 'info'); return; }
    const noReg = generateNoReg();
    await appendDataToStorage(targetRT, 'lapor', {
        noReg, tgl: new Date().toLocaleDateString('id-ID'),
        nama: document.getElementById('input-lapor-nama').value,
        ponsel: document.getElementById('input-lapor-ponsel').value,
        kategori: document.getElementById('input-lapor-kategori').value,
        isi: document.getElementById('input-lapor-isi').value
    });
    renderLapor(); hideModal('modal-add-lapor');
    await swalAlert(`Laporan dikirim! No. Reg: ${noReg}`, 'success', 'Laporan Terkirim');
});

function renderDokumentasi() {
    const grid = document.getElementById('grid-dokumentasi');
    if (!grid) return;
    if (dataDokumentasi.length === 0) { grid.innerHTML = `<div class="placeholder-block" style="grid-column:1/-1;">Galeri masih kosong.</div>`; return; }
    grid.innerHTML = dataDokumentasi.map(d => `
        <div class="card" style="margin-bottom:0;padding:0;overflow:hidden;">
            <img src="${d.url}" style="width:100%;height:180px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/300x200?text=Not+Found'">
            <div style="padding:0.75rem;">
                <h3 style="font-size:0.95rem;margin-bottom:0.25rem;">${d.kegiatan}</h3>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="badge badge-primary" style="font-family:monospace;font-size:0.7rem;">${d.noReg}</span>
                    <a href="tel:${d.ponsel}" style="font-size:0.8rem;color:var(--primary-color);"><i class="fa-solid fa-phone"></i> ${d.ponsel}</a>
                </div>
            </div>
        </div>`).join('');
}

document.getElementById('form-add-dokumentasi')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const targetRT = getTargetRT(this);
    if (!targetRT) { await swalAlert('Pilih RT tujuan!', 'info'); return; }
    const noReg = generateNoReg();
    await appendDataToStorage(targetRT, 'dok', {
        noReg, kegiatan: document.getElementById('input-dok-kegiatan').value,
        url: document.getElementById('input-dok-url').value,
        ponsel: document.getElementById('input-dok-ponsel').value
    });
    renderDokumentasi(); hideModal('modal-add-dokumentasi');
    await swalAlert(`Dokumentasi diupload! No. Reg: ${noReg}`, 'success', 'Tersimpan');
});

async function renderUserManagement() {
    const tbody = document.getElementById('tbody-users');
    if (!tbody) return;
    tbody.innerHTML = '';
    let users = await firebaseGet('rtku_users') || {};
    let count = 0;
    Object.keys(users).forEach(u => {
        if (u === 'admin') return;
        count++;
        const isVerified = users[u].verified !== false;
        const badge = isVerified ? `<span class="badge badge-primary" style="margin-top:4px;display:inline-block;">Aktif</span>` : `<span class="badge" style="background:#f59e0b;color:#fff;margin-top:4px;display:inline-block;">Menunggu Verifikasi</span>`;
        tbody.innerHTML += `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary-color),var(--secondary-color));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.75rem;flex-shrink:0;">${u.substring(0,2).toUpperCase()}</div>
                    <span style="font-family:monospace;font-weight:700;color:var(--primary-color);">${u}</span>
                </div>
            </td>
            <td>
                <div style="font-weight:600;">${users[u].name}</div>
                ${badge}
            </td>
            <td>
                <div class="btn-action-group">
                    ${!isVerified ? `
                    <button class="btn btn-primary" onclick="verifyUser('${u}')">
                        <i class="fa-solid fa-check"></i> Verifikasi
                    </button>` : ''}
                    <button class="btn btn-secondary" onclick="openChangePassword('${u}')">
                        <i class="fa-solid fa-key"></i> Ganti Password
                    </button>
                    <button class="btn btn-outline" onclick="removeDevice('${u}')">
                        <i class="fa-solid fa-mobile-screen-button"></i> Hapus Perangkat
                    </button>
                    <button class="btn btn-danger" onclick="deleteUser('${u}')">
                        <i class="fa-solid fa-trash"></i> Hapus User
                    </button>
                </div>
            </td>
        </tr>`;
    });
    if (count === 0) tbody.innerHTML = `<tr><td colspan="3" class="table-empty-state"><i class="fa-solid fa-users-slash"></i>Belum ada user RT terdaftar.</td></tr>`;
}

async function verifyUser(username) {
    const ok3 = await swalConfirm(`Verifikasi akun "${username}" agar dapat menggunakan aplikasi?`, 'Verifikasi User', 'question');
    if (!ok3) return;
    showLoading(true);
    let users = await firebaseGet('rtku_users') || {};
    if (users[username]) {
        users[username].verified = true;
        await firebasePut('rtku_users', users);
        await renderUserManagement();
        showLoading(false);
        await swalAlert(`User ${username} berhasil diverifikasi!`, 'success');
    } else {
        showLoading(false);
    }
}

async function deleteUser(username) {
    const ok4 = await swalConfirm(`Hapus user '${username}' beserta SELURUH datanya? Tindakan ini tidak dapat dibatalkan.`, 'Hapus User?');
    if (!ok4) return;
    showLoading(true);
    let users = await firebaseGet('rtku_users') || {};
    delete users[username];
    await firebasePut('rtku_users', users);
    
    const keys = ['kk','sm','sk','agenda','lapor','dok','pindah'];
    for (const k of keys) {
        await firebasePut(`${username}_rtku_${k}`, null); // delete node
    }
    await renderUserManagement(); await populateAdminSelector();
    showLoading(false);
    await swalAlert(`User ${username} berhasil dihapus.`, 'success');
}

function openChangePassword(username) {
    document.getElementById('input-ganti-username').value = username;
    document.getElementById('lbl-ganti-username').innerText = username;
    document.getElementById('modal-ganti-password').classList.add('active');
}

document.getElementById('form-ganti-password')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading(true);
    const username = document.getElementById('input-ganti-username').value;
    const newPwd   = document.getElementById('input-ganti-pwd').value;
    let users = await firebaseGet('rtku_users') || {};
    if (users[username]) {
        users[username].password = newPwd;
        await firebasePut('rtku_users', users);
        showLoading(false);
        await swalAlert(`Password ${username} berhasil diubah!`, 'success');
        hideModal('modal-ganti-password');
    } else {
        showLoading(false);
    }
});

async function removeDevice(username) {
    const ok5 = await swalConfirm(`Paksa logout perangkat untuk user '${username}'?`, 'Paksa Logout', 'question');
    if (ok5) {
        showLoading(true);
        let users = await firebaseGet('rtku_users') || {};
        if (users[username]) {
            users[username].deviceId = null;
            await firebasePut('rtku_users', users);
        }
        showLoading(false);
        await swalAlert(`Perangkat untuk user ${username} telah dihapus. Mereka harus login ulang.`, 'info');
    }
}

// ======================== ARSIP DATA (superadmin only) ========================
function switchArsipTab(tab) {
    const isKK = tab === 'kk';
    document.getElementById('view-arsip-kk').style.display      = isKK ? 'block' : 'none';
    document.getElementById('view-arsip-anggota').style.display = isKK ? 'none'  : 'block';
    document.getElementById('btn-arsip-tab-kk').className      = 'btn ' + (isKK ? 'btn-primary' : 'btn-outline');
    document.getElementById('btn-arsip-tab-anggota').className  = 'btn ' + (isKK ? 'btn-outline'  : 'btn-primary');
}

async function renderArsip() {
    if (currentUser !== 'admin') return; // hanya superadmin
    switchArsipTab('kk'); // default tab KK
    await renderArsipKK();
    await renderArsipAnggota();
}

async function renderArsipKK() {
    const tbody = document.getElementById('tbody-arsip-kk');
    if (!tbody) return;
    const data = await firebaseGet('superadmin_arsip_kk') || [];

    if (data.length === 0) {
        tbody.innerHTML = `
        <tr><td colspan="8" class="table-empty-state">
            <i class="fa-solid fa-box-open"></i>Belum ada KK yang diarsipkan.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    // Tampilkan terbaru di atas
    [...data].reverse().forEach((item, index) => {
        tbody.innerHTML += `
        <tr>
            <td>
                <span style="background:#fef3c7;color:#92400e;padding:0.2rem 0.6rem;border-radius:var(--radius-full);font-size:0.75rem;font-weight:600;">
                    <i class="fa-solid fa-calendar-xmark"></i> ${item.tglHapus}
                </span>
            </td>
            <td>
                <span class="badge badge-success">${item._rtNama || '-'}</span>
                <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:0.2rem;">${item._rtUser || ''}</div>
            </td>
            <td><span class="badge badge-primary">${item.noReg}</span></td>
            <td style="font-family:monospace;font-weight:700;color:var(--primary-color);">${item.noKK}</td>
            <td style="font-weight:600;">${item.kepalaKeluarga}</td>
            <td>
                <a href="tel:${item.ponsel}" style="color:var(--primary-color);text-decoration:none;">
                    <i class="fa-solid fa-phone" style="font-size:0.7rem;"></i> ${item.ponsel}
                </a>
            </td>
            <td style="color:var(--text-secondary);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${item.alamat}">${item.alamat}</td>
            <td>
                <span class="badge badge-gray">
                    <i class="fa-solid fa-person"></i> ${item.jumlahAnggota} anggota
                </span>
            </td>
            <td>
                <button class="btn btn-danger" onclick="hapusPermanenArsipKK(${data.length - 1 - index})" style="padding:0.3rem 0.6rem;font-size:0.75rem;">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
            </td>
        </tr>`;
    });
}

async function renderArsipAnggota() {
    const tbody = document.getElementById('tbody-arsip-anggota');
    if (!tbody) return;
    const data = await firebaseGet('superadmin_arsip_anggota') || [];

    if (data.length === 0) {
        tbody.innerHTML = `
        <tr><td colspan="8" class="table-empty-state">
            <i class="fa-solid fa-box-open"></i>Belum ada anggota yang diarsipkan.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    [...data].reverse().forEach((item, index) => {
        tbody.innerHTML += `
        <tr>
            <td>
                <span style="background:#fef3c7;color:#92400e;padding:0.2rem 0.6rem;border-radius:var(--radius-full);font-size:0.75rem;font-weight:600;">
                    <i class="fa-solid fa-calendar-xmark"></i> ${item.tglHapus}
                </span>
            </td>
            <td>
                <span class="badge badge-success">${item._rtNama || '-'}</span>
                <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:0.2rem;">${item._rtUser || ''}</div>
            </td>
            <td style="font-family:monospace;font-weight:700;color:var(--primary-color);">${item.noKKAsal}</td>
            <td><span class="badge badge-primary">${item.noReg}</span></td>
            <td style="font-family:monospace;font-weight:600;">${item.nik}</td>
            <td style="font-weight:600;">${item.nama}</td>
            <td><span class="badge badge-gray">${item.hubungan}</span></td>
            <td>
                <a href="tel:${item.ponsel}" style="color:var(--primary-color);text-decoration:none;">
                    <i class="fa-solid fa-phone" style="font-size:0.7rem;"></i> ${item.ponsel}
                </a>
            </td>
            <td>
                <button class="btn btn-danger" onclick="hapusPermanenArsipAnggota(${data.length - 1 - index})" style="padding:0.3rem 0.6rem;font-size:0.75rem;">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
            </td>
        </tr>`;
    });
}

async function hapusPermanenArsipKK(index) {
    const ok6 = await swalConfirm('Hapus arsip KK ini secara PERMANEN? Data yang dihapus tidak dapat dikembalikan.', 'Hapus Permanen!');
    if (!ok6) return;
    showLoading(true);
    let data = await firebaseGet('superadmin_arsip_kk') || [];
    data.splice(index, 1);
    await firebasePut('superadmin_arsip_kk', data);
    await renderArsipKK();
    showLoading(false);
    await swalAlert('Arsip KK berhasil dihapus permanen.', 'success');
}

async function hapusPermanenArsipAnggota(index) {
    const ok7 = await swalConfirm('Hapus arsip anggota ini secara PERMANEN? Data yang dihapus tidak dapat dikembalikan.', 'Hapus Permanen!');
    if (!ok7) return;
    showLoading(true);
    let data = await firebaseGet('superadmin_arsip_anggota') || [];
    data.splice(index, 1);
    await firebasePut('superadmin_arsip_anggota', data);
    await renderArsipAnggota();
    showLoading(false);
    await swalAlert('Arsip Anggota berhasil dihapus permanen.', 'success');
}

// Auto-login jika session_user ada
(async function checkSession() {
    const saved = localStorage.getItem('session_user');
    const savedDeviceId = localStorage.getItem('session_device_id');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            
            if (parsed.username !== 'admin') {
                const users = await firebaseGet('rtku_users') || {};
                const userData = users[parsed.username];
                if (!userData || userData.deviceId !== savedDeviceId) {
                    localStorage.removeItem('session_user');
                    localStorage.removeItem('session_device_id');
                    await swalAlert('Sesi berakhir. Akun ini telah masuk dari perangkat lain atau akses perangkat telah dicabut oleh Super Admin.', 'warning', 'Sesi Berakhir');
                    return;
                }
            }
            
            currentUser = parsed.username;
            currentName = parsed.name;
            activeRT = parsed.activeRT;
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            await initApp();
        } catch(e) {
            console.error(e);
        }
    }
})();
