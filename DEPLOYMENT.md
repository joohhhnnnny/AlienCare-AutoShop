# AlienCare AutoShop - Deployment Guide

## Prerequisites

- PHP 8.1 or higher
- Composer 2.0+
- MySQL 8.0+
- Node.js 18+ (for frontend assets)
- Web server (Apache/Nginx)

## Local Development Setup

### 1. Environment Setup

```bash
# Clone the repository (if using git)
git clone <repository-url>
cd AlienCare-AutoShop

# Copy environment file
copy .env.example .env

# Install PHP dependencies
composer install

# Install Node.js dependencies (if using frontend build tools)
npm install

# Generate application key
php artisan key:generate
```

### 2. Database Configuration

Edit your `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aliencare_autoshop
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

Create the database:
```sql
CREATE DATABASE aliencare_autoshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Database Migration and Seeding

```bash
# Run migrations to create tables
php artisan migrate

# Seed the database with sample data
php artisan db:seed

# Or run both in one command
php artisan migrate:fresh --seed
```

### 4. Queue Configuration

For background job processing (reports, alerts):

```bash
# Start the queue worker
php artisan queue:work

# Or use supervisor for production (see Production section)
```

### 5. Storage Setup

```bash
# Create storage link for file uploads
php artisan storage:link

# Set proper permissions
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

### 6. Start Development Server

```bash
# Start Laravel development server
php artisan serve

# Application will be available at http://localhost:8000
```

## Production Deployment

### 1. Server Requirements

- PHP 8.1+ with extensions: PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath
- MySQL 8.0+
- Redis (recommended for queues and caching)
- Web server with URL rewriting

### 2. Deployment Steps

```bash
# 1. Upload files to server
# Upload all files except .env, storage/, and bootstrap/cache/

# 2. Install dependencies (production mode)
composer install --no-dev --optimize-autoloader

# 3. Environment configuration
cp .env.example .env
# Edit .env with production values

# 4. Generate key and cache config
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. Run migrations
php artisan migrate --force

# 6. Seed production data (optional)
php artisan db:seed --class=ProductionSeeder

# 7. Set permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 3. Web Server Configuration

#### Apache (.htaccess in public folder)
```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/AlienCare-AutoShop/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 4. Queue Worker Setup (Supervisor)

Create `/etc/supervisor/conf.d/aliencare-worker.conf`:

```ini
[program:aliencare-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/AlienCare-AutoShop/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/AlienCare-AutoShop/storage/logs/worker.log
stopwaitsecs=3600
```

### 5. Cron Jobs Setup

Add to crontab (`crontab -e`):

```bash
# Laravel scheduler
* * * * * cd /path/to/AlienCare-AutoShop && php artisan schedule:run >> /dev/null 2>&1

# Daily maintenance (optional - already handled by scheduler)
0 2 * * * cd /path/to/AlienCare-AutoShop && php artisan inventory:maintenance >> /dev/null 2>&1
```

### 6. SSL Configuration

```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d your-domain.com

# Or manually configure SSL in nginx/apache
```

## Environment Variables Reference

### Required Settings

```env
# Application
APP_NAME="AlienCare AutoShop"
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_KEY
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aliencare_autoshop
DB_USERNAME=your_username
DB_PASSWORD=your_secure_password

# Queue
QUEUE_CONNECTION=database
# For Redis: QUEUE_CONNECTION=redis

# Cache
CACHE_DRIVER=file
# For Redis: CACHE_DRIVER=redis

# Session
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Mail (for alerts and notifications)
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-email-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Optional Settings

```env
# Redis (if using)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Logging
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

# Broadcasting (if using real-time features)
BROADCAST_DRIVER=log
```

## Testing the Deployment

### 1. Health Check

```bash
# Test the application
curl http://your-domain.com/api/health

# Expected response:
{
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-10-01T12:00:00Z"
}
```

### 2. API Tests

Use the provided Postman collection (`postman_collection.json`) to test all endpoints.

### 3. Queue Testing

```bash
# Generate a test report to verify queue processing
curl -X POST http://your-domain.com/api/reports/daily-usage \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-10-01"}'

# Check queue jobs
php artisan queue:work --once
```

## Monitoring and Maintenance

### 1. Log Monitoring

```bash
# Application logs
tail -f storage/logs/laravel.log

# Queue worker logs
tail -f storage/logs/worker.log

# Web server logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 2. Database Monitoring

```sql
-- Check database size
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'aliencare_autoshop'
GROUP BY table_schema;

-- Check table sizes
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'aliencare_autoshop'
ORDER BY (data_length + index_length) DESC;
```

### 3. Performance Monitoring

```bash
# Check PHP processes
ps aux | grep php

# Check memory usage
free -m

# Check disk space
df -h

# Monitor queue length
php artisan queue:monitor database
```

## Backup Strategy

### 1. Database Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u username -p aliencare_autoshop > /backups/aliencare_$DATE.sql
gzip /backups/aliencare_$DATE.sql

# Keep only last 30 days
find /backups -name "aliencare_*.sql.gz" -mtime +30 -delete
```

### 2. File Backup

```bash
# Backup storage and important files
tar -czf /backups/files_$DATE.tar.gz storage/ .env
```

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check storage and bootstrap/cache permissions
   - Verify .env configuration
   - Check PHP error logs

2. **Database Connection Error**
   - Verify database credentials in .env
   - Check MySQL service status
   - Test connection manually

3. **Queue Jobs Not Processing**
   - Check if queue worker is running
   - Verify database queue table exists
   - Check worker logs for errors

4. **Low Stock Alerts Not Working**
   - Verify queue worker is running
   - Check mail configuration
   - Test email settings

### Debug Commands

```bash
# Clear all caches
php artisan optimize:clear

# Check configuration
php artisan config:show

# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Test queue
php artisan queue:work --once --verbose

# Check failed jobs
php artisan queue:failed
```

## Security Checklist

- [ ] APP_DEBUG=false in production
- [ ] Strong APP_KEY generated
- [ ] Database credentials secured
- [ ] File permissions properly set
- [ ] SSL certificate installed
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Error logging configured
- [ ] Input validation in place
- [ ] CSRF protection enabled

## Support

For technical support or questions:
- Check the main README.md for API documentation
- Review Laravel documentation at https://laravel.com/docs
- Check application logs in storage/logs/
- Use the Postman collection for API testing

---

*Last updated: October 2024*
