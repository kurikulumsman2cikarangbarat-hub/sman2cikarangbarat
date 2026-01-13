const CLOUDFLARE_WORKER_URL = "https://disiplin-siswa.kurikulum-sman2cikarangbarat.workers.dev/";
let currentQuestion = null, totalAttempts = 1, cheatCount = 0, timerInt, isTestActive = false;

function toNamePage() {
    document.getElementById('page-quote').style.display = 'none';
    document.getElementById('page-name').style.display = 'block';
}

function updateKelasOptions() {
    const jenjang = document.getElementById('sel-jenjang').value;
    const selKelas = document.getElementById('sel-kelas');
    selKelas.innerHTML = '<option value="" disabled selected>-- Pilih Kelas --</option>';
    const list = (jenjang === "X") ? ["E1", "E2", "E3", "E4", "E5"] : ["MIPA 1", "MIPA 2", "IPS 1", "IPS 2"];
    list.forEach(k => {
        let opt = document.createElement('option');
        opt.value = `${jenjang} ${k}`; opt.innerText = `${jenjang} ${k}`;
        selKelas.appendChild(opt);
    });
    selKelas.disabled = false;
}

async function getStudentNames() {
    const kelas = document.getElementById('sel-kelas').value;
    const selNama = document.getElementById('sel-nama');
    selNama.innerHTML = '<option disabled selected>Loading...</option>';
    const res = await fetch(CLOUDFLARE_WORKER_URL, { method: 'POST', body: JSON.stringify({ action: "getNames", kelas: kelas }) });
    const data = await res.json();
    selNama.innerHTML = '<option value="" disabled selected>-- Pilih Nama --</option>';
    data.names.forEach(n => {
        let opt = document.createElement('option');
        opt.value = n; opt.innerText = n;
        selNama.appendChild(opt);
    });
    selNama.disabled = false;
}

async function checkHistoryAndStart() {
    const nm = document.getElementById('sel-nama').value;
    if(!nm) return alert("Pilih nama!");
    document.getElementById('page-name').style.display = 'none';
    document.getElementById('page-loading').style.display = 'block';
    const res = await fetch(CLOUDFLARE_WORKER_URL, { method: 'POST', body: JSON.stringify({ action: "getSoal" }) });
    const data = await res.json();
    if(data.result === "success") { renderQuestion(data.data); startTimer(); }
}

function renderQuestion(soal) {
    currentQuestion = soal; isTestActive = true;
    document.getElementById('page-loading').style.display = 'none';
    document.getElementById('page-test').style.display = 'block';
    const area = document.getElementById('question-area');
    let opts = [soal.correct, ...soal.wrongs].sort(() => Math.random() - 0.5);
    area.innerHTML = `<div class="problem-card"><p class="problem-text">${soal.question}</p></div>` +
        opts.map(o => `<button class="option-btn" onclick="checkAnswer('${o}')">${o}</button>`).join('');
}

function checkAnswer(ans) {
    if(ans === currentQuestion.correct) success();
    else { totalAttempts++; alert("Salah! Soal diacak kembali."); checkHistoryAndStart(); }
}

function startTimer() {
    let timeLeft = 300;
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById('timer').innerText = `${m}:${s < 10 ? '0'+s : s}`;
        if(timeLeft-- <= 0) location.reload();
    }, 1000);
}

function success() {
    isTestActive = false; clearInterval(timerInt);
    const nm = document.getElementById('sel-nama').value;
    const tm = new Date().toLocaleString('id-ID');
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('page-success').style.display = 'block';
    document.getElementById('final-name').innerText = nm;
    document.getElementById('final-time').innerText = tm;
    document.getElementById('attempt-info').innerText = `${totalAttempts} Percobaan`;
    
    new QRCode(document.getElementById("qrcode"), { text: `VALID|${nm}|${tm}`, width: 180, height: 180 });
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    document.getElementById('sending-overlay').style.display = 'flex';
    fetch(CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "submit", nama: nm, status: `${totalAttempts} Percobaan`, info: `Curang: ${cheatCount}x` })
    }).then(() => document.getElementById('sending-overlay').style.display = 'none');
}

window.onblur = () => { if(isTestActive) { cheatCount++; alert("Jangan pindah tab!"); } };
