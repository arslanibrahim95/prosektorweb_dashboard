# Ubuntu VPS Deployment Guide

## 1. Server Preparation

### Update & Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx
```

### Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 2. Project Setup

### Clone Repository
```bash
cd /var/www
git clone https://github.com/arslanibrahim95/prosektorweb_dashboard.git
cd prosektorweb_dashboard
```

### Setup Environment
```bash
cp .env.example .env
nano .env
```

Required variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SITE_TOKEN_SECRET=$(openssl rand -base64 32)
CUSTOM_JWT_SECRET=$(openssl rand -base64 32)
TRUSTED_PROXY_COUNT=1
```

---

## 3. Build & Run

```bash
# Build Docker images
docker compose build

# Start services
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

---

## 4. Nginx & SSL Setup

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/prosektorweb
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/prosektorweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL (Let's Encrypt)
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 5. Firewall (UFW)
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw enable
```

---

## 6. Deployment Script

Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull origin main

echo "Building and starting containers..."
docker compose build
docker compose up -d

echo "Deployment complete!"
docker compose logs -f --tail=50
```

```bash
chmod +x deploy.sh
```

---

## 7. Monitoring

### Check logs
```bash
docker compose logs -f api
docker compose logs -f web
```

### Restart services
```bash
docker compose restart
```

### Stop services
```bash
docker compose down
```

---

## Quick Deploy Command

After initial setup, simply run:
```bash
cd /var/www/prosektorweb_dashboard
./deploy.sh
```
