# EMR Simulation Deployment Guide

This guide provides step-by-step instructions for deploying the EMR simulation system across different hosting environments.

## Table of Contents
1. [Shared Web Hosting](#shared-web-hosting)
2. [Docker on VPS](#docker-on-vps)
3. [Security Configuration](#security-configuration)
4. [Custom Domain Setup](#custom-domain-setup)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Shared Web Hosting

### Prerequisites
- Access to cPanel or similar hosting control panel
- FTP/SFTP credentials
- Ability to create .htaccess files

### Step 1: Upload Files

**Using cPanel File Manager:**
1. Log into your cPanel account
2. Navigate to **File Manager**
3. Go to `public_html` directory (or your web root)
4. Create a new folder: `emr-sim`
5. Upload `emr-sim.html` to this folder
6. Upload `.htaccess` file (for password protection)

**Using FTP Client (e.g., FileZilla):**
1. Connect to your hosting server using SFTP
   - Host: `ftp.yourdomain.com`
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 22 (SFTP) or 21 (FTP)
2. Navigate to `public_html/emr-sim/`
3. Upload `emr-sim.html`
4. Upload `.htaccess` and `.htpasswd` files

### Step 2: Set File Permissions

```bash
# Recommended permissions
emr-sim.html  → 644 (rw-r--r--)
.htaccess     → 644 (rw-r--r--)
.htpasswd     → 644 (rw-r--r--)
```

### Step 3: Create Password Protection

**Generate .htpasswd file:**

Option A - Using online tool:
1. Visit https://htpasswdgenerator.net/
2. Enter username: `training`
3. Enter password: (your secure password)
4. Copy the generated line
5. Create `.htpasswd` file with this content

Option B - Using command line (if you have SSH access):
```bash
htpasswd -c /home/username/public_html/emr-sim/.htpasswd training
# Enter password when prompted
```

**Create .htaccess file:**
```apache
AuthType Basic
AuthName "EMR Simulation - Authorized Access Only"
AuthUserFile /home/username/public_html/emr-sim/.htpasswd
Require valid-user

# Prevent directory listing
Options -Indexes

# Custom error pages
ErrorDocument 401 "Authentication Required"
ErrorDocument 403 "Access Forbidden"
```

### Step 4: Access the Application

Navigate to: `https://yourdomain.com/emr-sim/emr-sim.html`

You'll be prompted for username and password.

### Step 5: Create robots.txt

In your web root (`public_html`), create or edit `robots.txt`:
```
User-agent: *
Disallow: /emr-sim/
```

---

## Docker on VPS

### Prerequisites
- VPS with Docker installed
- SSH access to VPS
- Basic knowledge of Linux commands

### Step 1: Prepare the VPS

Connect to your VPS:
```bash
ssh username@your-vps-ip
```

Install Docker (if not already installed):
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

### Step 2: Create Project Directory

```bash
mkdir -p ~/emr-simulation
cd ~/emr-simulation
```

### Step 3: Upload Files

**Option A - Using SCP:**
```bash
# From your local machine:
scp emr-sim.html username@your-vps-ip:~/emr-simulation/
```

**Option B - Create file directly:**
```bash
# On VPS:
nano emr-sim.html
# Paste content, save with Ctrl+X, Y, Enter
```

### Step 4: Create Dockerfile

```bash
cd ~/emr-simulation
nano Dockerfile
```

Paste this content:
```dockerfile
FROM nginx:alpine

# Copy the EMR simulation file
COPY emr-sim.html /usr/share/nginx/html/index.html

# Copy nginx configuration if using custom config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

Save and exit (Ctrl+X, Y, Enter).

### Step 5: Create nginx.conf (Optional - for custom configuration)

```bash
nano nginx.conf
```

```nginx
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Basic authentication
    auth_basic "EMR Simulation Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        
        # Disable caching for the simulation
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        expires -1;
    }

    # Logging
    access_log /var/log/nginx/emr-access.log;
    error_log /var/log/nginx/emr-error.log;
}
```

### Step 6: Create .htpasswd for Docker

```bash
# Install htpasswd utility if needed
sudo apt install apache2-utils

# Create password file
htpasswd -c htpasswd training
# Enter password when prompted
```

Update Dockerfile to include password file:
```dockerfile
FROM nginx:alpine

COPY emr-sim.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY htpasswd /etc/nginx/.htpasswd

EXPOSE 80
```

### Step 7: Create docker-compose.yml (Recommended)

```bash
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  emr-sim:
    build: .
    container_name: emr-simulation
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - TZ=Australia/Brisbane
    volumes:
      # Optional: mount logs directory
      - ./logs:/var/log/nginx
    networks:
      - emr-network

networks:
  emr-network:
    driver: bridge
```

### Step 8: Build and Run

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 9: Access the Application

Navigate to: `http://your-vps-ip:8080`

### Step 10: Configure Firewall

```bash
# Allow port 8080
sudo ufw allow 8080/tcp
sudo ufw reload
```

---

## Security Configuration

### SSL/TLS with Let's Encrypt (Docker)

Install Certbot and obtain certificate:

```bash
# Install Certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d emr.yourdomain.com
```

Update docker-compose.yml:
```yaml
version: '3.8'

services:
  emr-sim:
    build: .
    container_name: emr-simulation
    ports:
      - "443:443"
      - "80:80"
    restart: unless-stopped
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf
      - ./logs:/var/log/nginx
```

Create nginx-ssl.conf:
```nginx
server {
    listen 80;
    server_name emr.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name emr.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/emr.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/emr.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    auth_basic "EMR Simulation Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

### IP Whitelisting

**For nginx (Docker):**
```nginx
# Add to nginx.conf
geo $allowed_ip {
    default 0;
    192.168.1.0/24 1;  # Your hospital network
    10.0.0.0/8 1;      # VPN network
}

server {
    # ... existing config ...
    
    if ($allowed_ip = 0) {
        return 403;
    }
}
```

**For Apache (.htaccess):**
```apache
Order Deny,Allow
Deny from all
Allow from 192.168.1.0/24
Allow from 10.0.0.0/8
```

---

## Custom Domain Setup

### DNS Configuration

Add A record in your DNS settings:
```
Type: A
Name: emr (or your subdomain)
Value: Your-VPS-IP
TTL: 3600
```

### Reverse Proxy with Nginx (Recommended for production)

Install nginx on VPS (outside Docker):
```bash
sudo apt install nginx
```

Create reverse proxy configuration:
```bash
sudo nano /etc/nginx/sites-available/emr-sim
```

```nginx
server {
    listen 80;
    server_name emr.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/emr-sim /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Add SSL:
```bash
sudo certbot --nginx -d emr.yourdomain.com
```

---

## Monitoring and Maintenance

### Docker Container Management

```bash
# View logs
docker-compose logs -f emr-sim

# Restart container
docker-compose restart

# Stop container
docker-compose down

# Update application
# 1. Edit emr-sim.html
# 2. Rebuild and restart:
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View resource usage
docker stats emr-simulation
```

### Backup Strategy

```bash
# Create backup script
nano ~/backup-emr.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/username/backups/emr"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cd ~/emr-simulation

# Backup files
tar -czf $BACKUP_DIR/emr-sim-$DATE.tar.gz \
    emr-sim.html \
    docker-compose.yml \
    Dockerfile \
    nginx.conf \
    htpasswd

# Keep only last 10 backups
ls -t $BACKUP_DIR/emr-sim-*.tar.gz | tail -n +11 | xargs -r rm

echo "Backup completed: emr-sim-$DATE.tar.gz"
```

Make executable and schedule:
```bash
chmod +x ~/backup-emr.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/username/backup-emr.sh
```

---

## Troubleshooting

### Common Issues

**1. Cannot access the application**
```bash
# Check if container is running
docker ps

# Check logs
docker logs emr-simulation

# Test locally
curl http://localhost:8080
```

**2. Authentication not working**
```bash
# Verify .htpasswd file exists
docker exec emr-simulation cat /etc/nginx/.htpasswd

# Test authentication
curl -u training:password http://localhost:8080
```

**3. Port already in use**
```bash
# Find what's using port 8080
sudo lsof -i :8080

# Change port in docker-compose.yml
# ports:
#   - "8081:80"  # Use different port
```

**4. Permission denied errors**
```bash
# Fix file permissions
chmod 644 emr-sim.html
chmod 644 .htpasswd

# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

**5. SSL certificate errors**
```bash
# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Performance Optimization

**Enable gzip compression (nginx):**
```nginx
http {
    gzip on;
    gzip_types text/html text/css application/javascript;
    gzip_min_length 1000;
}
```

**Browser caching for static resources:**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Security Checklist

- [ ] Password protection enabled (.htaccess or nginx auth)
- [ ] Strong passwords used (minimum 12 characters)
- [ ] HTTPS/SSL certificate installed and configured
- [ ] Firewall rules configured to allow only necessary ports
- [ ] IP whitelisting configured (if applicable)
- [ ] robots.txt prevents search engine indexing
- [ ] Directory listing disabled
- [ ] Regular security updates applied to server
- [ ] Access logs monitored for suspicious activity
- [ ] Backup strategy implemented and tested
- [ ] Only fictional/de-identified patient data used

---

## Support Commands Reference

```bash
# Docker
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose restart            # Restart services
docker-compose logs -f            # View logs
docker-compose ps                 # List containers
docker-compose build --no-cache   # Rebuild without cache

# Nginx
sudo nginx -t                     # Test configuration
sudo systemctl reload nginx       # Reload nginx
sudo systemctl status nginx       # Check status
sudo tail -f /var/log/nginx/error.log  # View errors

# SSL/Certbot
sudo certbot renew                # Renew certificates
sudo certbot certificates         # List certificates
sudo certbot delete               # Remove certificate

# Firewall
sudo ufw status                   # Check firewall status
sudo ufw allow 80/tcp             # Allow HTTP
sudo ufw allow 443/tcp            # Allow HTTPS
sudo ufw reload                   # Reload firewall
```

---

## Next Steps

1. Test the deployment thoroughly with different browsers
2. Verify password protection works correctly
3. Test on different devices (desktop, tablet, mobile)
4. Train staff on accessing the simulation system
5. Create user documentation for your institution
6. Schedule regular backups
7. Plan for regular updates to patient scenarios

For additional help, consult your hospital's IT department or contact the system administrator.
