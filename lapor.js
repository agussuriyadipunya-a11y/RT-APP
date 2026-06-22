const FIREBASE_DB_URL = "https://rt-ku-2d49f-default-rtdb.asia-southeast1.firebasedatabase.app";

function showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

function showAlert(message, type) {
    const alertBox = document.getElementById('alert-box');
    alertBox.textContent = message;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 10000);
}

function generateNoRegLapor() {
    return 'LPR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
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

document.getElementById('form-portal-lapor').addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading(true);
    document.getElementById('alert-box').style.display = 'none';

    const namaInput = document.getElementById('input-nama').value.trim();
    const ponselInput = document.getElementById('input-ponsel').value.trim();
    const noRegInput = document.getElementById('input-noreg').value.trim();
    const kategori = document.getElementById('input-kategori').value;
    const isi = document.getElementById('input-isi').value;

    try {
        // 1. Ambil semua data user (RT)
        const users = await firebaseGet('rtku_users') || {};
        const rtList = Object.keys(users).filter(u => u !== 'admin' && users[u].verified !== false);

        let targetRT = null;

        // 2. Cari di setiap RT apakah ada KK yang sesuai
        for (const rtUsername of rtList) {
            const dataKK = await firebaseGet(`${rtUsername}_rtku_kk`) || [];
            const isMatch = dataKK.some(kk => 
                kk.kepalaKeluarga.toLowerCase() === namaInput.toLowerCase() &&
                kk.ponsel === ponselInput &&
                kk.noReg === noRegInput
            );

            if (isMatch) {
                targetRT = rtUsername;
                break;
            }
        }

        // 3. Jika tidak ketemu
        if (!targetRT) {
            showLoading(false);
            showAlert('Data Warga tidak ditemukan! Pastikan Nama, Nomor Ponsel, dan No. Reg sesuai dengan data di RT Anda.', 'error');
            return;
        }

        // 4. Jika ketemu, simpan laporannya ke database Lapor milik RT tersebut
        const laporPath = `${targetRT}_rtku_lapor`;
        let dataLapor = await firebaseGet(laporPath) || [];
        
        const noRegLaporan = generateNoRegLapor();
        const laporanBaru = {
            noReg: noRegLaporan,
            tgl: new Date().toLocaleDateString('id-ID'),
            nama: namaInput,
            ponsel: ponselInput,
            kategori: kategori,
            isi: isi
        };

        dataLapor.push(laporanBaru);
        await firebasePut(laporPath, dataLapor);

        showLoading(false);
        showAlert(`Laporan Anda (No: ${noRegLaporan}) telah berhasil dikirim ke Pengurus RT Anda. Terima kasih!`, 'success');
        
        // Reset form
        document.getElementById('form-portal-lapor').reset();

    } catch (error) {
        console.error(error);
        showLoading(false);
        showAlert('Terjadi kesalahan koneksi server. Silakan coba lagi nanti.', 'error');
    }
});
