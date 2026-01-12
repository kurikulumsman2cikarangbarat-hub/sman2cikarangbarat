// ==========================================
// KONFIGURASI DAN VARIABEL GLOBAL
// ==========================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyf56H0Kgff5zjVAFoaJth2fWv9fo9hth16Jsn-NLtNBofSwNJMhfuwLuLzRzQWZapI1g/exec"; 

let currentCorrectAnswer = "";
let timerInt, isTestActive = false, cheatCount = 0;
let isDataChecked = false;
let totalAttempts = 0; 

// ==========================================
// DATA LOKAL & LOGIKA DROPDOWN
// ==========================================
const dataKelas = {
    "X": ["X - A", "X - B", "X - C", "X - D", "X - E", "X - F"],
    "XI": ["XI - A", "XI - B", "XI - C", "XI - D", "XI - E", "XI - F", "XI - G"],
    "XII": ["XII - A", "XII - B", "XII - C", "XII - D", "XII - E", "XII - F", "XII - G"] 
};

function updateKelasOptions() {
    const jenjang = document.getElementById("sel-jenjang").value;
    const selKelas = document.getElementById("sel-kelas");
    const selNama = document.getElementById("sel-nama");
    
    selKelas.innerHTML = '<option value="" disabled selected>-- Pilih Kelas --</option>';
    selKelas.disabled = false;
    selNama.innerHTML = '<option value="" disabled selected>-- Pilih Nama Siswa --</option>';
    selNama.disabled = true;

    if (dataKelas[jenjang]) {
        dataKelas[jenjang].forEach(kelas => {
            let opt = document.createElement("option");
            opt.value = kelas;
            opt.textContent = kelas;
            selKelas.appendChild(opt);
        });
    }
}

function getStudentNames() {
    const kelasDipilih = document.getElementById("sel-kelas").value;
    const selNama = document.getElementById("sel-nama");
    const btnStart = document.getElementById("btn-start");

    if(!kelasDipilih) return;

    selNama.innerHTML = '<option>🔄 Mengambil data...</option>';
    selNama.disabled = true;
    btnStart.disabled = true;

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "getNames", kelas: kelasDipilih })
    })
    .then(res => res.json())
    .then(data => {
        selNama.innerHTML = '<option value="" disabled selected>-- Pilih Nama Siswa --</option>';
        if (data.result === "success" && data.names.length > 0) {
            selNama.disabled = false;
            data.names.forEach(namaSiswa => {
                let opt = document.createElement("option");
                opt.value = namaSiswa;
                opt.textContent = namaSiswa;
                selNama.appendChild(opt);
            });
            btnStart.disabled = false;
        } else {
            selNama.innerHTML = '<option>❌ Data tidak ditemukan</option>';
        }
    })
    .catch(err => {
        selNama.innerHTML = '<option>❌ Gagal koneksi</option>';
        btnStart.disabled = false;
    });
}

function toNamePage() {
    document.getElementById('page-quote').style.display = 'none';
    document.getElementById('page-name').style.display = 'block';
}

// ==========================================
// LOGIKA UTAMA
// ==========================================
function checkHistoryAndStart() {
    const name = document.getElementById('sel-nama').value;
    const btn = document.getElementById('btn-start');
    const alertBox = document.getElementById('history-alert');
    const errName = document.getElementById('err-name');
    
    if(!name || name === "" || name.includes("Pilih")) { 
        errName.style.display = 'block'; return; 
    }
    errName.style.display = 'none';

    if (isDataChecked) { fetchSoal(); return; }

    btn.disabled = true; btn.innerHTML = "Mengecek Database...";
    alertBox.style.display = 'none';

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', body: JSON.stringify({ action: "check", nama: name })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        if (data.result === "success") {
            const count = data.count;
            let msg = (count === 0) 
                ? `Halo <strong>${name}</strong>, ini keterlambatan pertamamu.` 
                : `⚠️ <strong>PERHATIAN</strong><br>Kamu sudah terlambat <strong>${count}x</strong> sebelumnya.`;
            let color = (count === 0) ? "#e8f5e9" : "#fff3e0";
            
            alertBox.style.display = 'block'; alertBox.style.background = color; alertBox.innerHTML = msg;
            isDataChecked = true; btn.innerText = "LANJUT KERJAKAN SOAL";
        } else { 
            fetchSoal(); 
        }
    })
    .catch(err => { 
        isDataChecked = true;
        fetchSoal(); 
    });
}

function fetchSoal() {
    document.getElementById('page-name').style.display = 'none';
    document.getElementById('page-test').style.display = 'none';
    document.getElementById('page-loading').style.display = 'block';

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', body: JSON.stringify({ action: "getSoal" }) 
    })
    .then(res => res.json())
    .then(data => {
        if (data.result === "success") {
            setupQuestion(data.data);
        } else {
            alert("GAGAL MENGAMBIL SOAL.\nPastikan Sheet 'BankSoal' ada isinya.");
            location.reload();
        }
    })
    .catch(err => {
        alert("ERROR JARINGAN.\nPeriksa internet.");
        location.reload();
    });
}

function setupQuestion(soalData) {
    document.getElementById('page-loading').style.display = 'none';
    document.getElementById('page-test').style.display = 'block';

    currentCorrectAnswer = soalData.correct.toString().trim();
    
    let options = [soalData.correct, ...soalData.wrongs];
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    let htmlOptions = "";
    options.forEach(opt => {
        htmlOptions += `<button class="option-btn" onclick="checkAnswer('${opt}')">${opt}</button>`;
    });

    const area = document.getElementById('question-area');
    area.innerHTML = `
        <div class="problem-card">
            <div class="problem-text">${soalData.question}</div>
        </div>
        ${htmlOptions}
    `;

    if (!isTestActive) {
         startTimer(300); 
         isTestActive = true;
    }
}

function startTimer(s) {
    clearInterval(timerInt);
    const disp = document.getElementById('timer');
    timerInt = setInterval(() => { 
        s--; 
        let min = Math.floor(s/60).toString().padStart(2,'0'); 
        let sec = (s%60).toString().padStart(2,'0'); 
        disp.innerText = `${min}:${sec}`; 
        
        if(s<=0) { 
            clearInterval(timerInt); 
            alert("Waktu Habis!"); 
            location.reload(); 
        } 
    }, 1000);
}

// ==========================================
// CEK JAWABAN & SUKSES
// ==========================================
function checkAnswer(selectedAnswer) {
    totalAttempts++;
    console.log("Jawaban Dipilih: " + selectedAnswer);
    
    if (selectedAnswer.toString().trim() === currentCorrectAnswer.toString().trim()) {
        success(); // PANGGIL FUNGSI SUKSES
    } else {
        fetchSoal(); // JIKA SALAH, GANTI SOAL
    }
}

function success() {
    isTestActive = false; clearInterval(timerInt);
    const nm = document.getElementById('sel-nama').value;
    const tm = new Date().toLocaleString('id-ID', { hour12: false });
    const attemptText = `${totalAttempts} Percobaan`;

    // 1. Sembunyikan Container Utama
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) mainContainer.style.display = 'none';
    
    // 2. Tampilkan Halaman Sukses Fullscreen
    const pageSuccess = document.getElementById('page-success');
    pageSuccess.style.display = 'flex'; // Pakai flex agar centered
    
    document.getElementById('final-name').innerText = nm;
    document.getElementById('final-time').innerText = tm;
    document.getElementById('attempt-info').innerText = attemptText;
    
    // 3. Generate QR Code
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), { text: `TIKET VALID\n${nm}\n${tm}\n${attemptText}`, width: 250, height: 250 });
    
    // 4. Efek Confetti (Perayaan)
    if (typeof confetti === "function") {
        var duration = 3 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };
        var randomInRange = function(min, max) { return Math.random() * (max - min) + min; };

        var interval = setInterval(function() {
            var timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            var particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }

    // 5. Kirim Data ke Server
    document.getElementById('sending-overlay').style.display = 'flex';

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "submit", nama: nm, status: attemptText, info: `Selesai. Curang: ${cheatCount}x` })
    })
    .then(() => {
        setTimeout(() => {
            document.getElementById('sending-overlay').style.display = 'none';
            document.getElementById('sent-status').innerText = "DATA TERSIMPAN DI SERVER ✅";
            document.getElementById('sent-status').style.color = "#27ae60";
        }, 1500);
    })
    .catch(err => {
        document.getElementById('sending-overlay').style.display = 'none';
        document.getElementById('sent-status').innerText = "DATA OFFLINE (TUNJUKKAN HP KE GURU)";
    });
}

// ==========================================
// FUNGSI BARU: MENUJU YOUTUBE
// ==========================================
function goToYoutube() {
    window.location.href = "https://www.youtube.com/watch?v=pPI4LOBRT04";
}

// ==========================================
// FITUR ANTI CURANG
// ==========================================
document.addEventListener('contextmenu', event => event.preventDefault());

document.onkeydown = function(e) {
    if (e.keyCode == 123) return false;
    if (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'C'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) return false;
    if (e.ctrlKey && (e.keyCode == 'U'.charCodeAt(0) || e.keyCode == 'P'.charCodeAt(0) || e.keyCode == 'S'.charCodeAt(0))) return false;
};

document.addEventListener("cut", (e) => e.preventDefault());
document.addEventListener("copy", (e) => e.preventDefault());
document.addEventListener("paste", (e) => e.preventDefault());

document.addEventListener("visibilitychange", () => {
    if(document.hidden && isTestActive) {
        cheatCount++; 
        fetchSoal(); 
    } 
});
