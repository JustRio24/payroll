# Panduan Setup MySQL untuk Sistem Payroll

## Overview

Sistem payroll ini mendukung dua mode penyimpanan:

1. **MySQL Storage** (Produksi) - Untuk penggunaan dengan XAMPP/phpMyAdmin lokal
2. **In-Memory Storage** (Demo) - Untuk demo dan pengembangan tanpa database

## Setup MySQL Lokal (XAMPP)

### Langkah 1: Install XAMPP

1. Download XAMPP dari https://www.apachefriends.org/
2. Install dan jalankan Apache dan MySQL dari XAMPP Control Panel

### Langkah 2: Buat Database

1. Buka phpMyAdmin di browser (http://localhost/phpmyadmin)
2. Klik tab "Import"
3. Pilih file `database_setup.sql` dari project ini
4. Klik "Go" untuk menjalankan script

Atau jalankan manual di terminal MySQL:
```bash
mysql -u root < database_setup.sql
```

### Langkah 3: Konfigurasi Environment

Buat file `.env` di root project dengan isi:

```env
# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=db_payroll
DB_PORT=3306

# Session
SESSION_SECRET=your-secret-key-here

# Untuk menggunakan in-memory storage, set:
# USE_MEMORY_STORAGE=true
```

### Langkah 4: Jalankan Aplikasi

```bash
npm run dev
```

## Mode Penyimpanan

### MySQL Storage (Default untuk lokal)

Aplikasi akan otomatis menggunakan MySQL jika:
- Environment variables database dikonfigurasi
- MySQL server berjalan dan dapat diakses
- Database `db_payroll` ada dan sudah di-setup

### In-Memory Storage (Fallback)

Aplikasi akan menggunakan in-memory storage jika:
- MySQL tidak tersedia atau tidak dapat terhubung
- Environment variable `USE_MEMORY_STORAGE=true` di-set

In-memory storage sudah termasuk data dummy untuk testing.

## Data Dummy

File `database_setup.sql` berisi data dummy lengkap:

- **10 Jabatan**: Dari Kepala Proyek sampai OB
- **11 Users**: 1 Admin + 10 Karyawan
- **50+ Attendance**: 5 hari terakhir untuk semua karyawan
- **8 Leave Requests**: Berbagai status (approved, pending)
- **10 Payroll Records**: Bulan lalu untuk semua karyawan
- **12 Config Settings**: Konfigurasi sistem

## Kredensial Login Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@panca.test | password |
| Employee | budi@panca.test | password |
| Employee | siti@panca.test | password |

## Troubleshooting

### Error: MySQL Connection Failed

1. Pastikan XAMPP MySQL berjalan
2. Cek environment variables sudah benar
3. Cek database `db_payroll` sudah dibuat
4. Cek port MySQL (default 3306)

### Error: Table doesn't exist

Jalankan ulang script `database_setup.sql` di phpMyAdmin.

### Fallback ke In-Memory

Jika MySQL tidak tersedia, aplikasi akan otomatis fallback ke in-memory storage dengan data demo. Cek log console untuk melihat mode yang aktif:

```
[storage] Connected to MySQL database
```
atau
```
[storage] Falling back to in-memory storage with demo data
```

## Struktur Tabel

| Tabel | Deskripsi |
|-------|-----------|
| positions | Master data jabatan dan rate per jam |
| users | Data pengguna (admin & karyawan) |
| attendance | Data absensi harian |
| leaves | Pengajuan cuti |
| payroll | Data penggajian bulanan |
| config | Konfigurasi sistem |

## API Endpoints

Semua endpoint tersedia di `/api`:

- `GET/POST /api/users` - CRUD karyawan
- `GET/POST /api/positions` - CRUD jabatan
- `GET/POST /api/attendance` - CRUD absensi
- `GET/POST /api/leaves` - CRUD cuti
- `GET/POST /api/payroll` - CRUD penggajian
- `GET/POST /api/config` - Konfigurasi sistem
