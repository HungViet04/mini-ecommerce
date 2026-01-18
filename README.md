# 🛍️ Mini E-Commerce Platform

> Website bán hàng mini với đầy đủ tính năng, triển khai trên nền tảng AWS

---

## 🌟 Mô tả dự án

**Mini E-Commerce** là hệ thống thương mại điện tử hoàn chỉnh, được xây dựng theo mô hình Client-Server với các tính năng:

### Tính năng người dùng (Customer)
- 🔐 Đăng ký, đăng nhập với JWT authentication
- 📦 Xem danh sách sản phẩm, tìm kiếm, lọc theo danh mục
- 🛒 Quản lý giỏ hàng (thêm, xóa, cập nhật số lượng)
- 📋 Đặt hàng, xem lịch sử đơn hàng, hủy đơn

### Tính năng quản trị (Admin)
- 📊 Dashboard thống kê
- ➕ Quản lý sản phẩm (CRUD)
- 📁 Quản lý danh mục
- 📈 Quản lý đơn hàng, cập nhật trạng thái
- 👥 Quản lý người dùng

### Phân quyền
| Vai trò | Quyền hạn |
|---------|-----------|
| **Guest** | Xem sản phẩm, đăng ký, đăng nhập |
| **Customer** | Guest + Giỏ hàng, đặt hàng, xem đơn hàng |
| **Admin** | Full quyền quản lý hệ thống |

---

## 🔧 Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 5.x | Web framework |
| **MySQL** | 8.0 | Relational database |
| **JWT** | - | Authentication |
| **bcryptjs** | 3.x | Password hashing |
| **mysql2** | 3.x | MySQL driver với Promise |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **React** | 18.x | UI library |
| **Vite** | 5.x | Build tool & dev server |
| **Context API** | - | State management |
| **CSS Variables** | - | Theming & styling |

### DevOps & Deployment
| Công nghệ | Mục đích |
|-----------|----------|
| **Docker** | Containerization |
| **AWS EC2** | Backend hosting |
| **AWS RDS** | Managed MySQL |
| **AWS S3** | Static file hosting |
| **AWS CloudFront** | CDN |
| **AWS Route 53** | DNS management |

---
### Mô tả luồng hoạt động:
1. **User** truy cập domain → **Route 53** phân giải DNS
2. **CloudFront** phân phối React app từ **S3 Bucket**
3. API requests → **Application Load Balancer** → **EC2** (Node.js)
4. Backend xử lý logic, truy vấn **RDS MySQL**
5. Hình ảnh sản phẩm lưu trên **S3 Bucket** riêng
6. **CloudWatch** giám sát và logging


### Yêu cầu hệ thống
- **Node.js** 18+
- **MySQL** 8.0+
- **npm** hoặc **yarn**


### Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| **Admin** | admin@example.com | admin123 |


## 🎨 Design Patterns

### Backend Architecture
- **Layered Architecture**: Controller → Service → Repository
- **Repository Pattern**: Tách biệt data access logic
- **Singleton Pattern**: Database connection pool
- **Middleware Pattern**: Request processing pipeline
- **Custom Error Classes**: Centralized error handling

### Frontend Architecture
- **Component-Based**: Reusable UI components
- **Context + Provider**: Global state (Auth, Cart)
- **Custom Hooks**: Reusable stateful logic
- **Service Layer**: API abstraction

---

## 📄 License

MIT License - Sử dụng tự do cho mục đích học tập và thương mại.

---

<div align="center">
  Made with ❤️ for learning full-stack development
  <br>
  <strong>Mini E-Commerce Platform</strong>
</div>
