CHEAT SHEET SIDANG: BAB I - PENDAHULUAN1.1 Latar Belakang Masalah (Akar Permasalahan)Fokus pada bagian ini jika penguji bertanya: "Mengapa Anda mengangkat topik ini?" atau "Apa masalah utama di Homwok Coffee?"Industri kopi di Indonesia tumbuh pesat, namun banyak pelaku UMKM masih mengandalkan pencatatan transaksi secara manual.  Pencatatan manual rentan terhadap kesalahan manusia (human error), tidak memiliki laporan penjualan real-time, dan tidak memiliki pergerakan antrean persediaan FIFO.  Homwok Coffee kesulitan menghitung Harga Pokok Penjualan (HPP) secara akurat karena fluktuasi harga bahan baku (biji kopi, susu, sirup) antar periode pembelian.  Dampak ketidakakuratan HPP: penentuan harga jual menjadi tidak tepat, perhitungan laba bersih menjadi bias, dan pengendalian stok gudang menjadi lemah.  Tanpa metode persediaan terstruktur, risiko bahan baku melewati batas kedaluwarsa menjadi lebih tinggi dan menimbulkan kerugian finansial.  Solusi: Membangun sistem Point of Sale (POS) berbasis web yang terintegrasi dengan pengelolaan persediaan metode First-In, First-Out (FIFO) secara otomatis.  Metode FIFO sangat krusial untuk industri Food & Beverage (F&B) karena selaras dengan alur fisik bahan baku yang mudah rusak (perishable).  1.2 Rumusan Masalah (Fokus Utama Penelitian)Fokus pada bagian ini jika penguji bertanya: "Jadi, apa yang sebenarnya Anda teliti/buat?"Bagaimana merancang dan membangun Aplikasi Penjualan Kasir (Point of Sale) berbasis web yang terintegrasi dengan fitur perhitungan Harga Pokok Penjualan (HPP) menggunakan metode First-In, First-Out (FIFO) pada Homwok Coffee.  1.3 Ruang Lingkup (Batasan Sistem)Fokus pada bagian ini jika penguji bertanya di luar konteks atau meminta fitur tambahan. Gunakan ini sebagai "tameng" Anda.Fungsionalitas dibatasi hanya pada modul penjualan (transaksi kasir) dan modul pengelolaan persediaan bahan baku.  Metode penilaian persediaan hanya menggunakan metode FIFO (tidak membahas LIFO atau Average).  Fokus pada bahan baku utama (biji kopi, susu) dan komponen pendukung minuman.  Luaran (output) dibatasi pada penyajian laporan perputaran persediaan real-time dan laporan estimasi laba rugi kotor berdasarkan HPP per transaksi.  1.4 Tujuan Penelitian (Target Akhir)Fokus pada bagian ini jika penguji bertanya: "Apa yang Anda harapkan dari sistem ini?"Mengembangkan Aplikasi Penjualan Kasir (Point of Sale) yang efektif dan efisien.  Mengkomputerisasi pencatatan transaksi di Homwok Coffee.  Mengotomatisasi perhitungan Harga Pokok Penjualan (HPP) dengan menggunakan metode FIFO.  

BAB II
DASAR TEORI DAN TINJAUAN PUSTAKA
Dasar Teori
Dalam penyusunan Tugas Akhir ini, diperlukan beberapa sumber referensi untuk memperdalam pemahaman teori yang mendasari proses analisis dan perancangan sistem yang telah dan akan diterapkan.
Definisi Point of Sale
Point of Sale (POS) merupakan sistem elektronik yang digunakan untuk memproses transaksi penjualan secara digital pada titik terjadinya penjualan. Pada perkembangan awalnya, POS hanya berperan sebagai pengganti mesin kasir konvensional (cash register) untuk mencatat nominal pembayaran dan mencetak struk. Seiring kebutuhan pelaku usaha akan informasi yang terintegrasi, sistem POS berkembang menjadi sistem informasi yang menggabungkan pencatatan transaksi, manajemen persediaan, dan pelaporan kinerja usaha dalam satu kesatuan (Hidayat & Farell, 2023).
Dalam penelitian ini, aplikasi POS dikembangkan berbasis web agar dapat diakses secara fleksibel melalui peramban (browser) standar dari berbagai perangkat tanpa proses instalasi yang rumit, serta memungkinkan operasi multi-user antara komputer kasir dan perangkat pengelola. Pendekatan POS berbasis web pada kedai kopi terbukti mempercepat proses transaksi dan meningkatkan kualitas pelayanan pelanggan melalui pencatatan digital (Darmawan, 2021).
Persediaan (Inventory)
Persediaan (inventory) adalah aktiva yang dimiliki perusahaan untuk dijual dalam kegiatan usaha normal atau berupa bahan yang digunakan dalam proses produksi barang/jasa (Weygandt, Kimmel, & Kieso, 2019). Pada perusahaan manufaktur maupun usaha kuliner, persediaan umumnya diklasifikasikan menjadi tiga jenis, yaitu:
Bahan baku (raw materials): Bahan utama yang akan diolah, misalnya biji kopi dan susu pada Homwok Coffee.
Barang dalam proses (work in process): Bahan yang sedang diolah namun belum selesai.
Barang jadi (finished goods): Produk siap jual, dalam konteks ini berupa menu minuman yang disajikan kepada pelanggan.
Pengelolaan persediaan menjadi krusial karena nilai persediaan mempengaruhi dua hal sekaligus: nilai aktiva yang dilaporkan di neraca (persediaan akhir) dan besarnya beban yang diakui di laporan laba rugi melalui Harga Pokok Penjualan (Weygandt et al., 2019). Pada komoditas Food & Beverage yang bersifat mudah rusak (perishable), pengendalian persediaan juga berkaitan langsung dengan risiko kerugian akibat kedaluwarsa.
Metode Penilaian Persediaan
Karena harga beli bahan baku dapat berbeda-beda antar periode pembelian, diperlukan suatu metode untuk menentukan biaya mana yang dibebankan ketika persediaan digunakan/terjual. Terdapat tiga metode penilaian persediaan yang umum digunakan (Weygandt et al., 2019):
First-In, First-Out (FIFO): Mengasumsikan bahan yang pertama masuk adalah yang pertama keluar. Biaya yang dibebankan ke HPP berasal dari pembelian terlama, sehingga nilai persediaan akhir mencerminkan harga pembelian terbaru.
Last-In, First-Out (LIFO): Kebalikan dari FIFO; bahan yang terakhir masuk dibebankan lebih dulu. Metode ini tidak diakui dalam Standar Akuntansi Keuangan yang berlaku di Indonesia (PSAK), sehingga jarang diterapkan.
Rata-rata tertimbang (Weighted Average): Membebankan biaya berdasarkan harga rata-rata seluruh unit yang tersedia, tanpa membedakan urutan masuk.
Penelitian ini memilih metode FIFO karena dua alasan utama. Pertama, FIFO selaras dengan alur fisik bahan baku Food & Beverage yang harus digunakan sesuai urutan masuk untuk menghindari kedaluwarsa. Kedua, FIFO menghasilkan nilai persediaan akhir yang mendekati harga pasar terkini sehingga lebih representatif dibanding metode Average (Weygandt et al., 2019). Metode LIFO dan Average tidak menjadi fokus pembahasan pada penelitian ini sebagaimana dibatasi pada ruang lingkup penelitian.
Harga Pokok Penjualan (HPP)
Harga Pokok Penjualan (HPP) atau Cost of Goods Sold (COGS) merupakan akumulasi seluruh biaya langsung yang dikeluarkan untuk memperoleh atau memproduksi barang yang terjual dalam suatu periode akuntansi (Weygandt et al., 2019). Secara umum, HPP dirumuskan sebagai berikut:
HPP = Persediaan Awal + Pembelian Bersih - Persediaan Akhir


Dari rumus tersebut terlihat bahwa besarnya HPP sangat ditentukan oleh nilai persediaan akhir, dan nilai persediaan akhir itu sendiri bergantung pada metode penilaian persediaan yang dipilih (FIFO, LIFO, atau Average). Inilah yang menjadikan pemilihan metode penilaian (Sub-bab 2.1.3) berkaitan langsung dengan keandalan perhitungan HPP.
Dalam konteks Homwok Coffee, komponen HPP mencakup biaya perolehan bahan baku utama (biji kopi dan susu) serta bahan pendukung (sirup, paper cup, plastic cup, dan sedotan) yang benar-benar terpakai untuk menyajikan menu yang terjual. Perhitungan HPP yang akurat menentukan keandalan laporan laba rugi dan ketepatan penetapan harga jual; sebaliknya, HPP yang tidak akurat menimbulkan bias pada estimasi laba dan evaluasi profitabilitas usaha (Romney & Steinbart, 2018).
Mekanisme Algoritma FIFO (First-In, First-Out)
Metode FIFO didasarkan pada asumsi bahwa bahan baku yang pertama kali masuk ke gudang adalah bahan yang pertama kali digunakan. Di dalam sistem aplikasi, FIFO diimplementasikan menggunakan struktur data antrian lot pembelian (purchase lot queue) yang mencatat setiap entri bahan masuk secara kronologis beserta parameter: tanggal masuk, kuantitas, dan harga beli per unit.
Ketika transaksi penjualan terjadi, sistem memotong kuantitas dari lot pembelian paling awal terlebih dahulu. Apabila kuantitas yang dibutuhkan melebihi sisa pada lot terlama, pemotongan dilanjutkan ke lot berikutnya secara berurutan hingga seluruh kebutuhan terpenuhi. Nilai HPP dihitung dari akumulasi biaya lot-lot yang terpotong tersebut.
Catatan konseptual: Pada metode FIFO, HPP mencerminkan harga pembelian yang lebih lama (lot terdahulu), sedangkan persediaan akhir mencerminkan harga terbaru. Pada kondisi harga bahan baku yang cenderung naik (inflasi), FIFO menghasilkan HPP yang lebih rendah dan laba kotor yang lebih tinggi dibanding metode Average (Weygandt et al., 2019).
Contoh Numerik (Potongan Lot FIFO): Misalkan terdapat tiga lot pembelian biji kopi yang terdapat pada Tabel 2.1 :
Tabel 2. 1 Tabel Bahan Baku
Lot
Tanggal Masuk
Kuantitas
Harga Beli/gram
Nilai Lot
1
01 Mar 2026
5.000 g
Rp120
Rp600.000
2
10 Mar 2026
5.000 g
Rp135
Rp675.000
3
20 Mar 2026
5.000 g
Rp150
Rp750.000


Jika total Penjualan menu pada suatu periode mengonsumsi 6.0 00 gram biji kopi, pemotongan FIFO dilakukan yang terdapat pada Tabel 2.2.
Tabel 2. 2 Tabel Lot Pembelian FIFO
Sumber
Kuantitas Dipotong
Harga/gram
Subtotal HPP
Lot 1
5.000 g
Rp120
Rp600.000
Lot 2
1.000 g
Rp135
Rp135.000
Total HPP
6.000 g


Rp735.000


Setelah transaksi, sisa persediaan adalah: Lot 2 = 4.000 g dan Lot 3 = 5.000 g, sehingga nilai persediaan akhir = (4.000 × Rp135) + (5.000 × Rp150) = Rp540.000 + Rp750.000 = Rp1.290.000. Nilai persediaan akhir ini mencerminkan harga pembelian terbaru (Rp135 dan Rp150), sesuai karakteristik FIFO.
Komposisi Resep (Bill of Materials)
Bill of Materials (BOM) adalah daftar terstruktur yang merinci seluruh bahan baku beserta takaran/kuantitas yang dibutuhkan untuk menghasilkan satu unit produk jadi (Heizer, Render, & Munson, 2020). Dalam penelitian ini, BOM dianalogikan sebagai komposisi resep, yaitu dekomposisi penggunaan bahan baku untuk setiap satu porsi menu minuman.
Konsep BOM menjadi penghubung antara modul penjualan dan modul persediaan: ketika satu menu terjual, sistem tidak langsung memotong "satu menu" dari stok, melainkan menerjemahkannya terlebih dahulu menjadi sejumlah bahan baku sesuai resep, lalu memotong masing-masing bahan tersebut dari antrian lot FIFO-nya.
Rekayasa Perangkat Lunak Berbasis Web 
Aplikasi ini dirancang dengan menerapkan prinsip rekayasa perangkat lunak (RPL). RPL merupakan disiplin yang menerapkan pendekatan sistematis dan terukur dalam pengembangan perangkat lunak melalui serangkaian tahapan yang dikenal sebagai Software Development Life Cycle (SDLC), yang umumnya meliputi komunikasi, perencanaan, pemodelan, konstruksi, dan penyerahan (Pressman & Maxim, 2020).
Arsitektur berbasis web dipilih agar aplikasi dapat dijalankan secara multi-user dari komputer kasir maupun perangkat genggam pengelola selama terhubung ke jaringan. Aplikasi ini dikembangkan dengan arsitektur terpisah (decoupled) antara sisi backend dan frontend, sehingga teknologi pendukungnya diuraikan ke dalam empat bagian berikut.
Arsitektur Client-Server dan RESTfull API
Aplikasi dirancang menggunakan arsitektur client–server yang terpisah, di mana sisi backend (peladen) dan sisi frontend (klien) merupakan dua bagian mandiri yang berkomunikasi melalui antarmuka pemrograman aplikasi (Application Programming Interface/API). Gaya arsitektur API yang digunakan adalah Representational State Transfer (REST), yaitu pola komunikasi stateless berbasis protokol HTTP yang mengakses sumber daya (resource) melalui endpoint dengan metode standar seperti GET, POST, PUT, dan DELETE (Fielding, 2000).
 Pertukaran data antara backend dan frontend dilakukan dalam format JSON (JavaScript Object Notation), yaitu format teks ringan yang mudah dibaca mesin maupun manusia. Dengan pendekatan ini, logika bisnis (termasuk kalkulasi FIFO dan HPP) sepenuhnya berada di sisi backend, sedangkan frontend hanya bertugas menampilkan data dan menerima masukan pengguna. Pemisahan ini meningkatkan keteraturan, kemudahan pemeliharaan, dan memungkinkan kedua sisi dikembangkan secara independen.
Laravel dan Pola MVC (Backend/API)
Sisi backend dibangun menggunakan Laravel, yaitu kerangka kerja (framework) berbahasa PHP (Hypertext Preprocessor) yang menerapkan pola arsitektur Model-View-Controller (MVC). Pola MVC memisahkan tanggung jawab menjadi tiga lapisan: Model (logika data dan interaksi basis data), Controller (logika pengendali dan aturan bisnis), dan View (penyajian keluaran) (Pressman & Maxim, 2020).
Pada arsitektur decoupled ini, peran lapisan View tidak lagi berupa halaman HTML yang di render langsung ke pengguna, melainkan digantikan oleh respons data dalam format JSON yang dikirim melalui REST API. Dengan demikian, Laravel berfungsi sebagai penyedia layanan API yang mengeksekusi logika kalkulasi FIFO, pemrosesan transaksi penjualan dan pembelian, serta manipulasi data persediaan.
React.js dan Next.js (Frontend)
Sisi frontend dibangun menggunakan React.js, yaitu pustaka (library) JavaScript untuk membangun antarmuka pengguna berbasis komponen yang dapat digunakan kembali (reusable components). React menerapkan konsep Virtual DOM untuk memperbarui tampilan secara efisien ketika terjadi perubahan data, sehingga sesuai untuk antarmuka kasir yang bersifat interaktif dan dinamis (Naresvari & Susetyo, 2025).
Di atas React digunakan Next.js, yaitu framework React yang menyediakan fitur seperti perutean (routing), rendering sisi peladen (server-side rendering), dan optimasi performa secara terstruktur. Penggunaan Next.js pada sisi frontend yang dipadukan dengan Laravel pada sisi backend telah diterapkan secara luas pada pengembangan sistem informasi berbasis web (Anugerah & Kosasi, 2024). Next.js dijalankan pada lingkungan Node.js, yaitu runtime JavaScript di sisi peladen yang dikenal memiliki performa pemrosesan yang baik untuk aplikasi web (Pratama & Raharja, 2023). Frontend ini bertugas mengonsumsi REST API dari Laravel untuk menampilkan menu, memproses keranjang penjualan, serta menyajikan laporan kepada pengguna.
Basis Data MySQL
Penyimpanan data menggunakan MySQL, yaitu Relational Database Management System (RDBMS) yang menyimpan data secara terstruktur dalam bentuk tabel yang saling berelasi (Connolly & Begg, 2015). MySQL digunakan untuk menyimpan data master menu, komposisi resep, data pembelian beserta antrian lot FIFO, data penjualan, serta log pemakaian bahan sebagai dasar perhitungan HPP. MySQL diakses oleh backend Laravel melalui lapisan Model dengan memanfaatkan Object Relational Mapping (ORM) Eloquent.

2.3 Tinjauan Pustaka (Posisi dan Kebaruan Sistem)Fokus pada bagian ini jika penguji bertanya: "Apa bedanya sistem Anda dengan penelitian kakak tingkat sebelumnya?"Berbeda dengan penelitian Darmawan (2021) dan Khumairoh (2025) yang hanya sebatas sistem POS kasir tanpa integrasi pemotongan HPP berbasis FIFO.  Berbeda dengan Candrasari (2022) yang berfokus pada klinik medis, serta Cahyanto (2024) dan Alfionita (2024) yang berfokus pada ritel (tanpa dekomposisi resep minuman).  Kebaruan (Novelty): Sistem Anda adalah satu-satunya yang mengintegrasikan transaksi POS kasir dengan pemotongan HPP otomatis secara seketika (real-time) menggunakan struktur dekomposisi lot FIFO khusus komoditas Food & Beverage (BOM)

CHEAT SHEET SIDANG: BAB III - ANALISIS & PERANCANGAN3.1 Deskripsi Sistem & ArsitekturBagian ini untuk menjawab pertanyaan umum tentang bagaimana sistem bekerja secara teknis.Arsitektur Terpisah (Decoupled): Sisi backend (Laravel) berfungsi khusus sebagai penyedia REST API, sedangkan sisi frontend (Next.js/React) mengelola antarmuka dan interaksi klien.  Hak Akses (Role-Based):Barista: Melakukan input data master, transaksi pembelian, transaksi POS kasir, dan mencetak struk.  Manager: Mengakses dasbor analitik dan laporan (HPP, laba rugi, kartu persediaan).  3.2 Analisa Kebutuhan (Fokus pada Non-Fungsional & Keamanan)Ini adalah senjata rahasia Anda jika dosen meragukan keamanan sistem saat toko sedang ramai.Integritas Data (Database Transaction & Row Locking): Ini sangat penting! Pembaruan stok dilakukan dalam satu database transaction menggunakan fungsi row locking untuk mencegah race condition (bentrokan data saat kasir menekan tombol bayar secara bersamaan).  Kecepatan: Pemrosesan algoritma FIFO dirancang efisien dan wajib dieksekusi di bawah 3 detik.  Keamanan: Kata sandi dienkripsi menggunakan metode hashing yang aman.  3.5 & 3.7 Struktur Data Tabel dan Relasi (ERD)
Hafalkan 3 tabel paling krusial ini. Jika dosen meminta Anda menjelaskan database, langsung tembak ke 3 tabel ini.
Total ada 9 tabel utama dalam sistem, dengan fungsi kunci sebagai berikut:  Tabel resep (Tabel Jembatan/BOM): Memecah relasi many-to-many antara menu dan bahan_baku. Berisi field takaran pasti untuk setiap porsi.  Tabel detail_pembelian (Antrean FIFO): Berfungsi ganda sebagai rincian faktur belanja sekaligus sebagai lot antrean FIFO. Sistem mengandalkan kolom sisa_qty pada tabel ini untuk mengetahui ketersediaan stok tiap lot.  Tabel pemakaian_bahan (Jejak Audit/Audit Trail): Tabel paling krusial untuk membuktikan bahwa HPP dihitung secara benar. Tabel ini mengunci relasi antara menu yang terjual (id_detail_penjualan) dengan lot mana yang dipotong (id_detail_pembelian) lengkap beserta harganya.  3.6 Data Alur Diagram (DAD)Level 0 (Konteks): Barista memberikan input (transaksi, data master), Sistem memproses, Manager menerima laporan.  Level 1 (Sub-proses): Terdapat 6 proses utama, yaitu kelola data pegawai, bahan baku, resep, pembelian, penjualan (inti FIFO), dan pembuatan laporan.  3.8 & 3.9 Rancangan Input dan OutputInput Krusial: Form Transaksi Penjualan (Kasir) di mana algoritma FIFO dipicu di latar belakang setelah pembayaran.  Output Manajerial (Laporan):Laporan Penelusuran HPP: Membuktikan bahan apa yang dipakai, dari lot tanggal berapa, dan harga belinya (validasi FIFO per nota).  Kartu Persediaan: Buku besar mutasi yang merinci riwayat masuk (pembelian), keluar (penjualan), dan saldo per bahan baku.  Laporan Laba Rugi Kotor: Agregasi total omzet dikurangi total HPP riil.  