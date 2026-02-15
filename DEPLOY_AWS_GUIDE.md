# Hướng dẫn Deploy Mini E-commerce lên AWS

## Kiến trúc
- **Frontend**: AWS Amplify (HTTPS)
- **Backend**: EC2 (Docker) + API Gateway (HTTPS proxy)
- **Database**: RDS MySQL

---
PHẦN 1: Deploy Database (RDS)
PHẦN 2: Deploy Backend (EC2)
PHẦN 3: Deploy Frontend (Amplify)
PHẦN 4: Build và Push Docker Image
PHẦN 5: Thông tin cấu hình
PHẦN 6: Troubleshooting
PHẦN 7: Commands Cheat Sheet

# PHẦN 1: DEPLOY DATABASE (RDS)

## Bước 1: Tạo RDS MySQL Instance

### 1.1. Tạo Database
1. Vào **RDS Console**: https://console.aws.amazon.com/rds
2. Click **"Create database"**
3. Cấu hình:
   - Engine: **MySQL 8.0**
   - Template: **Free tier** (hoặc Production)
   - DB instance identifier: `ecommerce-demo-db`
   - Master username: `admin`
   - Master password: `23062004Hung`
   - DB instance class: **db.t3.micro** (Free tier)
   - Storage: **20 GB gp2**
   - Public access: **Yes** (để EC2 có thể kết nối)
4. Click **"Create database"**

### 1.2. Cấu hình Security Group cho RDS
1. Vào RDS → Chọn database → **"Connectivity & security"**
2. Click vào **Security group**
3. **Inbound rules** → **Edit** → **Add rule**:
   - Type: **MySQL/Aurora**
   - Port: **3306**
   - Source: **Security group của EC2** hoặc **0.0.0.0/0** (cho test)
4. Save

### 1.3. Tạo Database và Import Data
Từ EC2 hoặc máy local có MySQL client:

```bash
# Cài MySQL client (trên Amazon Linux)
sudo yum install mariadb105 -y

# Tạo database
mysql -h ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com -u admin -p23062004Hung -e "CREATE DATABASE ecommerce_db;"

# Import data
mysql -h ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com -u admin -p23062004Hung ecommerce_db < ecommerce_db_updated.sql
```

---

# PHẦN 2: DEPLOY BACKEND (EC2)

## Bước 1: Tạo EC2 Instance

### 1.1. Launch Instance
1. Vào **EC2 Console**: https://console.aws.amazon.com/ec2
2. Click **"Launch Instance"**
3. Cấu hình:
   - Name: `ecommerce-backend`
   - AMI: **Amazon Linux 2023**
   - Instance type: **t2.micro** (Free tier)
   - Key pair: Tạo mới hoặc chọn existing
   - Network: Chọn VPC và subnet (public subnet)
   - Auto-assign public IP: **Enable**
4. Click **"Launch instance"**

### 1.2. Cấu hình Security Group cho EC2
1. Vào EC2 → **Security Groups** → Chọn security group của EC2
2. **Inbound rules** → **Edit** → Add rules:
   | Type | Port | Source |
   |------|------|--------|
   | SSH | 22 | My IP |
   | Custom TCP | 3001 | 0.0.0.0/0 |
   | HTTP | 80 | 0.0.0.0/0 |
   | HTTPS | 443 | 0.0.0.0/0 |
3. Save

### 1.3. **⚠️ QUAN TRỌNG: Tạo Elastic IP (IP cố định)**
**Vấn đề**: EC2 mỗi lần stop/start sẽ đổi IP → API Gateway bị lỗi

**Giải pháp**: 
1. **EC2 Console** → **Network & Security** → **Elastic IPs**
2. Click **"Allocate Elastic IP address"** → **"Allocate"**  
3. Chọn Elastic IP → **"Actions"** → **"Associate Elastic IP address"**
4. Chọn EC2 instance → **"Associate"**
5. ✅ **Copy Elastic IP** (cố định) → Dùng cho steps tiếp theo

**Lưu ý**: Elastic IP **FREE** khi đang associate với EC2 running, **$0.005/hour** khi không dùng.

## Bước 2: SSH vào EC2 và cài đặt

### 2.1. SSH vào EC2
```powershell
ssh -i "C:\path\to\your-key.pem" ec2-user@54.255.211.151
```

### 2.2. Cài Docker
```bash
# Cập nhật hệ thống
sudo yum update -y

# Cài Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Logout và login lại
exit
```

### 2.3. Cài Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Bước 3: Deploy Backend

### 3.1. Tạo thư mục và file docker-compose
```bash
mkdir -p ~/mini-ecommerce && cd ~/mini-ecommerce

cat > docker-compose.yml << 'EOF'
services:
  backend:
    image: hungviet/mini-ecommerce-backend:latest
    container_name: ecommerce-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com
      DB_PORT: 3306
      DB_USER: admin
      DB_PASSWORD: 23062004Hung
      DB_NAME: ecommerce_db
      ACCESS_TOKEN_SECRET: your-secret-key
      ACCESS_TOKEN_EXPIRES_IN: 24h
      CORS_ORIGIN: "*"
    ports:
      - "3001:3000"
    volumes:
      - ./uploads:/app/uploads
EOF
```

### 3.2. Pull và chạy
```bash
docker-compose pull
docker-compose up -d
```

### 3.3. Kiểm tra
```bash
docker ps
curl http://localhost:3001/api/v1/health
```

---

# PHẦN 3: DEPLOY FRONTEND (AMPLIFY)

## Bước 1: Push code lên GitHub

```bash
cd c:\Users\Lenovo\Downloads\mini-ecommerce
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mini-ecommerce.git
git push -u origin main
```

---

## Bước 2: Tạo API Gateway (HTTPS proxy cho Backend)

### 2.1. Tạo HTTP API
1. Vào **API Gateway Console**: https://console.aws.amazon.com/apigateway
2. Click **"Create API"** → Chọn **"HTTP API"** → **"Build"**
3. Click **"Add integration"**:
   - Integration type: **HTTP**
   - URL: `http://54.255.211.151:3001/{proxy}`
   - Method: **ANY**
4. API name: `ecommerce-api`
5. Click **"Next"**

### 2.2. Configure Routes
1. Method: **ANY**
2. Resource path: `/{proxy+}`
3. Integration target: chọn integration vừa tạo
4. Click **"Next"** → **"Next"** → **"Create"**

### 2.3. **⚠️ Cập nhật Integration khi EC2 IP thay đổi**
**Khi nào cần**: EC2 bị stop/start và IP đổi (nếu chưa có Elastic IP)

**Cách sửa**:
1. **API Gateway Console** → Chọn API `ecommerce-api`
2. **Routes** → `/{proxy+}` → **Integration**  
3. **Edit integration** → **URL**: `http://NEW-ELASTIC-IP:3001/{proxy}`
4. **Save** → **Deploy API** → Stage: `$default`
5. Test: `https://1zdkcn9yya.execute-api.ap-southeast-1.amazonaws.com/api/v1/health`

### 2.3. Lấy Invoke URL
1. Vào API vừa tạo → **"Stages"** → **"$default"**
2. Copy **Invoke URL**: `https://xxxxxxx.execute-api.ap-southeast-1.amazonaws.com`

### 2.4. Test API Gateway
Mở browser test:
```
https://xxxxxxx.execute-api.ap-southeast-1.amazonaws.com/api/v1/health
```

---

## Bước 3: Deploy Frontend lên Amplify

### 3.1. Tạo App trên Amplify
1. Vào **AWS Amplify Console**: https://console.aws.amazon.com/amplify
2. Click **"Create new app"** → **"Host web app"**
3. Chọn **"GitHub"** → Authorize
4. Chọn repo `mini-ecommerce`, branch `main`

### 3.2. Cấu hình Build Settings
Sửa build settings thành:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

### 3.3. Thêm Environment Variable
1. Trong phần **"Advanced settings"** hoặc sau khi deploy
2. Vào **"Hosting"** → **"Environment variables"** → **"Manage variables"**
3. Thêm:
   - **Key**: `VITE_API_BASE`
   - **Value**: `https://xxxxxxx.execute-api.ap-southeast-1.amazonaws.com/api/v1`
4. Click **"Save"**

### 3.4. **⚠️ QUAN TRỌNG: Cấu hình Redirects cho SPA (Single Page Application)**

**Vấn đề**: Khi refresh trang tại routes như `/admin/dashboard/`, sẽ bị lỗi **404 Not Found**

**Nguyên nhân**: 
- React Router xử lý routing ở client-side
- Khi refresh, browser gửi request đến server cho path đó
- Server không có file tại path đó → 404

**Giải pháp**: Cấu hình redirect tất cả requests về `index.html`

#### Cách 1: Sử dụng file amplify.yml (Khuyên dùng)
File `amplify.yml` đã được tạo sẵn ở root của repo, Amplify sẽ tự động đọc.

#### Cách 2: Cấu hình trực tiếp trong Amplify Console
1. Vào **AWS Amplify Console** → Chọn app của bạn
2. Menu trái → **"Rewrites and redirects"**
3. Click **"Edit"** → Thêm rule:

```
Source address: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>
Target address: /index.html
Type: 200 (Rewrite)
```

Hoặc đơn giản hơn:
```
Source address: /<*>
Target address: /index.html  
Type: 200 (Rewrite)
```

4. Click **"Save"**
5. **Redeploy** app để apply thay đổi

#### Test sau khi cấu hình
- Truy cập `https://pigtech.me/admin/dashboard/`
- Nhấn **F5 (refresh)**  
- ✅ Trang load thành công thay vì 404

### 3.5. Deploy
Click **"Save and deploy"**

### 3.6. Cấu hình Custom Domain với NameCheap

#### Bước 1: Thêm Domain vào Amplify
1. Vào **AWS Amplify Console** → App của bạn
2. Menu trái → **"Domain management"**
3. Click **"Add domain"**
4. Nhập domain: `pigtech.me`
5. Chọn subdomain cần setup:
   - `pigtech.me` (root domain)  
   - `www.pigtech.me` (subdomain)
6. Click **"Configure domain"**

#### Bước 2: Cấu hình DNS trên NameCheap

**2.1. Truy cập NameCheap DNS Management**
1. Đăng nhập **NameCheap** → **Domain List** 
2. Tìm domain `pigtech.me` → Click **"Manage"**
3. Tab **"Advanced DNS"**

**2.2. Xóa Records mặc định**
Xóa các records sau (nếu có):
- Parking page records
- URL Redirect records
- Default A/CNAME records

**2.3. Thêm Records theo hướng dẫn Amplify**
Amplify sẽ hiển thị DNS records cần thêm. Thêm chính xác như sau:

```
✅ VERIFICATION RECORD (cho SSL Certificate):
Type: CNAME
Host: bddd0ab2a9ba71d62b22414bc67686e3
Value: _a45e2493cf706335219e6570a0395857.jkddzztszm.acm-validations.aws.
TTL: Automatic (hoặc 1800)

✅ ROOT DOMAIN:
Type: ANAME (hoặc ALIAS nếu có)
Host: @  
Value: d111dlyhkepyw.cloudfront.net
TTL: Automatic

⚠️ Nếu NameCheap không hỗ trợ ANAME, dùng A Record:
Type: A Record
Host: @
Value: [IP từ: dig d111dlyhkepyw.cloudfront.net]

✅ WWW SUBDOMAIN:
Type: CNAME
Host: www
Value: d111dlyhkepyw.cloudfront.net  
TTL: Automatic
```

**Lưu ý quan trọng:**
- Verification record **CHỈ** dùng hostname (phần trước `.pigtech.me`) 
- CloudFront URL lấy từ Amplify Console
- Không thêm https:// hoặc trailing slash

#### Bước 3: Chờ DNS Propagation
1. **Save** tất cả records trên NameCheap
2. Quay lại **Amplify Console** → **Domain management**
3. Click **"Update domain"** hoặc chờ auto-refresh
4. Chờ 5-24h để:
   - DNS propagation hoàn tất
   - SSL certificate được verify
   - Status chuyển thành **"Available"**

#### Bước 4: Kiểm tra và Troubleshooting

**4.1. Kiểm tra DNS**
```powershell
# Kiểm tra A record
nslookup pigtech.me

# Kiểm tra CNAME  
nslookup www.pigtech.me

# Kiểm tra verification record
nslookup bddd0ab2a9ba71d62b22414bc67686e3.pigtech.me
```

**4.2. Test Website**
- ✅ `https://pigtech.me` → Frontend
- ✅ `https://www.pigtech.me` → Frontend  
- ✅ HTTP tự động redirect sang HTTPS

**4.3. Các lỗi thường gặp:**

| Lỗi | Nguyên nhân | Khắc phục |
|-----|-------------|-----------|
| Certificate pending | Verification record sai | Kiểm tra lại CNAME verification |
| Domain not accessible | DNS chưa propagate | Chờ thêm 2-4h |
| SSL error | Mixed content | Check API calls dùng HTTPS |
| 404 Error | Build artifacts sai | Kiểm tra build path trong Amplify |

**4.4. Tools hữu ích:**
- **DNS Checker**: https://dnschecker.org/
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Amplify Console Logs**: Monitor → Logs

#### Bước 5: Cập nhật Environment Variables sau khi có Custom Domain

**5.1. Cập nhật Frontend (.env)**
Sửa file `frontend/.env`:
```bash
# Thay API Gateway URL thật vào dòng này:
VITE_API_BASE=https://YOUR-REAL-API-GATEWAY-URL.execute-api.ap-southeast-1.amazonaws.com/api/v1
VITE_APP_URL=https://pigtech.me
```

**5.2. Cập nhật Backend (.env)**  
Sửa file `backend/.env`:
```bash
# Comment/uncomment theo environment:

# Development
# NODE_ENV=development
# DB_HOST=localhost

# Production (uncomment khi deploy)
NODE_ENV=production
DB_HOST=ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com
DB_PASSWORD=23062004Hung
DB_USER=admin
```

**5.3. Cập nhật Amplify Environment Variables**
Copy từ `frontend/.env` vào **Amplify Console** → **Environment variables**:
```
VITE_API_BASE=https://YOUR-API-GATEWAY-URL/api/v1
VITE_APP_URL=https://pigtech.me
VITE_APP_NAME=Mini E-commerce
VITE_APP_VERSION=1.0.0
```
Sau khi update environment variables:
1. **Amplify Console** → **Hosting** → **Build history**
2. Click **"Redeploy this version"** hoặc trigger new build
3. Chờ build complete (~3-5 phút)

**5.4. Test kết nối Frontend-Backend**
```bash
# Test API từ custom domain
curl https://pigtech.me/api/health
# hoặc
curl https://xxxxxxx.execute-api.ap-southeast-1.amazonaws.com/api/v1/health
```

#### Bước 6: Commit và Deploy Code mới

**6.1. Commit và Push lên GitHub**
```bash
# Thêm files đã cập nhật
git add frontend/.env backend/.env

# Commit changes  
git commit -m "feat: add custom domain config (simplified single .env files)"

# Push to GitHub
git push origin main
```

**6.2. Amplify sẽ tự động rebuild**
- Amplify detect GitHub push → Auto trigger new build
- Build sẽ sử dụng `.env.production` variables
- Thời gian build: ~3-5 phút

**6.3. Restart Backend với config mới**
```bash
# SSH vào EC2
ssh -i "your-key.pem" ec2-user@54.255.211.151

# Pull latest code
cd /home/ec2-user/mini-ecommerce
git pull origin main

# Restart với production config
docker-compose down
NODE_ENV=production docker-compose up -d

# Verify backend với CORS mới
curl -H "Origin: https://pigtech.me" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://54.255.211.151:3001/api/v1/health
```

#### Bước 7: Kiểm tra và Troubleshooting

**7.1. Test CORS và API Connection**
```bash
# Test API Gateway health (thay YOUR-API-URL)
curl https://1zdkcn9yya.execute-api.ap-southeast-1.amazonaws.com/api/v1/health

# Test CORS preflight từ frontend origin
curl -H "Origin: https://main.d1ymi985p9iosx.amplifyapp.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://1zdkcn9yya.execute-api.ap-southeast-1.amazonaws.com/api/v1/health
```

**7.2. Các lỗi thường gặp**

| Lỗi | Nguyên nhân | Khắc phục |
|-----|-------------|-----------|
| **CORS Policy blocked** | API Gateway integration sai IP | Cập nhật Integration URL với Elastic IP mới |
| **503 Service Unavailable** | Backend không chạy trên EC2 | SSH vào EC2, start Docker containers |
| **502 Bad Gateway** | API Gateway không reach được EC2 | Kiểm tra Security Group port 3001 |  
| **404 Not Found** | Route không match | Kiểm tra API Gateway routes config |
| **SSL Certificate pending** | DNS chưa verify | Chờ hoặc kiểm tra DNS Records |

**7.3. Commands debug**
```bash 
# Check EC2 backend status
ssh -i "key.pem" ec2-user@ELASTIC-IP
docker ps
curl localhost:3001/api/v1/health

# Check API Gateway integration
curl -v https://YOUR-API-GATEWAY-URL/api/v1/health

# Check frontend environment
# Vào Amplify Console → Environment Variables
```

**7.4. Quick Fix CORS**
Nếu gặp lỗi CORS:
1. **Kiểm tra Backend CORS config** trong `.env`
2. **Cập nhật API Gateway Integration URL** với Elastic IP mới  
3. **Deploy API Gateway** → Stage `$default`
4. **Restart EC2 backend** với config mới

---

## Bước 4: Quy trình Update Code Frontend & Backend

### 4.1. Quy trình Update hoàn chỉnh

#### **📋 Checklist trước khi update**
- [ ] Code đã test local thành công
- [ ] Database migrations (nếu có) đã chuẩn bị
- [ ] Environment variables mới đã setup
- [ ] Backup dữ liệu quan trọng (nếu cần)
- [ ] Notify users về maintenance (nếu downtime dự kiến)

#### **🔄 Quy trình Update theo thứ tự**

### **BƯỚC 1: Update Backend trước**

#### 1.1. Chuẩn bị và test local
```powershell
# Chuyển về thư mục project
cd c:\Users\Lenovo\Downloads\mini-ecommerce

# Test backend local (nếu cần)
cd backend
npm install
npm run dev

# Test endpoints quan trọng
curl http://localhost:3000/api/v1/health
```

#### 1.2. Build và Push Docker Image
```powershell
# Build image mới với tag version (recommended)
docker build -t hungviet/mini-ecommerce-backend:v1.2.0 ./backend
docker build -t hungviet/mini-ecommerce-backend:latest ./backend

# Push lên Docker Hub  
docker push hungviet/mini-ecommerce-backend:v1.2.0
docker push hungviet/mini-ecommerce-backend:latest
```

#### 1.3. Deploy lên EC2
```bash
# SSH vào EC2
ssh -i "your-key.pem" ec2-user@YOUR-ELASTIC-IP

# Backup container hiện tại (optional)
docker tag ecommerce-backend ecommerce-backend:backup-$(date +%Y%m%d)

# Pull image mới
cd ~/mini-ecommerce
docker-compose pull

# Rolling update (zero downtime)
docker-compose up -d --no-deps backend
```

#### 1.4. Verify Backend deployment
```bash
# Kiểm tra container status
docker ps
docker logs -f ecommerce-backend

# Test API
curl http://localhost:3001/api/v1/health
curl http://YOUR-ELASTIC-IP:3001/api/v1/health

# Test qua API Gateway
curl https://YOUR-API-GATEWAY-URL/api/v1/health
```

### **BƯỚC 2: Update Frontend sau khi Backend ổn định**

#### 2.1. Cập nhật Environment Variables (nếu cần)
```bash
# Cập nhật frontend/.env nếu có thay đổi API endpoints
VITE_API_BASE=https://YOUR-API-GATEWAY-URL/api/v1
VITE_APP_URL=https://pigtech.me
```

#### 2.2. Test Frontend local với Backend mới
```bash
cd frontend
npm install
npm run dev

# Test kết nối API bằng browser
# Mở http://localhost:5173 và test các features
```

#### 2.3. Deploy Frontend lên Amplify
**Phương pháp 1: Auto deploy qua GitHub**
```bash
# Commit và push code
git add .
git commit -m "feat: update frontend for v1.2.0 backend"
git push origin main

# Amplify sẽ tự động trigger build
```

**Phương pháp 2: Manual deploy**
1. Vào **Amplify Console** → Chọn app
2. **Environment variables** → Update nếu cần
3. **Deployments** → **"Redeploy this version"**

#### 2.4. Monitor Amplify Build
1. Vào **Amplify Console** → App → **"Build history"**
2. Click vào build đang chạy để xem logs
3. Chờ build complete (~3-5 phút)
4. Status: **"Deployed"** = Thành công

### **BƯỚC 3: Testing End-to-End**

#### 3.1. Test Production Environment
```bash
# Test API Gateway trực tiếp  
curl https://YOUR-API-GATEWAY-URL/api/v1/health
curl https://YOUR-API-GATEWAY-URL/api/v1/users
curl https://YOUR-API-GATEWAY-URL/api/v1/products

# Test CORS từ frontend domain
curl -H "Origin: https://pigtech.me" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://YOUR-API-GATEWAY-URL/api/v1/health
```

#### 3.2. Manual Testing trên Production
- ✅ Homepage load thành công: `https://pigtech.me`
- ✅ Products listing hiển thị data
- ✅ User authentication (login/register)
- ✅ Add to cart functionality
- ✅ Checkout process
- ✅ Admin dashboard (nếu có)

#### 3.3. Monitoring và Logs
```bash
# EC2 backend logs
ssh -i "key.pem" ec2-user@YOUR-ELASTIC-IP
docker logs -f ecommerce-backend --tail 100

# Amplify frontend logs  
# Vào Amplify Console → Monitoring → Access logs
```

### **BƯỚC 4: Rollback nếu có lỗi**

#### 4.1. Rollback Backend
```bash
# SSH vào EC2
ssh -i "key.pem" ec2-user@YOUR-ELASTIC-IP

# Option 1: Restore từ backup container
docker stop ecommerce-backend
docker run -d --name ecommerce-backend \
  --network mini-ecommerce_default \
  -p 3001:3000 \
  ecommerce-backend:backup-20260214

# Option 2: Pull version cũ
docker pull hungviet/mini-ecommerce-backend:v1.1.0
# Update docker-compose.yml với tag cũ, rồi:
docker-compose up -d
```

#### 4.2. Rollback Frontend
**Cách 1: Revert commit và push**
```bash
git log --oneline -5  # Xem commit history
git revert HEAD       # Revert commit gần nhất
git push origin main  # Amplify sẽ auto deploy
```

**Cách 2: Redeploy version cũ**
1. **Amplify Console** → **"Build history"**
2. Tìm deployment thành công gần nhất
3. Click **"Redeploy this version"**

### **BƯỚC 5: Post-deployment Tasks**

#### 5.1. Update Documentation
```bash
# Cập nhật version trong README
# Ghi lại breaking changes (nếu có)
# Update API documentation (nếu có)

git commit -m "docs: update deployment notes for v1.2.0"
git push origin main
```

#### 5.2. Tag Release (Optional but recommended)
```bash
# Tag version sau khi deploy thành công
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# Tạo GitHub Release nếu muốn
```

#### 5.3. Monitor Performance sau deploy
- ✅ Response time API có bình thường?
- ✅ Database connections stable?
- ✅ Memory/CPU usage EC2 acceptable?
- ✅ Frontend loading speed OK?

---

### **❗ Advanced: Zero-downtime deployment**

#### Blue-Green Deployment (Optional)
```bash
# Tạo container mới song song
docker run -d --name ecommerce-backend-new \
  -p 3002:3000 \
  hungviet/mini-ecommerce-backend:latest

# Test container mới
curl http://localhost:3002/api/v1/health

# Swap ports (requires load balancer)
# Hoặc update API Gateway integration từ 3001 → 3002
```

#### Database Migrations
```bash
# Nếu có schema changes
# SSH vào EC2, run migration trước khi deploy backend:

docker exec -it ecommerce-backend npm run migrate

# Hoặc chạy script migration riêng:
mysql -h RDS-HOST -u admin -pPASSWORD ecommerce_db < migrations/v1.2.0.sql
```

---

### 4.3. Quick Commands Cheat Sheet

#### Update Backend Only
```powershell
# Local
docker build -t hungviet/mini-ecommerce-backend:latest ./backend
docker push hungviet/mini-ecommerce-backend:latest

# EC2  
ssh ec2-user@ELASTIC-IP "cd ~/mini-ecommerce && docker-compose pull && docker-compose up -d"
```

#### Update Frontend Only  
```bash
git add frontend/
git commit -m "update frontend"
git push origin main
```

#### Update Both (Complete flow)
```powershell
# 1. Backend
docker build -t hungviet/mini-ecommerce-backend:latest ./backend
docker push hungviet/mini-ecommerce-backend:latest

# 2. Deploy backend
ssh ec2-user@ELASTIC-IP "cd ~/mini-ecommerce && docker-compose pull && docker-compose up -d"

# 3. Frontend
git add .
git commit -m "update: frontend + backend v1.2.0"  
git push origin main
```

---

# PHẦN 4: BUILD VÀ PUSH DOCKER IMAGE

## Build và Push lên Docker Hub

### 4.1. Đăng nhập Docker Hub
```powershell
docker login
```

### 4.2. Build Backend Image
```powershell
cd c:\Users\Lenovo\Downloads\mini-ecommerce
docker build -t hungviet/mini-ecommerce-backend:latest ./backend
```

### 4.3. Build Frontend Image (nếu cần)
```powershell
docker build -t hungviet/mini-ecommerce-frontend:latest ./frontend --build-arg VITE_API_BASE=http://[IPv4_Address_EC2]:3001/api/v1
```

### 4.4. Push Images
```powershell
docker push hungviet/mini-ecommerce-backend:latest
docker push hungviet/mini-ecommerce-frontend:latest
```

---

# PHẦN 5: THÔNG TIN CẤU HÌNH

## URLs và Endpoints hiện tại

| Service | URL/Endpoint |
|---------|--------------|
| Frontend (Amplify) | https://main.d1cl8paqwxlfg0.amplifyapp.com |
| Frontend (Custom Domain) | https://pigtech.me (sau khi setup) |
| API Gateway | https://b5kcaatdt3.execute-api.ap-southeast-1.amazonaws.com |
| Backend (EC2) | http://54.255.211.151:3001 |
| RDS Database | ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com |

## Environment Variables (Amplify)
- `VITE_API_BASE`: `https://b5kcaatdt3.execute-api.ap-southeast-1.amazonaws.com/api/v1`

### Database Credentials
- Host: `ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com`
- User: `admin`
- Password: `23062004Hung`
- Database: `ecommerce_db`

---

# PHẦN 6: TROUBLESHOOTING

### Lỗi Mixed Content (HTTPS → HTTP)
**Nguyên nhân**: Frontend (HTTPS) gọi Backend (HTTP)
**Giải pháp**: Dùng API Gateway làm HTTPS proxy

### Lỗi 404 từ API Gateway
**Kiểm tra**:
1. Integration URL đúng: `http://54.255.211.151:3001/{proxy}`
2. Route đúng: `ANY /{proxy+}`

### Lỗi Database connection
**Kiểm tra**:
1. RDS Security Group cho phép EC2 kết nối (port 3306)
2. Database `ecommerce_db` đã được tạo
3. Kiểm tra logs:
```bash
docker logs ecommerce-backend
```

### Frontend không load data mới
**Giải pháp**:
1. Redeploy Amplify
2. Hard refresh: `Ctrl + Shift + R`
3. Clear cache browser

### ⚠️ Lỗi 404 khi Refresh trang (ví dụ: /admin/dashboard/)
**Nguyên nhân**: Single Page Application (SPA) routing issue
- Khi navigate trong app (click link): React Router xử lý → OK ✅
- Khi refresh trang: Browser request trực tiếp path đó từ server → Server không có file → 404 ❌

**Giải pháp 1: Cấu hình Rewrites trong Amplify Console**
1. **AWS Amplify Console** → Chọn app → **"Rewrites and redirects"**
2. Click **"Edit"** → **"Add rule"**:
   ```
   Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>
   Target: /index.html
   Type: 200 (Rewrite)
   ```
3. **Save** → **Redeploy** app

**Giải pháp 2: Sử dụng amplify.yml (Đã có sẵn trong repo)**
- File `amplify.yml` ở root của repo đã có cấu hình này
- Amplify tự động đọc khi deploy
- Không cần config thêm gì

**Test**:
- Truy cập `https://pigtech.me/admin/dashboard/`
- Nhấn **F5 (refresh)** → Should work! ✅

### Backend container bị crash/restart
**Kiểm tra**:
```bash
# Xem status
docker ps -a

# Xem logs
docker logs ecommerce-backend

# Restart container
docker restart ecommerce-backend
```

### Không kết nối được EC2
**Kiểm tra**:
1. Security Group mở port 22 (SSH)
2. Key pair đúng
3. EC2 đang chạy

### Lỗi CORS từ API Gateway
**Nguyên nhân**: API Gateway chưa cấu hình CORS
**Giải pháp**:
1. Vào **API Gateway Console** → Chọn API
2. Menu trái → **"CORS"**
3. Click **"Configure"**:
   - **Access-Control-Allow-Origin**: `*`
   - **Access-Control-Allow-Headers**: `*` 
   - **Access-Control-Allow-Methods**: `*`
4. **Save** → **Deploy API**

### Domain không hoạt động
**Kiểm tra**:
1. DNS records đã được thêm đúng trong NameCheap
2. Certificate status = "Issued" trong Amplify
3. Đợi DNS propagation (tối đa 24h)
4. Test DNS: `nslookup pigtech.me`

### SSL Certificate pending cho pigtech.me
**Giải pháp**:
1. Vào NameCheap → pigtech.me → Advanced DNS
2. Kiểm tra CNAME record đã thêm chưa
3. Xóa hết records parking page cũ
4. Chờ AWS xác thực (có thể mất vài giờ)

---

# PHẦN 7: COMMANDS CHEAT SHEET

## EC2 Commands
```bash
# SSH vào EC2
ssh -i "key.pem" ec2-user@54.255.211.151

# Vào thư mục project
cd ~/mini-ecommerce

# Xem containers
docker ps -a

# Xem logs
docker logs -f ecommerce-backend

# Restart container
docker restart ecommerce-backend

# Pull và restart
docker-compose pull
docker-compose up -d

# Stop all
docker-compose down
```

## Local Commands (PowerShell)
```powershell
# Build và push backend
docker build -t hungviet/mini-ecommerce-backend:latest ./backend
docker push hungviet/mini-ecommerce-backend:latest

# Build và push frontend
docker build -t hungviet/mini-ecommerce-frontend:latest ./frontend
docker push hungviet/mini-ecommerce-frontend:latest

# Git push để trigger Amplify
git add .
git commit -m "Update"
git push
```

## MySQL Commands (từ EC2)
```bash
# Kết nối RDS
mysql -h ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com -u admin -p23062004Hung

# Tạo database
CREATE DATABASE ecommerce_db;

# Import SQL
mysql -h [RDS_HOST] -u admin -p[PASSWORD] ecommerce_db < file.sql
```

---

# PHẦN 8: DOMAIN VÀ CUSTOM SETUP

## Nhà cung cấp Domain khuyên dùng (cho Free Tier)

### 1. NameCheap (Khuyên dùng)
- **Giá**: ~$10-13/năm
- **Ưu điểm**: Giá rẻ, UI đơn giản, DNS management tốt
- **Domain tốt**: `.com`, `.net`, `.org`, `.xyz` (rẻ)
- **Link**: https://namecheap.com

### 2. Porkbun
- **Giá**: ~$8-12/năm  
- **Ưu điểm**: Rẻ nhất, không hidden fee
- **Domain tốt**: `.dev`, `.tech`, `.online`
- **Link**: https://porkbun.com

### 3. Route 53 (AWS)
- **Giá**: ~$12/năm + $0.50/tháng hosted zone
- **Ưu điểm**: Tích hợp hoàn toàn với AWS, setup tự động
- **Nhược điểm**: Đắt hơn một chút

## Setup DNS cho pigtech.me (NameCheap)

Vào NameCheap Dashboard → **pigtech.me** → **"Manage"** → **"Advanced DNS"**

**Xóa records cũ:**
- Parking page
- URL Redirect Records (nếu có)

**Thêm records mới:**
```
Type: A Record
Host: @
Value: [IP từ Amplify Console]
TTL: Automatic

Type: CNAME Record  
Host: www
Value: [CloudFront domain từ Amplify]
TTL: Automatic
```

**Ví dụ cụ thể sau khi lấy thông tin từ Amplify:**
```
A Record: @ → 76.76.21.21 (ví dụ)
CNAME: www → d1abc123xyz.cloudfront.net
```

**Lưu ý Free Tier:**
- Domain phải tự mua ($8-15/năm)
- SSL Certificate: **MIỄN PHÍ** 
- Amplify Hosting: **MIỄN PHÍ** (1000 build minutes/tháng)
- Route 53: **MIỄN PHÍ** (1 hosted zone đầu tiên)

