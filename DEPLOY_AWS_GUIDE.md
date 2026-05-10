# Hướng dẫn Deploy Mini E-commerce

## Kiến trúc Deployment

### Local Development

- **Frontend**: React + Vite (localhost:5173)
- **Backend**: Node.js + Express (localhost:3001)
- **Database**: MySQL local (XAMPP/Docker)

### AWS Production

- **Frontend**: AWS Amplify (HTTPS) - Tự động deploy từ GitHub
- **Backend**: EC2 (Docker containers) - Manual deploy
- **API Gateway**: HTTPS proxy cho Backend API
- **Database**: RDS MySQL
- **Networking**: Elastic IP cho EC2, Security Groups, VPC

---

## Mục lục

### PHẦN 0: CHẠY LOCAL (Development)

### PHẦN 1: Setup Database - RDS MySQL

### PHẦN 2: Deploy Backend - EC2 với Docker

### PHẦN 3: Setup API Gateway - HTTPS Proxy

### PHẦN 4: Deploy Frontend - Amplify với GitHub

### PHẦN 5: Build và Push Docker Image

### PHẦN 6: Quy trình Update Code

### PHẦN 7: Troubleshooting & Best Practices

---

# PHẦN 0: CHẠY LOCAL (Development)

## 🎯 Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **MySQL**: 8.0 (XAMPP hoặc MySQL Server)
- **npm** hoặc **yarn**
- **Git**

## 📦 Option 1: Chạy với XAMPP/MySQL Local (Khuyên dùng cho Dev)

### Bước 1: Setup Database

#### 1.1. Khởi động XAMPP

```powershell
# Mở XAMPP Control Panel
# Start Apache và MySQL
```

#### 1.2. Tạo Database

1. Mở **phpMyAdmin**: http://localhost/phpmyadmin
2. Tạo database: `ecommerce_db`
3. Import file SQL:
   - Click **Import** tab
   - Chọn file `ecommerce_db_updated.sql` (ở thư mục root)
   - Click **Go**

✅ Database local đã sẵn sàng!

### Bước 2: Setup Backend

#### 2.1. Tạo file `.env` trong thư mục backend

```bash
cd backend
```

Tạo file `.env`:

```env
NODE_ENV=development
PORT=3001

# Database Local (XAMPP default)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=        # Để trống nếu dùng XAMPP mặc định
DB_NAME=ecommerce_db

# JWT Config
ACCESS_TOKEN_SECRET=your-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Upload path
UPLOAD_DIR=uploads
```

#### 2.2. Cài đặt và chạy Backend

```powershell
cd backend
npm install
npm run dev
```

✅ Backend chạy tại: **http://localhost:3001**  
✅ Test API: http://localhost:3001/api/v1/health

### Bước 3: Setup Frontend

#### 3.1. Tạo file `.env` trong thư mục frontend

```bash
cd frontend
```

Tạo file `.env`:

```env
# API Backend URL (local)
VITE_API_BASE=http://localhost:3001/api/v1

# App Config
VITE_APP_NAME=Mini E-commerce
VITE_APP_VERSION=1.0.0
```

#### 3.2. Cài đặt và chạy Frontend

```powershell
cd frontend
npm install
npm run dev
```

✅ Frontend chạy tại: **http://localhost:5173**

### Bước 4: Truy cập ứng dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **phpMyAdmin**: http://localhost/phpmyadmin

### Bước 5: Test kết nối

#### Test Backend

```powershell
# Test health endpoint
curl http://localhost:3001/api/v1/health

# Nếu có response JSON → Backend OK
```

#### Test Database

```powershell
# Mở browser: http://localhost/phpmyadmin
# Chọn database: ecommerce_db
# Xem tables: users, products, categories, orders...
```

#### Test Frontend

```
1. Mở http://localhost:5173
2. Register tài khoản mới
3. Login
4. Browse products
5. Add to cart
```

---

## 🐳 Option 2: Chạy với Docker (Production-like)

### Bước 1: Chuẩn bị

```powershell
cd c:\Users\Lenovo\Downloads\mini-ecommerce
```

### Bước 2: Chạy toàn bộ stack với Docker Compose

```powershell
# Chạy MySQL + Backend + Frontend
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop tất cả
docker-compose down
```

### Bước 3: Import database vào MySQL container

```powershell
# Copy SQL file vào container
docker cp ecommerce_db_updated.sql mini-ecommerce-db:/tmp/

# Import
docker exec -i mini-ecommerce-db mysql -uroot -proot ecommerce_db < ecommerce_db_updated.sql
```

### Bước 4: Truy cập

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MySQL**: localhost:3306
- **phpMyAdmin**: http://localhost:8080 (nếu có trong docker-compose)

---

# PHẦN 1: DEPLOY DATABASE (RDS)

## Tổng quan

Deploy MySQL database lên AWS RDS để có database production ổn định, backup tự động, và dễ scale.

## Bước 1: Tạo RDS MySQL Instance

### 1.1. Tạo Database trên AWS Console

1. Vào **RDS Console**: https://console.aws.amazon.com/rds
2. Click **"Create database"**
3. Cấu hình như sau:

**Engine options:**

- Engine type: **MySQL**
- Engine version: **MySQL 8.0.35** (hoặc latest)

**Templates:**

- **Free tier** (cho testing)
- Hoặc **Production** (cho production thật)

**Settings:**

- DB instance identifier: `ecommerce-demo-db` (hoặc tên bạn muốn)
- Master username: `admin`
- Master password: `23062004Hung` (hoặc password mạnh hơn)
- Confirm password

**DB instance class:**

- **db.t3.micro** (Free tier eligible)
- Hoặc **db.t3.small** (nếu cần performance cao hơn)

**Storage:**

- Storage type: **General Purpose SSD (gp2)**
- Allocated storage: **20 GB**
- ✅ Enable storage autoscaling: **Yes** (max: 100 GB)

**Connectivity:**

- Compute resource: **Don't connect to an EC2 compute resource** (setup manual sau)
- VPC: **Default VPC** (hoặc VPC bạn đang dùng)
- Public access: **Yes** ⚠️ (để EC2 và local có thể kết nối)
- VPC security group: **Create new** → Tên: `ecommerce-rds-sg`
- Availability Zone: **No preference**

**Database authentication:**

- **Password authentication**

**Additional configuration:**

- Initial database name: `ecommerce_db` ✅ (Quan trọng! Tạo database mặc định)
- Backup retention: **7 days** (hoặc theo nhu cầu)
- ✅ Enable automated backups
- ✅ Enable deletion protection (cho production)

4. Click **"Create database"**
5. Chờ 5-10 phút để RDS khởi tạo
6. Status chuyển thành **"Available"** → Hoàn tất

### 1.2. Lưu thông tin kết nối

Sau khi RDS tạo xong:

1. Click vào DB instance → Tab **"Connectivity & security"**
2. Lưu lại:
   - **Endpoint**: `ecommerce-database.cliq0q60m2dqap-southeast-1.rds.amazonaws.com`
   - **Port**: `3306`
   - **Master username**: `admin`
   - **Password**: `23062004Hung`

### 1.3. Cấu hình Security Group cho RDS

**Cho phép EC2 và máy local kết nối vào RDS:**

1. Vào **RDS Console** → Chọn database → Tab **"Connectivity & security"**
2. Click vào **VPC security groups** (ví dụ: `ecommerce-rds-sg`)
3. Tab **"Inbound rules"** → **"Edit inbound rules"** → **"Add rule"**

**Thêm các rules sau:**

| Type         | Protocol | Port | Source    | Description                       |
| ------------ | -------- | ---- | --------- | --------------------------------- |
| MySQL/Aurora | TCP      | 3306 | 0.0.0.0/0 | Allow from anywhere (dev/testing) |

⚠️ **Security Note:**

- `0.0.0.0/0` cho phép kết nối từ bất kỳ IP nào (tốt cho dev/testing)
- Cho production thật, nên giới hạn: `xx.xx.xx.xx/32` (IP EC2) hoặc chỉ Security Group của EC2

4. Click **"Save rules"**

### 1.4. Test kết nối từ máy local

**Cài MySQL Client (nếu chưa có):**

```powershell
# Windows: Download MySQL Workbench hoặc dùng MySQL từ XAMPP
# Test connection:
mysql -h ecommerce-database.cliq0q60m2dqap-southeast-1.rds.amazonaws.com -u admin -p23062004Hung
```

✅ Nếu connect thành công → RDS OK

### 1.5. Import Database Schema và Data

**Option 1: Từ máy local**

```powershell
cd c:\Users\Lenovo\Downloads\mini-ecommerce

# Import database
mysql -h ecommerce-database.cliq0q60m2dqap-southeast-1.rds.amazonaws.com -u admin -p23062004Hung ecommerce_db < ecommerce_db_updated.sql
```

**Option 2: Từ EC2 (sau khi tạo EC2)**

```bash
# Cài MySQL client trên EC2
sudo yum install mariadb105 -y

# Import
mysql -h ecommerce-database.cliq0q60m2dqap-southeast-1.rds.amazonaws.com -u admin -p23062004Hung ecommerce-database < ecommerce_db_updated.sql
```

### 1.6. Verify Database

```bash
# Kết nối vào RDS
mysql -h ecommerce-database.cliq0q60m2dq.ap-southeast-1.rds.amazonaws.com -u admin -p23062004Hung ecommerce-database

# Kiểm tra tables
SHOW TABLES;

# Kiểm tra data
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM users;
```

✅ Database RDS đã sẵn sàng cho production!

---

# PHẦN 2: DEPLOY BACKEND (EC2 với Docker)

## Tổng quan

Deploy Backend Node.js application lên EC2 instance sử dụng Docker containers để dễ quản lý và scale.

## Bước 1: Tạo EC2 Instance

### 1.1. Launch Instance

1. Vào **EC2 Console**: https://console.aws.amazon.com/ec2
2. Click **"Launch Instance"**
3. Cấu hình:

**Name and tags:**

- Name: `ecommerce-backend`

**Application and OS Images (AMI):**

- **Amazon Linux 2023 AMI** (Free tier eligible)
- Architecture: **64-bit (x86)**

**Instance type:**

- **t2.micro** (Free tier) - 1 vCPU, 1 GB RAM
- Hoặc **t3.small** (Production) - 2 vCPU, 2 GB RAM

**Key pair (login):**

- Click **"Create new key pair"** (nếu chưa có)
  - Key pair name: `ecommerce-key`
  - Key pair type: **RSA**
  - Private key format: **.pem** (Linux/Mac/PowerShell) hoặc **.ppk** (PuTTY)
  - Download và lưu file `.pem` an toàn

**Network settings:**

- VPC: **Default VPC**
- Subnet: **No preference** (hoặc public subnet)
- Auto-assign public IP: **Enable** ✅
- Firewall (security groups): **Create security group**
  - Security group name: `ecommerce-backend-sg`
  - Description: `Security group for ecommerce backend`

**Configure storage:**

- **8 GB gp3** (Free tier)
- Hoặc **20 GB gp3** (nếu cần lưu nhiều data/logs)

4. Click **"Launch instance"**
5. Chờ instance khởi động (~1-2 phút)
6. Status: **Running** ✅

### 1.2. Cấu hình Security Group cho EC2

1. Vào **EC2 Console** → **Security Groups**
2. Chọn security group `ecommerce-backend-sg`
3. Tab **"Inbound rules"** → **"Edit inbound rules"**
4. **Add rules:**

| Type       | Protocol | Port | Source    | Description                   |
| ---------- | -------- | ---- | --------- | ----------------------------- |
| SSH        | TCP      | 22   | My IP     | SSH from my IP                |
| Custom TCP | TCP      | 3001 | 0.0.0.0/0 | Backend API (for API Gateway) |
| HTTP       | TCP      | 80   | 0.0.0.0/0 | HTTP (optional)               |
| HTTPS      | TCP      | 443  | 0.0.0.0/0 | HTTPS (optional)              |

5. Click **"Save rules"**

### 1.3. ⚠️ QUAN TRỌNG: Tạo Elastic IP (IP cố định)

**Tại sao cần Elastic IP?**

- EC2 mặc định có Public IP động → Mỗi lần stop/start sẽ đổi IP
- API Gateway integration cần IP cố định
- Elastic IP = IP tĩnh, không đổi

**Cách tạo:**

1. **EC2 Console** → Menu trái → **Network & Security** → **Elastic IPs**
2. Click **"Allocate Elastic IP address"**
3. Network border group: **ap-southeast-1** (hoặc region bạn dùng)
4. Click **"Allocate"**

**Associate Elastic IP với EC2:**

1. Chọn Elastic IP vừa tạo
2. **Actions** → **"Associate Elastic IP address"**
3. Instance: Chọn `ecommerce-backend`
4. Private IP address: (để auto)
5. Click **"Associate"**

✅ **Lưu lại Elastic IP** (ví dụ: `54.255.211.151`) → Dùng cho tất cả các bước tiếp theo

💰 **Cost note:**

- Elastic IP **FREE** khi đang associate với EC2 running
- **$0.005/hour** khi Elastic IP không dùng (not associated)

## Bước 2: SSH vào EC2 và Setup môi trường

### 2.1. SSH từ Windows PowerShell

```powershell
# Di chuyển đến thư mục chứa key
cd C:\path\to\your\keys

# Set permissions (chỉ cần làm 1 lần)
icacls ecommerce-key.pem /inheritance:r
icacls ecommerce-key.pem /grant:r "$($env:USERNAME):(R)"

# SSH vào EC2 (thay YOUR-ELASTIC-IP)
ssh -i "ecommerce-key.pem" ec2-user@54.255.211.151
```

✅ Nếu thấy prompt `[ec2-user@ip-xxx]$` → SSH thành công!

### 2.2. Cài đặt Docker

```bash
# Update system packages
sudo yum update -y

# Install Docker
sudo yum install docker -y

# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Add ec2-user to docker group (để chạy docker không cần sudo)
sudo usermod -aG docker ec2-user

# Apply group changes
newgrp docker

# Verify Docker installation
docker --version
docker ps
```

### 2.3. Cài đặt Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Create symlink
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installation
docker-compose --version
```

## Bước 3: Deploy Backend Application

### 3.1. Tạo thư mục project và docker-compose.yml

```bash
# Tạo thư mục
mkdir -p ~/mini-ecommerce
cd ~/mini-ecommerce

# Tạo file docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: hungviet/mini-ecommerce-backend:latest
    container_name: ecommerce-backend
    restart: always
    ports:
      - "3001:3000"
    environment:
      NODE_ENV: production
      PORT: 3000

      # RDS Database
      DB_HOST: your-rds-endpoint.rds.amazonaws.com
      DB_PORT: 3306
      DB_USER: your-db-username
      DB_PASSWORD: your-db-password
      DB_NAME: your-db-name

      # JWT
      ACCESS_TOKEN_SECRET: your-super-secret-key-change-this-in-production
      ACCESS_TOKEN_EXPIRES_IN: 24h

      # CORS - Cho phép tất cả origins (có thể giới hạn sau)
      CORS_ORIGIN: "*"

      # S3
      S3_ACCESS_KEY_ID: "your-access-key-id"  # Thay bằng Access Key ID của bạn
      S3_SECRET_ACCESS_KEY: "your-secret-access-key"  # Thay bằng Secret Access Key của bạn
      S3_BUCKET: "your-s3-bucket-name"  # Thay bằng tên bucket S3 của bạn
      S3_REGION: "ap-southeast-1"  # Thay bằng region của bucket S3 của bạn

      # OPENAI
      OPENAI_API_KEY: "your-openai-api-key-here"
      OPENAI_MODEL: "gpt-4o-mini"
      OPENAI_BASE_URL: ""  # optional (dùng khi cần proxy/OpenAI-compatible endpoint)
      OPENAI_MAX_TOKENS: "700"
      OPENAI_TEMPERATURE: "0.3"

    volumes:
      - ./uploads:/app/uploads
    networks:
      - ecommerce-network

networks:
  ecommerce-network:
    driver: bridge
EOF
```

⚠️ **Lưu ý:**

- Thay `DB_HOST`, `DB_PASSWORD` bằng thông tin RDS của bạn
- Thay `ACCESS_TOKEN_SECRET` bằng secret key mạnh hơn
- `CORS_ORIGIN: "*"` cho phép mọi domain (dev). Production nên set: `https://your-domain.com`

### 3.2. Pull Docker Image và chạy Backend

```bash
# Pull latest image từ Docker Hub
docker-compose pull

# Start backend container
docker-compose up -d

# Xem logs


```

### 3.3. Verify Backend đang chạy

```bash
# Check container status
docker ps

# Expected output:
# CONTAINER ID   IMAGE                                    STATUS
# xxxx           hungviet/mini-ecommerce-backend:latest   Up 10 seconds

# Test API local
curl http://localhost:3001/api/v1/health

# Expected output:
# {"status":"OK","timestamp":"...","uptime":...}
```

### 3.4. Test từ bên ngoài (từ máy local)

```powershell
# Test API qua Elastic IP (thay YOUR-ELASTIC-IP)
curl http://54.255.211.151:3001/api/v1/health

# Expected output: {"status":"OK",...}
```

✅ Backend đã chạy thành công trên EC2!

## Bước 4: Troubleshooting

### Lỗi: "Connection refused" khi test từ ngoài

**Nguyên nhân:** Security Group chưa mở port 3001
**Giải pháp:** Kiểm tra lại Security Group inbound rules (Bước 1.2)

### Lỗi: "Database connection failed"

**Nguyên nhân:** Backend không kết nối được RDS
**Kiểm tra:**

```bash
# Test DNS resolution
nslookup ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com

# Test connection to RDS
telnet ecommerce-demo-db.ctuwm0uoadoe.ap-southeast-1.rds.amazonaws.com 3306

# Check backend logs
docker logs ecommerce-backend
```

**Giải pháp:** Kiểm tra RDS Security Group cho phép EC2 connect (port 3306)

### Container bị restart liên tục

```bash
# Xem logs chi tiết
docker logs ecommerce-backend --tail 100

# Xem resource usage
docker stats
```

## Bước 5: Optional - Setup SSL với Nginx (Advanced)

Nếu muốn có HTTPS trực tiếp trên EC2 thay vì qua API Gateway:

```bash
# Cài Nginx
sudo amazon-linux-extras install nginx1 -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Cài Certbot cho Let's Encrypt
sudo yum install certbot python3-certbot-nginx -y

# Cấu hình Nginx reverse proxy
sudo nano /etc/nginx/conf.d/ecommerce.conf

# Nội dung:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Restart Nginx
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

# PHẦN 3: SETUP API GATEWAY (HTTPS Proxy)

# PHẦN 3: SETUP API GATEWAY (HTTPS Proxy)

## Tổng quan

API Gateway làm HTTPS proxy cho Backend EC2:

- Frontend (Amplify HTTPS) → API Gateway (HTTPS) → Backend EC2 (HTTP)
- Giải quyết Mixed Content error
- Cung cấp SSL/TLS encryption
- Rate limiting và caching (nếu cần)

## Bước 1: Tạo HTTP API

### 1.1. Create API

1. Vào **API Gateway Console**: https://console.aws.amazon.com/apigateway
2. Click **"Create API"**
3. Chọn **"HTTP API"** → Click **"Build"**

### 1.2. Add Integration

1. Click **"Add integration"**
2. Cấu hình:
   - Integration type: **HTTP**
   - Integration method: **ANY**
   - URL endpoint: `http://54.255.211.151:3001/{proxy}` ⚠️ (Thay bằng Elastic IP của bạn)
   - Integration name: `ecommerce-backend` (tự động tạo)

3. Click **"Next"**

### 1.3. Configure routes

1. **API name**: `ecommerce-api`
2. **Routes**: Giữ mặc định
   - Method: **ANY**
   - Resource path: `/{proxy+}`
   - Integration: `ecommerce-backend` (auto selected)

3. Click **"Next"**

### 1.4. Configure stages

1. Stage name: **$default** (mặc định, tự động deploy)
2. Auto-deploy: **✅ Enabled**
3. Click **"Next"**

### 1.5. Review and create

1. Review cấu hình
2. Click **"Create"**

## Bước 2: Lấy API Gateway URL

1. Sau khi create, vào **API Gateway Console** → Chọn API `ecommerce-api`
2. Sidebar → Click **"Stages"** → Chọn **"$default"**
3. Copy **Invoke URL**:
   ```
   https://xxxxxxxxxx.execute-api.ap-southeast-1.amazonaws.com
   ```

✅ Đây là HTTPS URL dùng cho Frontend!

## Bước 3: Test API Gateway

### 3.1. Test health endpoint

```powershell
# Test health check (thay YOUR-API-URL)
curl https://xxxxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/api/v1/health

# Expected output:
# {"status":"OK","timestamp":"..."}
```

### 3.2. Test full path

```bash
# Test products endpoint
curl https://xxxxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/api/v1/products

# Test auth endpoint
curl -X POST https://xxxxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

✅ Nếu các API trả về dữ liệu → API Gateway hoạt động!

## Bước 4: ⚠️ Cập nhật Integration khi IP thay đổi

**Khi nào cần:**

- EC2 stop/start và IP đổi (nếu không dùng Elastic IP)
- Chuyển sang EC2 instance mới
- Update backend lên server khác

**Cách cập nhật:**

1. **API Gateway Console** → Chọn API `ecommerce-api`
2. Sidebar → **"Routes"**
3. Click vào route **ANY /{proxy+}**
4. Click vào integration (phần **"Attached integration"**)
5. Click **"Edit"**
6. Update **URL endpoint**: `http://NEW-ELASTIC-IP:3001/{proxy}`
7. Click **"Save"**

✅ Changes tự động deploy do Auto-deploy enabled!

## Bước 5: Configure CORS (nếu cần)

**API Gateway HTTP API tự động handle CORS**, nhưng nếu gặp lỗi CORS:

1. **API Gateway Console** → API `ecommerce-api`
2. Sidebar → **"CORS"**
3. Click **"Configure"**
4. Cấu hình:
   - Access-Control-Allow-Origin: `*` (hoặc `https://yourdomain.com`)
   - Access-Control-Allow-Headers: `*`
   - Access-Control-Allow-Methods: `*`
   - Max age: `300`
5. Click **"Save"**

## Bước 6: Monitoring và Logging (Optional)

### 6.1. Enable CloudWatch Logs

1. **API Gateway Console** → API → **"Stages"** → **$default**
2. Tab **"Logs"**
3. Enable **CloudWatch Logs**:
   - Log format: **CLF** hoặc **JSON**
   - Log level: **INFO** hoặc **ERROR**
4. Click **"Save"**

### 6.2. View Logs

1. **CloudWatch Console**: https://console.aws.amazon.com/cloudwatch
2. **Logs** → **Log groups**
3. Tìm log group: `/aws/apigateway/ecommerce-api`

## Troubleshooting

### Error: 502 Bad Gateway

**Nguyên nhân:**

- Backend EC2 không chạy
- Security Group block kết nối
- Sai IP trong Integration URL

**Kiểm tra:**

```bash
# Test backend trực tiếp
curl http://54.255.211.151:3001/api/v1/health

# Check backend container
ssh ec2-user@54.255.211.151
docker ps
docker logs ecommerce-backend
```

### Error: 503 Service Unavailable

**Nguyên nhân:** Backend timeout hoặc crash
**Kiểm tra:** Backend logs và restart nếu cần

### Error: CORS Policy blocked

**Giải pháp:**

1. Check Backend CORS config trong `.env`: `CORS_ORIGIN=*`
2. Configure CORS trong API Gateway (Bước 5)
3. Restart backend

---

# PHẦN 4: DEPLOY FRONTEND (AMPLIFY với GitHub)

# PHẦN 4: DEPLOY FRONTEND (AMPLIFY với GitHub)

## Tổng quan

AWS Amplify tự động build và deploy Frontend React từ GitHub repository:

- Auto deploy khi push code lên GitHub
- Built-in CI/CD pipeline
- Free SSL certificate
- CDN distribution
- Custom domain support

## Bước 1: Push Code lên GitHub

### 1.1. Tạo GitHub Repository

1. Vào https://github.com/new
2. Repository name: `mini-ecommerce`
3. Description: `Mini E-commerce full-stack application`
4. Privacy: **Public** hoặc **Private**
5. Click **"Create repository"**

### 1.2. Push code từ local

```powershell
# Di chuyển vào thư mục project
cd c:\Users\Lenovo\Downloads\mini-ecommerce

# Initialize Git (nếu chưa có)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Mini E-commerce project"

# Set branch name
git branch -M main

# Add remote repository (thay YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/mini-ecommerce.git

# Push to GitHub
git push -u origin main
```

✅ Code đã được push lên GitHub!

## Bước 2: Tạo App trên AWS Amplify

### 2.1. Create Amplify App

1. Vào **AWS Amplify Console**: https://console.aws.amazon.com/amplify
2. Click **"Get started"** → Chọn **"Amplify Hosting"**
3. Click **"Get started"** dưới "Deploy with Amplify Hosting"

### 2.2. Connect to GitHub

1. Chọn Git provider: **GitHub**
2. Click **"Continue"**
3. **Authorize AWS Amplify** để access GitHub repos
4. Chọn repository: `mini-ecommerce`
5. Chọn branch: `main`
6. Click **"Next"**

### 2.3. Turn off auto build

1. **Amplify Console** → App
2. **App settings** → **General**
3. **Branch** → Edit
4. Toggle **"Enable auto build"** → OFF
5. Save

### 2.4. Advanced Settings - Environment Variables

Click **"Advanced settings"** (expand)

Thêm environment variables:

| Key                | Value                                                                |
| ------------------ | -------------------------------------------------------------------- |
| `VITE_API_BASE`    | `https://xxxxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/api/v1` |
| `VITE_APP_NAME`    | `Mini E-commerce`                                                    |
| `VITE_APP_VERSION` | `1.0.0`                                                              |

⚠️ **Thay `https://xxxxxxxxxx...`** bằng API Gateway Invoke URL của bạn (từ PHẦN 3)

### 2.5. Review and Save

1. Review tất cả cấu hình
2. Click **"Save and deploy"**
3. Amplify bắt đầu build (~3-5 phút)

### 2.6. Monitor Build Process

**Build stages:**

1. **Provision** - Tạo build environment
2. **Build** - Run build commands
3. **Deploy** - Deploy to CDN
4. **Verify** - Health check

Click vào build đang chạy để xem logs real-time.

✅ Khi hoàn thành, status: **"Deployed"** (màu xanh)

## Bước 3: Test Deployed App

### 3.1. Lấy URL

Sau khi deploy xong:

1. **Amplify Console** → App → Domain
2. Copy URL: `https://main.xxxxxxxxxxxxx.amplifyapp.com`

### 3.2. Test Application

Mở browser và test:

- ✅ Homepage loads
- ✅ Products listing (kết nối API Gateway)
- ✅ User registration/login
- ✅ Add to cart
- ✅ Checkout flow

### 3.3. Test API Connection

```powershell
# Mở DevTools Console (F12) trong browser
# Chạy command:
fetch('https://YOUR-AMPLIFY-URL.amplifyapp.com')
  .then(r => r.text())
  .then(console.log)

# Hoặc test API call
fetch('YOUR-API-GATEWAY-URL/api/v1/products')
  .then(r => r.json())
  .then(console.log)
```

## Bước 4: ⚠️ QUAN TRỌNG - Cấu hình SPA Routing (Fix 404 Error)

**Vấn đề:**

- Khi refresh trang tại `/admin/dashboard/` hoặc `/products/123`
- Browser gửi request đến server cho path đó
- Server không có file tại path đó → **404 Not Found**

**Nguyên nhân:**

- React Router xử lý routing ở client-side
- Server cần redirect mọi requests về `index.html`

**Giải pháp:**

### 4.1. Cấu hình Redirects trong Amplify

1. **Amplify Console** → App của bạn
2. Sidebar → **"Rewrites and redirects"**
3. Click **"Edit"**
4. Thêm rule:

**Rule:**

```
Source address: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>
Target address: /index.html
Type: 200 (Rewrite)
```

**Giải thích:**

- Regex match tất cả routes KHÔNG phải static files
- Rewrite (200) về `/index.html` thay vì redirect (301/302)
- React Router sẽ handle routing phía client

**Hoặc rule đơn giản hơn:**

```
Source address: /<*>
Target address: /index.html
Type: 200 (Rewrite)
```

5. Click **"Save"**

### 4.3. Test SPA Routing

Sau khi redeploy:

```
1. Vào https://YOUR-APP.amplifyapp.com/admin/dashboard/
2. Nhấn F5 (hard refresh)
3. ✅ Trang load thành công (không còn 404)
```

## Bước 5: Configure Custom Domain (Optional)

### 5.1. Add Domain to Amplify

1. **Amplify Console** → App → **"Domain management"**
2. Click **"Add domain"**
3. Nhập domain: `yourdomain.com`
4. Click **"Configure domain"**
5. Chọn subdomains:
   - ✅ `yourdomain.com` (root)
   - ✅ `www.yourdomain.com`
6. Click **"Save"**

### 5.2. Configure DNS Records

Amplify sẽ hiển thị DNS records cần thêm. Ví dụ với **NameCheap**:

**Truy cập NameCheap:**

1. Domain List → Manage → **Advanced DNS**

**Add records:**

```
✅ VERIFICATION RECORD (for SSL):
Type: CNAME
Host: _xxxxxxxxxxxxx
Value: _yyyyyyyyyyy.acm-validations.aws.
TTL: Automatic

✅ ROOT DOMAIN:
Type: ANAME (or ALIAS)
Host: @
Value: dxxxxxxxxxxxx.cloudfront.net
TTL: Automatic

✅ WWW SUBDOMAIN:
Type: CNAME
Host: www
Value: dxxxxxxxxxxxx.cloudfront.net
TTL: Automatic
```

⚠️ **Lưu ý:**

- Copy CHÍNH XÁC values từ Amplify Console
- ANAME/ALIAS cho root domain
- CNAME cho www subdomain

### 5.3. Wait for DNS Propagation

- **DNS propagation**: 5 phút - 24 giờ
- **SSL Certificate**: Auto provision sau khi DNS verify
- **Status check:** Amplify Console → Domain management → Status

**Tools để check:**

```powershell
# Check DNS
nslookup yourdomain.com
nslookup www.yourdomain.com

# Check SSL
curl -I https://yourdomain.com
```

### 5.4. Update Environment Variables

Sau khi có custom domain, update:

**Amplify Console → Environment variables:**

```
VITE_APP_URL=https://yourdomain.com
```

**Backend CORS (EC2):**

```bash
# SSH vào EC2
ssh ec2-user@YOUR-ELASTIC-IP

# Update docker-compose.yml
nano ~/mini-ecommerce/docker-compose.yml

# Sửa:
CORS_ORIGIN: "https://yourdomain.com"

# Restart
docker-compose down && docker-compose up -d
```

### 6.3. Monitor Builds

**Amplify Console → Build history:**

- ✅ Green = Success
- 🔴 Red = Failed (click để xem logs)
- 🟡 Yellow = In progress

## Troubleshooting

### Build Failed - "Module not found"

**Nguyên nhân:** Missing dependencies
**Giải pháp:**

```bash
# Check package.json
cd frontend
npm install
npm run build  # Test local

# Commit package-lock.json
git add package-lock.json
git commit -m "fix: update dependencies"
git push origin main
```

### Build Success but App shows blank page

**Kiểm tra:**

1. Browser Console (F12) → Xem errors
2. Check `VITE_API_BASE` environment variable
3. Check API Gateway CORS
4. Verify build artifacts: `frontend/dist/index.html` exists

### CORS Error

**Nguyên nhân:** API Gateway hoặc Backend CORS config sai
**Giải pháp:**

1. Check Backend `.env`: `CORS_ORIGIN=*`
2. Configure CORS trong API Gateway (PHẦN 3, Bước 5)
3. Restart backend

### SSL Certificate Pending

**Nguyên nhân:** DNS verification chưa xong
**Giải pháp:**

1. Wait 2-24 hours
2. Check DNS records: `nslookup _verification-record.yourdomain.com`
3. Verify CNAME records chính xác

---

# PHẦN 5: Setup CI/CD

## Bước 1: Chuẩn bị Docker Hub

### 1.1. Tạo Docker Hub Account (nếu chưa có)

1. Vào https://hub.docker.com/signup
2. Đăng ký account
3. Verify email

### 1.2. Tạo Repository

1. Login vào Docker Hub
2. Click **"Create Repository"**
3. Name: `mini-ecommerce-backend`
4. Visibility: **Public** (hoặc Private nếu cần)
5. Click **"Create"**

✅ Repository URL: `docker.io/YOUR-USERNAME/mini-ecommerce-backend`

### 1.3. Login Docker từ máy local

```powershell
# Login to Docker Hub
docker login

# Nhập username và password
# Expected: "Login Succeeded"
```

## Bước 2: Add secret cho github actions

1. Vào GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Thêm secrets:
   | Name | Value | Description |
   |------|-------|-------------|
   | DOCKER_USERNAME | your-dockerhub-username | Docker Hub username |
   | DOCKER_TOKEN | your-dockerhub-token | Docker Hub token (use personal access token) |
   | AMPLIFY_APP_ID | your-amplify-app-id | Amplify App ID (from Amplify Console) |
   | AWS_ACCESS_KEY_ID | your-aws-access-key-id | AWS Access Key ID |
   | AWS_REGION | your-aws-region | AWS Region |
   | AWS_SECRET_ACCESS_KEY | your-aws-secret-access-key | AWS Secret Access Key |
   | EC2_HOST | your-ec2-host | EC2 Host |
   | EC2_SSH_KEY | your-ec2-ssh-key | EC2 SSH Key |
   | EC2_USER | your-ec2-user | EC2 User Name |

## Bước 3: Logic CI/CD Workflow

Dưới đây là mô tả cập nhật cho CI/CD theo trạng thái hiện tại của repository (`.github/workflows`).

- Workflow (file: `ci-cd.yml`)
  - Kích hoạt: `push` / `pull_request` (có `paths`) và `workflow_dispatch`.
  - `paths` chính: `backend/**`, `frontend/**`, `.github/workflows/ci-cd.yml`.
  - Bên trong workflow có job `changes` (dùng `dorny/paths-filter`) để xác định scope thay đổi:
    - `backend` thay đổi khi có thay đổi trong `backend/**` (hoặc chính file workflow).
    - `frontend` thay đổi khi có thay đổi trong `frontend/**` (hoặc chính file workflow).

- CI Backend (job: `ci-backend`)
  - Chạy khi `workflow_dispatch` hoặc khi `changes` báo có thay đổi backend.
  - Hành vi:
    - Setup Node + cache npm (`backend/package-lock.json`).
    - Chạy lint backend.
    - Chạy test backend với MySQL service (`mysql:8.0`) và `npm test`.

- CI Frontend (job: `ci-frontend`)
  - Chạy khi `workflow_dispatch` hoặc khi `changes` báo có thay đổi frontend.
  - Hành vi:
    - Setup Node + cache npm (`frontend/package-lock.json`).
    - Chạy lint, `test:ci`, và build frontend.

- CD Backend (job: `cd-backend`)
  - Chỉ chạy khi:
    - `push` lên `main`,
    - `ci-backend` thành công,
    - và scope backend có thay đổi.
  - Hành vi:
    - Login Docker Hub (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).
    - Build + push backend image (tags: `${{ github.sha }}` và `latest`).
    - SSH vào EC2 (`EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`) để pull + restart backend bằng Docker Compose.

- CD Frontend (job: `cd-frontend`)
  - Chỉ chạy khi:
    - `push` lên `main`,
    - `ci-frontend` thành công,
    - và scope frontend có thay đổi.
  - Hành vi:
    - Cấu hình AWS credentials.
    - Gọi `aws amplify start-job --job-type RELEASE` để trigger Amplify build/release từ repository.

Secrets / Variables cần thiết

- GitHub Actions (Repository secrets / variables):
  - `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (push image; token cần quyền write/push)
  - `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` (SSH deploy)
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (Amplify / AWS CLI)
  - `AMPLIFY_APP_ID` (deploy target)
  - `API_GATEWAY_URL` (inject vào build for frontend, nếu cần)
  - DB / S3 / JWT secrets cho backend (ví dụ `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `ACCESS_TOKEN_SECRET`, ...)

Lưu ý về trigger CD

- Quan hệ phụ thuộc dùng `needs`:
  - `cd-backend` phụ thuộc `ci-backend`.
  - `cd-frontend` phụ thuộc `ci-frontend`.
- Thay đổi `backend/**` → chạy nhánh job backend (CI + CD backend nếu là push main).
- Thay đổi `frontend/**` → chạy nhánh job frontend (CI + CD frontend nếu là push main).
- Thay đổi cả hai → cả hai nhánh backend/frontend cùng chạy.
- `workflow_dispatch` dùng để chạy CI thủ công; các job CD vẫn chỉ deploy khi là `push` trên `main`.

Kiểm tra & debugging nhanh

- Xem logs CI: GitHub Actions → chọn run → xem job logs.
- Nếu backend image push bị 401: kiểm tra `DOCKERHUB_TOKEN` có quyền push vào repo.
- Nếu SSH timeout hoặc `No such file or directory`: kiểm tra `EC2_HOST`, security group cho phép SSH, và đường dẫn repo trên EC2.
- Nếu gặp lỗi `docker compose -f` trên EC2: server có thể chỉ có `docker-compose` cũ hoặc chỉ có plugin `docker compose` — deploy script đã kiểm tra cả hai và sẽ dùng lệnh phù hợp.
- Nếu Amplify trả lỗi `Operation not supported` khi gọi `create-deployment`, thì app đang connect repo; trong cấu hình hiện tại CD gọi `start-job` thay vì upload zip.

Tóm tắt ngắn các bước deploy thủ công (nếu cần):

1. Push code lên `main` (hoặc chạy `workflow_dispatch`) → workflow `ci-cd.yml` chạy.
2. Nếu có thay đổi backend và `ci-backend` success → `cd-backend` build/push image rồi SSH deploy lên EC2.
3. Nếu có thay đổi frontend và `ci-frontend` success → `cd-frontend` trigger Amplify release (`start-job`).

Nếu bạn muốn tôi thêm mẫu `workflow_dispatch` snippet, ví dụ secrets, hoặc hướng dẫn test trigger bằng `gh workflow run`, tôi sẽ thêm vào mục này.

---

# PHẦN 7: TROUBLESHOOTING & BEST PRACTICES

## 🔥 Common Issues & Solutions

### Issue 1: Mixed Content Error (HTTPS → HTTP)

**Error:**

```
Mixed Content: The page at 'https://...' was loaded over HTTPS,
but requested an insecure resource 'http://...'. This request has been blocked.
```

**Nguyên nhân:** Frontend (HTTPS) gọi Backend (HTTP)

**Giải pháp:**
✅ Dùng API Gateway làm HTTPS proxy (đã setup ở PHẦN 3)
✅ Update `VITE_API_BASE` thành API Gateway HTTPS URL

### Issue 2: CORS Policy Blocked

**Error:**

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Kiểm tra:**

```bash
# 1. Backend CORS config
ssh ec2-user@YOUR-ELASTIC-IP
cat ~/mini-ecommerce/docker-compose.yml | grep CORS_ORIGIN

# Should be: CORS_ORIGIN: "*" hoặc "https://your-domain.com"
```

**Giải pháp:**

```bash
# Update backend environment variable
nano ~/mini-ecommerce/docker-compose.yml

# Set:
CORS_ORIGIN: "*"

# Restart
docker-compose down && docker-compose up -d
```

**+ Configure API Gateway CORS (PHẦN 3, Bước 5)**

### Issue 3: 404 Not Found khi Refresh SPA Routes

**Error:** Refresh `/products/123` → 404

**Nguyên nhân:** Server không có file tại path đó

**Giải pháp:** Configure Redirects trong Amplify (PHẦN 4, Bước 4)

### Issue 4: Database Connection Failed

**Error:**

```
ERROR: Can't connect to MySQL server on 'xxx.rds.amazonaws.com'
```

**Kiểm tra:**

```bash
# 1. RDS Security Group cho phép EC2 connect
# AWS Console → RDS → Security group → Inbound rules
# Port 3306 mở cho EC2 security group hoặc 0.0.0.0/0

# 2. Test connection từ EC2
ssh ec2-user@YOUR-ELASTIC-IP
telnet RDS-ENDPOINT 3306

# 3. Check backend logs
docker logs ecommerce-backend
```

**Giải pháp:**

- Update RDS Security Group inbound rules
- Verify DB credentials trong docker-compose.yml

### Issue 5: API Gateway 502 Bad Gateway

**Error:** API Gateway returns 502

**Nguyên nhân:**

- Backend EC2 không chạy
- Security Group block port 3001
- Sai IP trong Integration URL

**Kiểm tra:**

```bash
# Test backend trực tiếp
curl http://YOUR-ELASTIC-IP:3001/api/v1/health

# Check container
ssh ec2-user@YOUR-ELASTIC-IP
docker ps
docker logs ecommerce-backend
```

**Giải pháp:**

- Restart backend: `docker-compose up -d`
- Update API Gateway Integration URL nếu IP đổi
- Check EC2 Security Group port 3001 open

### Issue 6: Amplify Build Failed

**Error:** Build fails với errors

**Common causes:**

```
1. Module not found → Missing dependencies
2. Build command failed → Wrong build config
3. Timeout → Build quá lâu (> 15 phút)
```

**Giải pháp:**

```bash
# 1. Test build local
cd frontend
npm install
npm run build

# 2. Commit package-lock.json
git add package-lock.json
git commit -m "fix: lock dependencies"
git push origin main

# 3. Check Amplify build logs
# Amplify Console → Build history → Click build → View logs
```

### Issue 7: Images/Uploads không hiển thị

**Nguyên nhân:** Upload path không persist khi container restart

**Giải pháp:**

```bash
# Verify volume mount trong docker-compose.yml
volumes:
  - ./uploads:/app/uploads

# Check upload directory exists
ssh ec2-user@YOUR-ELASTIC-IP
ls -la ~/mini-ecommerce/uploads/

# Set permissions
chmod -R 755 ~/mini-ecommerce/uploads/
```

## 🎯 Best Practices

### Security

✅ **Never commit sensitive data**

```bash
# .gitignore should include:
.env
.env.local
.env.example
*.pem
*.key
```

✅ **Use strong passwords**

- RDS password: Minimum 16 characters
- JWT secret: Random generated string

✅ **Restrict CORS in production**

```bash
# Development: CORS_ORIGIN=*
# Production: CORS_ORIGIN=https://yourdomain.com
```

✅ **Restrict Security Groups**

```
# RDS: Only allow EC2 security group
# EC2: Only allow API Gateway, SSH from your IP
```

✅ **Enable RDS Encryption**

- Storage encryption at rest
- SSL/TLS for connections

### Performance

✅ **Enable Caching**

- API Gateway caching cho GET requests
- CloudFront CDN (Amplify tự động có)
- Redis/ElastiCache cho session/data (advanced)

✅ **Optimize Docker Images**

```dockerfile
# Use Alpine Linux (smaller size)
FROM node:18-alpine

# Multi-stage builds
FROM node:18-alpine as build
# ... build steps
FROM node:18-alpine as production
COPY --from=build ...
```

✅ **Database Indexing**

```sql
-- Add indexes cho slow queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
```

### Monitoring

✅ **Enable CloudWatch Logs**

- API Gateway logs
- EC2 logs (via CloudWatch agent)
- RDS slow query logs

✅ **Setup Alarms**

```
- EC2 CPU > 80%
- RDS connections > 90% of max
- API Gateway 5xx errors > threshold
```

✅ **Regular Backups**

- RDS automated backups (enabled by default)
- Manual snapshots trước major updates
- Export important data định kỳ

### Cost Optimization

💰 **Free Tier Resources**

```
- EC2: t2.micro (750 hours/month free first 12 months)
- RDS: db.t2.micro (750 hours/month free first 12 months)
- Amplify: Free tier includes build minutes + hosting
- API Gateway: 1M requests/month free first 12 months
```

💰 **Stop EC2 khi không dùng**

```bash
# Stop instance (giữ data, không charge EC2 compute)
aws ec2 stop-instances --instance-ids i-xxxxx

# Start lại khi cần
aws ec2 start-instances --instance-ids i-xxxxx
```

⚠️ **Lưu ý:** Release Elastic IP khi không dùng để tránh phí

💰 **RDS Snapshots before terminate**

```bash
# Take snapshot
aws rds create-db-snapshot \
  --db-instance-identifier ecommerce-demo-db \
  --db-snapshot-identifier ecommerce-backup-$(date +%Y%m%d)
```

## 📞 Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Docker Hub**: https://hub.docker.com/
- **Amplify Documentation**: https://docs.amplify.aws/
- **GitHub Issues**: Create issues trong repo của bạn

---

### Thêm Environment Variable

1. Trong phần **"Advanced settings"** hoặc sau khi deploy
2. Vào **"Hosting"** → **"Environment variables"** → **"Manage variables"**
3. Thêm:
   - **Key**: `VITE_API_BASE`
   - **Value**: `https://xxxxxxx.execute-api.ap-southeast-1.amazonaws.com/api/v1`
4. Click **"Save"**

### **⚠️ QUAN TRỌNG: Cấu hình Redirects cho SPA (Single Page Application)**

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

| Lỗi                   | Nguyên nhân             | Khắc phục                         |
| --------------------- | ----------------------- | --------------------------------- |
| Certificate pending   | Verification record sai | Kiểm tra lại CNAME verification   |
| Domain not accessible | DNS chưa propagate      | Chờ thêm 2-4h                     |
| SSL error             | Mixed content           | Check API calls dùng HTTPS        |
| 404 Error             | Build artifacts sai     | Kiểm tra build path trong Amplify |

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
