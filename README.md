# FreelanceHub – One Platform, Multiple Skills, Unlimited Opportunities

> **A full-stack, multi-category freelancing marketplace web application combining Fiverr (direct service purchases) and Upwork (project proposal bidding) business models, featuring an integrated simulated escrow payment workflow and multi-skill freelancer architecture.**

Developed as a comprehensive **B.Tech Web Technologies Case Study**.

---

## 🚀 Key Highlights & Business Model

FreelanceHub is designed for freelancers from **all professional industries**, not just IT:
- **Developers & Programmers**: Web, Mobile, Cloud, Full-stack
- **Creative & Design**: Logo designers, Brand identity, 3D animators, Video editors
- **Education & Training**: STEM tutors, Exam preparation, Language instructors
- **Audio & Media**: Music composers, Voice-over artists, Sound engineers
- **Professional Services**: Chartered Accountants, Business consultants, Fashion stylists

### Dual Marketplace Workflows:
1. **Fiverr-Style Direct Service Purchases**:
   - Freelancers create service listings with **Basic, Standard, and Premium** packages.
   - Clients directly purchase packages, specify project requirements, and pay into **simulated escrow**.
   - Freelancers deliver completed files; clients review, request revisions, or approve.
   - Upon client approval, escrow is released to the freelancer's wallet minus platform commission (configurable, default 10%).
   - Client and freelancer leave 1–5 star reviews and feedback.

2. **Upwork-Style Custom Project Postings & Proposals**:
   - Clients post projects with detailed briefs, skills required, deadline, and fixed/hourly budgets.
   - Multi-stage **milestones** can be added to divide payments.
   - Freelancers submit custom proposals with bid prices and delivery days.
   - Clients review, compare, and accept proposals.
   - Accepting a proposal creates a dedicated **Project Workspace** with milestones tracking, direct chat, work submission, revisions, and payout releases.

---

## 🛠 Technology Stack

### Frontend
- **HTML5 & CSS3**: Modern responsive UI with CSS variables, sleek glassmorphic touches, and card layouts.
- **JavaScript**: Core scripting.
- **AngularJS (1.8.x)**: Main frontend Single Page Application (SPA) framework (`ngRoute`, `ngAnimate`, HTTP auth interceptors, data binding).
- **jQuery (3.7.1)**: Modal controls, DOM utilities, and form validations.
- **Bootstrap 5 (5.3.3) & Bootstrap Icons**: Responsive grid system, navigation, tabs, pills, modals, and iconography.

### Backend
- **Node.js & Express.js**: RESTful API backend architecture with modular routing, controllers, and central error handling.
- **JWT (JSON Web Tokens)**: Secure stateless authentication with role-based authorization (`client`, `freelancer`, `admin`).
- **bcryptjs**: Salted password hashing (passwords never stored in plain-text).
- **Multer**: Secure multipart file upload management for deliverables, briefs, and avatars.

### Database
- **MongoDB & Mongoose ORM**:
  - Full relational modeling across 17 collections (`users`, `freelancerProfiles`, `clientProfiles`, `categories`, `services`, `projects`, `proposals`, `orders`, `payments`, `wallets`, `transactions`, `withdrawalRequests`, `messages`, `reviews`, `notifications`, `disputes`, `systemSettings`).
  - **Zero-Config Fallback**: Built-in support for both local/Atlas MongoDB (`MONGO_URI`) and an automatic in-memory MongoDB fallback via `mongodb-memory-server` so that the app runs out-of-the-box without requiring manual database installations.

### Payments & Financials
- **Razorpay Test Mode Integration**:
  - Test order generation and HMAC SHA256 signature verification.
  - **Simulated Escrow & Payment Hold Workflow**: Client funds are held in platform escrow until work is delivered and approved.
  - **Freelancer Wallet**: Tracks available balance, pending escrow balance, total lifetime earnings, and withdrawal requests.
  - **Configurable Platform Commission**: Default 10% commission, dynamically adjustable from the Admin Dashboard.

---

## 🌟 Unique Features

1. **Multi-Skill Freelancers**: Freelancers can provide multiple types of services under one account across diverse categories.
2. **Smart Freelancer Matching**: Recommends talent based on category, skills, target hourly budget, and rating score.
3. **Profile Completion Indicator**: Dynamic progress percentage bar motivating freelancers to complete profiles, portfolios, and skills.
4. **Freelancer Availability Status**: Live status badge (`Available`, `Busy`, `Unavailable`).
5. **Interactive Budget Estimator**: Interactive calculator that estimates project budgets, duration, and recommended tiers based on complexity and expertise.
6. **Saved / Bookmarked Freelancers**: Clients can save freelancers to their dashboard for future hiring.
7. **Side-by-Side Service Comparison**: Compare 2–3 services side-by-side (packages, delivery days, prices, and features).
8. **Milestone Payments**: Divide projects into incremental funded stages.
9. **Dispute & Complaint Management**: Dispute reporting system with admin arbitration and status updates.
10. **Verified Freelancer Badge**: Official verified badge issued by admins to vetted professionals.

---

## 👥 Pre-Configured Test Accounts

The platform automatically seeds sample accounts with diverse skills, services, projects, and transactions upon first start:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@freelancehub.com` | `admin123` | System Administrator with full access |
| **Client 1** | `client@freelancehub.com` | `client123` | Neha Verma (Verma Media & Ventures) |
| **Client 2** | `rajesh.client@freelancehub.com` | `client123` | Rajesh Singhania (Singhania Innovations) |
| **Freelancer 1** | `freelancer@freelancehub.com` | `freelancer123` | Aarav Sharma (Senior Full-Stack Developer) |
| **Freelancer 2** | `priya.design@freelancehub.com` | `freelancer123` | Priya Patel (Brand Identity & Logo Designer) |
| **Freelancer 3** | `rohan.video@freelancehub.com` | `freelancer123` | Rohan Verma (Video Editor & 3D Animator) |
| **Freelancer 4** | `ananya.tutor@freelancehub.com` | `freelancer123` | Dr. Ananya Sen (STEM & Online Tutor) |
| **Freelancer 5** | `suresh.finance@freelancehub.com` | `freelancer123` | Suresh Iyer (CA & Financial Modeler) |
| **Freelancer 6** | `vikram.audio@freelancehub.com` | `freelancer123` | Vikram Joshi (Voice-Over & Music Producer) |

*Tip: The Login page also includes one-click "Quick-Fill" buttons for Client, Freelancer, and Admin for quick demonstration.*

---

## 📁 Project Directory Structure

```text
FreelanceHub/
│
├── frontend/                     # AngularJS 1.x Single Page Application
│   ├── index.html                # Master HTML template (Navbar, SPA view, Modals, Footer)
│   ├── css/
│   │   └── style.css             # Custom design system & responsive styling
│   ├── js/
│   │   └── app.js                # AngularJS app module, routing, JWT interceptor, guards
│   ├── services/
│   │   ├── authService.js        # Authentication & profile state
│   │   ├── dataService.js        # REST API client for categories, services, projects, etc.
│   │   └── paymentService.js     # Razorpay checkout & simulated escrow
│   ├── controllers/
│   │   ├── HomeController.js
│   │   ├── AuthController.js
│   │   ├── ServicesController.js
│   │   ├── ServiceDetailController.js
│   │   ├── FreelancersController.js
│   │   ├── FreelancerDetailController.js
│   │   ├── ProjectController.js
│   │   ├── WorkspaceController.js
│   │   ├── OrderDetailController.js
│   │   ├── ClientDashboardController.js
│   │   ├── FreelancerDashboardController.js
│   │   ├── AdminDashboardController.js
│   │   ├── MessagesController.js
│   │   ├── BudgetEstimatorController.js
│   │   └── ServiceCompareController.js
│   ├── views/                    # AngularJS HTML partial templates
│   │   ├── home.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── forgot-password.html
│   │   ├── reset-password.html
│   │   ├── services.html
│   │   ├── service-detail.html
│   │   ├── create-service.html
│   │   ├── freelancers.html
│   │   ├── freelancer-profile.html
│   │   ├── projects.html
│   │   ├── project-detail.html
│   │   ├── post-project.html
│   │   ├── client-dashboard.html
│   │   ├── freelancer-dashboard.html
│   │   ├── admin-dashboard.html
│   │   ├── workspace.html
│   │   ├── order-detail.html
│   │   ├── messages.html
│   │   ├── budget-estimator.html
│   │   ├── compare-services.html
│   │   ├── how-it-works.html
│   │   └── about.html
│   └── assets/
│       └── images/               # Vector logos, avatars, service graphics
│
├── backend/                      # Node.js Express Backend
│   ├── config/
│   │   ├── db.js                 # Database connection & memory fallback
│   │   ├── razorpay.js           # Razorpay SDK & signature verification
│   │   └── seed.js               # Initial seed data (25 categories, demo users, orders)
│   ├── models/                   # 17 Mongoose schemas
│   │   ├── User.js
│   │   ├── FreelancerProfile.js
│   │   ├── ClientProfile.js
│   │   ├── Category.js
│   │   ├── Service.js
│   │   ├── Project.js
│   │   ├── Proposal.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── Wallet.js
│   │   ├── Transaction.js
│   │   ├── WithdrawalRequest.js
│   │   ├── Message.js
│   │   ├── Review.js
│   │   ├── Notification.js
│   │   ├── Dispute.js
│   │   └── SystemSetting.js
│   ├── controllers/              # Business logic controllers
│   ├── routes/                   # Express REST route handlers
│   ├── middleware/               # JWT auth guard, file upload, error handler
│   ├── uploads/                  # Uploaded user deliverables & avatars
│   └── server.js                 # Express server bootstrap
│
├── package.json                  # Dependencies & scripts
├── .env                          # Local environment secrets
├── .env.example                  # Environment configuration template
└── README.md                     # Documentation
```

---

## ⚡ Installation & Execution Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher, v20+ recommended)
- [npm](https://www.npmjs.com/)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
A `.env` file is pre-configured. If needed, customize values:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/freelancehub
JWT_SECRET=freelancehub_super_secret_jwt_key_2025_academic
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=rzp_test_FreelanceHubDemoKey
RAZORPAY_KEY_SECRET=rzp_test_FreelanceHubDemoSecret
DEFAULT_PLATFORM_COMMISSION=10
```
*(Note: If no external MongoDB daemon is running locally, the server seamlessly switches to an embedded in-memory MongoDB instance with zero manual setup required).*

### Step 3: Run the Application
```bash
npm start
```
The server will output:
```text
=======================================================
  FreelanceHub Server Running on http://localhost:5000
  Environment: development
=======================================================
```

### Step 4: Open in Your Browser
Visit:
```text
http://localhost:5000
```

---

## 🧪 Testing the Core Workflows

### 1. Test Fiverr-Style Direct Service Purchase:
1. Log in as a client using `client@freelancehub.com` / `client123` (or click the "Client" quick-fill button on the login page).
2. Go to **Explore Services** and click on any service (e.g. *Modern Full-Stack Web App*).
3. Select a package (Basic, Standard, or Premium) and click **Continue to Checkout**.
4. The Razorpay Test Checkout modal will open. Confirm the payment.
5. The order is created and funds are placed in **simulated escrow**.
6. Log out and log in as the freelancer (`freelancer@freelancehub.com` / `freelancer123`).
7. Open **Active Orders** on the Freelancer Dashboard, open the order, and upload delivery files.
8. Log back in as the client, review the delivered work, and click **Approve & Release Payment**.
9. The order completes, the platform commission (10%) is deducted, and the freelancer's wallet balance increases.

### 2. Test Upwork-Style Project Bidding & Workspace:
1. As a client, click **Post a Project**. Fill in title, description, category, skills, and budget. Click Submit.
2. Log in as a freelancer, navigate to **Projects**, find the posted project, and submit a proposal with your bid amount and cover letter.
3. Log in as the client, open the project, review the received proposal, and click **Accept & Hire**.
4. The project enters the **Workspace** (`/workspace/:id`).
5. Collaborate in real time: track milestones, send workspace messages, and release milestone payouts upon delivery.

### 3. Test Admin Oversight:
1. Log in as the admin (`admin@freelancehub.com` / `admin123`).
2. Explore the **Admin Dashboard**:
   - View real-time platform statistics and commission revenues.
   - Manage user accounts: toggle Active/Suspended status or award the **Verified Freelancer Badge**.
   - Manage categories: add, edit, or remove from the 25 categories.
   - Review and process pending **Freelancer Withdrawal Requests** (simulating UPI/Bank payouts).
   - Adjust global **Platform Commission Percentage** (e.g. 12%).
   - Arbitrate open complaints and dispute tickets.

---

## 📄 License
This project is open-source and intended for academic demonstrations and full-stack software engineering assessments.
