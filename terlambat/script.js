const CLOUDFLARE_WORKER_URL = "https://disiplin-siswa.kurikulum-sman2cikarangbarat.workers.dev/";

// Bagian fungsi success() yang diperbarui untuk integrasi D1
function success() {
    isTestActive = false; clearInterval(timerInt);
    const nm = document.getElementById('sel-nama').value;
    const tm = new Date().toLocaleString('id-ID', { hour12: false });
    const attemptText = `${totalAttempts} Percobaan`;

    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('page-success').style.display = 'block';
    
    document.getElementById('final-name').innerText = nm;
    document.getElementById('final-time').innerText = tm;
    document.getElementById('attempt-info').innerText = attemptText;
    
    // Generate QR
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), { 
        text: `TIKET VALID\n${nm}\n${tm}\n${attemptText}`, 
        width: 200, height: 200 
    });
    
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

    // Kirim ke D1
    document.getElementById('sending-overlay').style.display = 'flex';

    fetch(CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: "submit", 
            nama: nm, 
            status: attemptText, 
            info: `Selesai. Curang: ${cheatCount}x` 
        })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('sending-overlay').style.display = 'none';
        if(data.result === "success") {
            document.getElementById('sent-status').innerText = "DATA TERSIMPAN DI DATABASE D1";
            document.getElementById('sent-status').style.color = "#27ae60";
        }
    })
    .catch(err => {
        document.getElementById('sending-overlay').style.display = 'none';
        document.getElementById('sent-status').innerText = "ERROR: HUBUNGI GURU PIKET";
        document.getElementById('sent-status').style.color = "#c0392b";
    });
}
