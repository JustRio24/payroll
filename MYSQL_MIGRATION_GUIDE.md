# Panduan Migrasi ke MySQL Lokal

## Ringkasan Perubahan

Project ini telah berhasil dimigrasikan dari PostgreSQL ke MySQL lokal untuk berjalan di XAMPP.

## File yang Diubah

### 1. **shared/schema.ts**
- Diubah dari `pgTable` menjadi `mysqlTable`
- Diubah dari `pg-core` menjadi `mysql-core`
- ID menggunakan `int().autoincrement()` untuk auto increment MySQL
- Username menggunakan `varchar` dengan panjang 255

### 2. **server/db.ts** (File Baru)
- Koneksi MySQL menggunakan `mysql2/promise`
- Konfigurasi connection pool untuk performa optimal
- Menggunakan environment variables untuk konfigurasi

### 3. **server/storage.ts**
- Diubah dari `MemStorage` (in-memory) menjadi `MySQLStorage`
- Implementasi CRUD menggunakan Drizzle ORM dengan MySQL
- Tipe ID diubah dari `string` (UUID) menjadi `number` (auto increment)

### 4. **database_setup.sql** (File Baru)
- Script SQL lengkap untuk membuat database dan tabel
- Siap dijalankan di phpMyAdmin atau MySQL CLI

### 5. **Environment Variables** (Development)
- `DB_HOST=localhost`
- `DB_USER=root`
- `DB_PASS=` (kosong)
- `DB_NAME=db_payroll`
- `DB_PORT=3306`

## Cara Setup Database

### Opsi 1: Menggunakan phpMyAdmin (XAMPP)
1. Buka phpMyAdmin di browser: `http://localhost/phpmyadmin`
2. Klik tab "SQL"
3. Copy-paste seluruh isi file `database_setup.sql`
4. Klik "Go" untuk menjalankan script

### Opsi 2: Menggunakan MySQL CLI
```bash
# Masuk ke MySQL
mysql -u root -p

# Jalankan script
source database_setup.sql
```

### Opsi 3: Import via Command Line
```bash
mysql -u root -p < database_setup.sql
```

## Cara Menjalankan Aplikasi

1. Pastikan XAMPP sudah berjalan (khususnya MySQL/MariaDB)
2. Pastikan database `db_payroll` sudah dibuat (jalankan `database_setup.sql`)
3. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

## Konfigurasi Database

Jika perlu mengubah konfigurasi database (misalnya menggunakan password atau port berbeda), ubah environment variables di Replit Secrets/Environment Variables:

- `DB_HOST` - Host database (default: localhost)
- `DB_USER` - Username MySQL (default: root)
- `DB_PASS` - Password MySQL (default: kosong)
- `DB_NAME` - Nama database (default: db_payroll)
- `DB_PORT` - Port MySQL (default: 3306)

## Struktur Database

### Tabel: users
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `username` (VARCHAR(255), UNIQUE, NOT NULL)
- `password` (TEXT, NOT NULL)

## Testing Koneksi

Untuk memverifikasi koneksi database berfungsi, aplikasi akan otomatis mencoba koneksi saat server dijalankan.

## Troubleshooting

### Error: "Can't connect to MySQL server"
- Pastikan XAMPP MySQL sudah berjalan
- Cek apakah port 3306 tidak digunakan aplikasi lain
- Verifikasi credentials di environment variables

### Error: "Database does not exist"
- Jalankan script `database_setup.sql` di phpMyAdmin
- Atau buat database manual dengan nama `db_payroll`

### Error: "Access denied for user"
- Cek username dan password di environment variables
- Pastikan user MySQL memiliki akses ke database

## Catatan Penting

- Aplikasi sekarang **100% berjalan lokal** dengan MySQL di XAMPP
- Tidak ada lagi dependensi ke cloud database
- Semua query sudah menggunakan prepared statements (via Drizzle ORM)
- Connection pooling sudah dikonfigurasi untuk performa optimal
