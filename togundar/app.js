// ============================================================
// app.js
// Logika halaman login & tampilan hasil
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ---------- ELEMEN DOM ----------
  const loginPage   = document.getElementById('loginPage');
  const resultPage  = document.getElementById('resultPage');
  const form        = document.getElementById('loginForm');
  const nisnInput   = document.getElementById('nisn');
  const passInput   = document.getElementById('password');
  const errorMsg    = document.getElementById('errorMsg');

  const badgeJurusan    = document.getElementById('badgeJurusan');
  const welcomeText     = document.getElementById('welcomeText');
  const nilaiMatematika = document.getElementById('nilaiMatematika');
  const nilaiIndonesia  = document.getElementById('nilaiIndonesia');
  const nilaiInggris    = document.getElementById('nilaiInggris');
  const btnLogout       = document.getElementById('btnLogout');

  // ---------- FILTER: hanya angka ----------
  function onlyNumbers(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
  }
  nisnInput.addEventListener('input', onlyNumbers);
  passInput.addEventListener('input', onlyNumbers);

  // ---------- FORMAT NILAI ----------
  function formatNilai(v) {
    if (v === null || v === undefined || v === '') return '-';
    return v;
  }

  // ---------- TAMPILKAN PESAN ----------
  function showMessage(text, type) {
    errorMsg.textContent = text;
    errorMsg.className = 'message' + (type ? ' ' + type : '');
  }

  // ---------- SUBMIT LOGIN ----------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showMessage('', '');

    const nisn = nisnInput.value.trim();
    const pass = passInput.value.trim();

    if (nisn.length !== 10) {
      showMessage('NISN harus terdiri dari 10 digit angka.', 'error');
      nisnInput.focus();
      return;
    }

    if (!/^\d{8}$/.test(pass)) {
      showMessage('Password harus 8 digit angka (yyyymmdd).', 'error');
      passInput.focus();
      return;
    }

    const siswa = dataSiswa.find(function (s) {
      return s.nisn === nisn && s.tanggal === pass;
    });

    if (!siswa) {
      showMessage('NISN atau tanggal lahir tidak sesuai.', 'error');
      passInput.focus();
      passInput.select();
      return;
    }

    // Sukses
    tampilkanHasil(siswa);
  });

  // ---------- TAMPILKAN HASIL ----------
  function tampilkanHasil(siswa) {
    badgeJurusan.textContent    = 'Jurusan ' + siswa.jurusan;
    welcomeText.textContent     = 'Selamat datang, ' + siswa.nama + '!';
    nilaiMatematika.textContent = formatNilai(siswa.matematika);
    nilaiIndonesia.textContent  = formatNilai(siswa.indonesia);
    nilaiInggris.textContent    = formatNilai(siswa.inggris);

    loginPage.hidden  = true;
    resultPage.hidden = false;

    // Scroll ke atas untuk mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- LOGOUT ----------
  btnLogout.addEventListener('click', function () {
    form.reset();
    showMessage('', '');
    resultPage.hidden = true;
    loginPage.hidden  = false;
    nisnInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- FOKUS AWAL ----------
  nisnInput.focus();

});
