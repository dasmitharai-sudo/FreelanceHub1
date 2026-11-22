const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const SystemSetting = require('../models/SystemSetting');
const Dispute = require('../models/Dispute');

const categoriesList = [
  { name: 'Web Development', icon: 'bi-code-slash', description: 'Full-stack web apps, WordPress, eCommerce, APIs, and responsive design.' },
  { name: 'App Development', icon: 'bi-phone', description: 'Native & cross-platform iOS and Android mobile applications.' },
  { name: 'Graphic Designing', icon: 'bi-palette', description: 'Social media graphics, brochures, posters, packaging, and brand identity.' },
  { name: 'Logo Designing', icon: 'bi-vector-pen', description: 'Custom logo concepts, vector graphics, typography, and brand books.' },
  { name: 'Content Writing', icon: 'bi-pencil-square', description: 'SEO blog posts, website copywriting, technical docs, and storytelling.' },
  { name: 'Copywriting', icon: 'bi-megaphone', description: 'High-converting sales copy, email campaigns, ad copy, and landing pages.' },
  { name: 'Photography', icon: 'bi-camera', description: 'Product photography, portrait shoots, event coverage, and photo retouching.' },
  { name: 'Video Editing', icon: 'bi-film', description: 'YouTube editing, reels, cinematic color grading, vlogs, and corporate videos.' },
  { name: 'Animation', icon: 'bi-play-circle', description: '2D/3D character animation, motion graphics, explainer videos, and VFX.' },
  { name: 'Education and Online Tutoring', icon: 'bi-mortarboard', description: 'Academic tutoring, test preparation, coding mentorship, and language lessons.' },
  { name: 'Music and Entertainment', icon: 'bi-music-note-beamed', description: 'Music production, beat making, jingles, mixing & mastering, audio editing.' },
  { name: 'Voice-over Services', icon: 'bi-mic', description: 'Professional voice acting, commercials, audiobooks, and IVR systems.' },
  { name: 'Beauty and Makeup', icon: 'bi-stars', description: 'Bridal styling, personal grooming masterclasses, and SFX makeup.' },
  { name: 'Fashion Designing', icon: 'bi-gem', description: 'Custom apparel design, tech packs, fashion sketches, and wardrobe styling.' },
  { name: 'Architecture and Interior Designing', icon: 'bi-building', description: '3D architectural renders, floor plans, interior styling, and CAD models.' },
  { name: 'Digital Marketing', icon: 'bi-graph-up-arrow', description: 'Google Ads, Meta campaigns, performance marketing, and funnel optimization.' },
  { name: 'Social Media Management', icon: 'bi-share', description: 'Instagram growth, community moderation, content calendars, and engagement.' },
  { name: 'SEO Services', icon: 'bi-search', description: 'On-page/off-page SEO, keyword research, backlink building, technical audits.' },
  { name: 'Data Entry', icon: 'bi-table', description: 'Excel spreadsheet management, CRM data migration, scraping, and verification.' },
  { name: 'Accounting and Finance', icon: 'bi-cash-coin', description: 'Bookkeeping, tax planning, GST filing, payroll, and financial modeling.' },
  { name: 'Translation and Transcription', icon: 'bi-translate', description: 'Document translation in 50+ languages, audio-to-text transcription, subtitles.' },
  { name: 'Event Management', icon: 'bi-calendar-event', description: 'Weddings, corporate summits, virtual events, and vendor coordination.' },
  { name: 'Handicrafts and Artwork', icon: 'bi-brush', description: 'Handmade crafts, resin art, customized paintings, pottery, and gifts.' },
  { name: 'Business Consulting', icon: 'bi-briefcase', description: 'Startup pitching, business plans, market research, and operations advisory.' },
  { name: 'Other Professional Services', icon: 'bi-three-dots', description: 'Legal drafting, HR consultancy, fitness coaching, and specialty skills.' }
];

const seedData = async () => {
  try {
    console.log('Seeding initial data for FreelanceHub...');

    // Clear existing collections
    await User.deleteMany({});
    await FreelancerProfile.deleteMany({});
    await ClientProfile.deleteMany({});
    await Category.deleteMany({});
    await Service.deleteMany({});
    await Project.deleteMany({});
    await Proposal.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});
    await SystemSetting.deleteMany({});
    await Dispute.deleteMany({});

    // 1. Seed System Settings
    await SystemSetting.create({
      key: 'platform_commission_percent',
      value: 10,
      description: 'Default platform commission percentage on orders and projects'
    });

    // 2. Seed 25 Categories with slugs
    const categoriesWithSlugs = categoriesList.map(cat => ({
      ...cat,
      slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
    const createdCategories = await Category.insertMany(categoriesWithSlugs);
    console.log(`Seeded ${createdCategories.length} categories.`);

    // 3. Create Admin User
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@freelancehub.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98765 00000',
      location: 'Bangalore, India',
      isVerified: true
    });

    // 4. Create Clients
    const client1 = await User.create({
      name: 'Neha Verma',
      email: 'client@freelancehub.com',
      password: 'client123',
      role: 'client',
      phone: '+91 98765 11111',
      location: 'Mumbai, India',
      avatar: '/assets/images/client-1.jpg'
    });
    await ClientProfile.create({
      user: client1._id,
      companyName: 'Verma Media & Ventures',
      website: 'https://vermamedia.example.com',
      bio: 'Entrepreneur and creative director looking for top-tier freelancers across all industries.'
    });

    const client2 = await User.create({
      name: 'Rajesh Singhania',
      email: 'rajesh.client@freelancehub.com',
      password: 'client123',
      role: 'client',
      phone: '+91 98765 22222',
      location: 'Delhi NCR, India',
      avatar: '/assets/images/client-2.jpg'
    });
    await ClientProfile.create({
      user: client2._id,
      companyName: 'Singhania Innovations',
      website: 'https://singhania.example.com',
      bio: 'Tech founder scaling multiple consumer apps and marketing campaigns.'
    });

    // 5. Create Freelancers across diverse categories
    // Freelancer 1: Aarav Sharma (Web & App Development)
    const f1 = await User.create({
      name: 'Aarav Sharma',
      email: 'freelancer@freelancehub.com',
      password: 'freelancer123',
      role: 'freelancer',
      phone: '+91 98765 33331',
      location: 'Hyderabad, India',
      avatar: '/assets/images/freelancer-1.jpg',
      isVerified: true
    });
    const fp1 = new FreelancerProfile({
      user: f1._id,
      title: 'Senior Full-Stack Developer & UI Architect',
      categories: ['Web Development', 'App Development'],
      skills: ['AngularJS', 'Node.js', 'Express', 'MongoDB', 'Bootstrap 5', 'REST APIs', 'React Native'],
      experience: 6,
      hourlyRate: 850,
      availability: 'Available',
      bio: 'Seasoned full-stack developer with 6+ years of experience crafting enterprise-grade web and mobile applications with high performance and pixel-perfect design.',
      education: [
        { degree: 'B.Tech in Computer Science', institution: 'IIT Hyderabad', year: '2019' }
      ],
      languages: ['English', 'Hindi', 'Telugu'],
      portfolio: [
        { title: 'SaaS Analytics Dashboard', description: 'Modern cloud analytics dashboard with real-time charts.', image: '/assets/images/portfolio-1.jpg', link: 'https://github.com' },
        { title: 'eCommerce Mobile Experience', description: 'Cross-platform shopping app with payment gateway integration.', image: '/assets/images/portfolio-2.jpg', link: 'https://github.com' }
      ],
      rating: 4.9,
      numReviews: 24
    });
    fp1.calculateCompletion();
    await fp1.save();
    const w1 = await Wallet.create({ user: f1._id, availableBalance: 18500, pendingBalance: 4000, totalEarnings: 45000, withdrawnAmount: 22500 });

    // Freelancer 2: Priya Patel (Graphic Designing & Logo Designing)
    const f2 = await User.create({
      name: 'Priya Patel',
      email: 'priya.design@freelancehub.com',
      password: 'freelancer123',
      role: 'freelancer',
      phone: '+91 98765 33332',
      location: 'Ahmedabad, India',
      avatar: '/assets/images/freelancer-2.jpg',
      isVerified: true
    });
    const fp2 = new FreelancerProfile({
      user: f2._id,
      title: 'Award-Winning Brand Identity & UI Designer',
      categories: ['Graphic Designing', 'Logo Designing', 'Handicrafts and Artwork'],
      skills: ['Figma', 'Adobe Illustrator', 'Photoshop', 'Brand Strategy', 'Vector Art', 'Typography'],
      experience: 5,
      hourlyRate: 600,
      availability: 'Available',
      bio: 'Passionate visual designer helping startups build memorable brands, striking logos, and compelling design collateral that converts.',
      education: [
        { degree: 'Bachelor of Design (B.Des)', institution: 'NID Ahmedabad', year: '2020' }
      ],
      languages: ['English', 'Hindi', 'Gujarati'],
      portfolio: [
        { title: 'EcoOrganic Brand Identity', description: 'Complete brand guidelines, logos, and sustainable packaging.', image: '/assets/images/portfolio-3.jpg', link: 'https://behance.net' }
      ],
      rating: 5.0,
      numReviews: 38
    });
    fp2.calculateCompletion();
    await fp2.save();
    await Wallet.create({ user: f2._id, availableBalance: 12400, pendingBalance: 2000, totalEarnings: 32000, withdrawnAmount: 17600 });

    // Freelancer 3: Rohan Verma (Video Editing & Animation)
    const f3 = await User.create({
      name: 'Rohan Verma',
      email: 'rohan.video@freelancehub.com',
      password: 'freelancer123',
      role: 'freelancer',
      phone: '+91 98765 33333',
      location: 'Pune, India',
      avatar: '/assets/images/freelancer-3.jpg',
      isVerified: true
    });
    const fp3 = new FreelancerProfile({
      user: f3._id,
      title: 'Cinematic Video Editor & 3D Motion Graphics Artist',
      categories: ['Video Editing', 'Animation'],
      skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Blender', 'Sound Design', 'Color Grading'],
      experience: 4,
      hourlyRate: 700,
      availability: 'Available',
      bio: 'Story-driven video editor specializing in YouTube viral content, commercial reels, and 3D motion graphics.',
      languages: ['English', 'Hindi', 'Marathi'],
      rating: 4.8,
      numReviews: 19
    });
    fp3.calculateCompletion();
    await fp3.save();
    await Wallet.create({ user: f3._id, availableBalance: 9500, pendingBalance: 0, totalEarnings: 21000, withdrawnAmount: 11500 });

    // Freelancer 4: Dr. Ananya Sen (Education & Online Tutoring)
    const f4 = await User.create({
      name: 'Dr. Ananya Sen',
      email: 'ananya.tutor@freelancehub.com',
      password: 'freelancer123',
      role: 'freelancer',
      phone: '+91 98765 33334',
      location: 'Kolkata, India',
      avatar: '/assets/images/freelancer-4.jpg',
      isVerified: true
    });
    const fp4 = new FreelancerProfile({
      user: f4._id,
      title: 'STEM Educator & Online Tutoring Specialist',
      categories: ['Education and Online Tutoring', 'Content Writing'],
      skills: ['Advanced Mathematics', 'Physics', 'Curriculum Design', 'Competitive Exam Prep', 'Scientific Writing'],
      experience: 8,
      hourlyRate: 500,
      availability: 'Available',
      bio: 'PhD in Applied Mathematics with 8 years of personalized online mentoring experience. Proven track record of guiding students to national ranks.',
      education: [
        { degree: 'PhD in Applied Mathematics', institution: 'Calcutta University', year: '2018' }
      ],
      languages: ['English', 'Bengali', 'Hindi'],
      rating: 5.0,
      numReviews: 42
    });
    fp4.calculateCompletion();
    await fp4.save();
    await Wallet.create({ user: f4._id, availableBalance: 24000, pendingBalance: 1500, totalEarnings: 55000, withdrawnAmount: 29500 });

    // Freelancer 5: Suresh Iyer (Accounting & Finance)
    const f5 = await User.create({
      name: 'Suresh Iyer',
      email: 'suresh.finance@freelancehub.com',
      password: 'freelancer123',
      role: 'freelancer',
      phone: '+91 98765 33335',
      location: 'Chennai, India',
      avatar: '/assets/images/freelancer-5.jpg',
      isVerified: true
    });
    const fp5 = new FreelancerProfile({
      user: f5._id,
      title: 'Chartered Accountant & Financial Modeler',
      categories: ['Accounting and Finance', 'Business Consulting'],
      skills: ['Financial Modeling', 'GST Compliance', 'Tax Planning', 'QuickBooks', 'Valuation Reports'],
      experience: 7,
      hourlyRate: 900,
      availability: 'Available',
      bio: 'Certified Chartered Accountant assisting MSMEs and startups with financial compliance, tax optimization, and pitch deck financial projections.',
      languages: ['English', 'Tamil', 'Hindi'],
      rating: 4.9,
      numReviews: 31
    });
    fp5.calculateCompletion();
    await fp5.save();
    await Wallet.create({ user: f5._id, availableBalance: 16000, pendingBalance: 0, totalEarnings: 40000, withdrawnAmount: 24000 });

    // Freelancer 6: Vikram Joshi (Music & Voice-over)
    const f6 = await User.create({
      name: 'Vikram Joshi',
      email: 'vikram.audio@freelancehub.com',
      password: 'freelancer123',
      role: 'freelancer',
      phone: '+91 98765 33336',
      location: 'Mumbai, India',
      avatar: '/assets/images/freelancer-6.jpg',
      isVerified: true
    });
    const fp6 = new FreelancerProfile({
      user: f6._id,
      title: 'Professional Voice-Over Artist & Music Producer',
      categories: ['Voice-over Services', 'Music and Entertainment'],
      skills: ['Voice Acting', 'Audio Mastering', 'Jingle Production', 'Podcast Editing', 'Pro Tools'],
      experience: 5,
      hourlyRate: 650,
      availability: 'Available',
      bio: 'Deep baritone voice-over artist heard in major TV advertisements, corporate explainer videos, and audiobooks.',
      languages: ['English', 'Hindi'],
      rating: 4.8,
      numReviews: 15
    });
    fp6.calculateCompletion();
    await fp6.save();
    await Wallet.create({ user: f6._id, availableBalance: 8200, pendingBalance: 0, totalEarnings: 18000, withdrawnAmount: 9800 });

    // 6. Seed Services (Fiverr-style gigs) with 3 Packages each
    const service1 = await Service.create({
      freelancer: f1._id,
      title: 'I will build a modern, high-speed full-stack responsive web application',
      category: 'Web Development',
      description: 'Get an end-to-end full-stack web application developed using modern frameworks. Includes secure authentication, database schema design, REST APIs, and a sleek Bootstrap 5 user interface.',
      images: ['/assets/images/service-web-1.jpg'],
      deliveryDays: 5,
      requiredInfo: 'Please provide wireframes or feature specifications, branding guidelines, and any specific third-party API requirements.',
      packages: {
        basic: {
          name: 'Starter Landing Page',
          description: 'A 1-page responsive landing page with contact form, clean UI, and speed optimization.',
          price: 2499,
          deliveryDays: 3,
          revisions: 2,
          features: ['1 Page Layout', 'Mobile Responsive', 'Contact Form', 'Basic SEO']
        },
        standard: {
          name: 'Dynamic Multi-Page Web App',
          description: 'Up to 5 dynamic pages with database integration, user authentication, and admin controls.',
          price: 7999,
          deliveryDays: 7,
          revisions: 4,
          features: ['Up to 5 Pages', 'User Authentication', 'Database Integration', 'REST APIs', 'Admin Panel']
        },
        premium: {
          name: 'Enterprise Full-Stack Platform',
          description: 'Complete scalable application with payment gateway, role-based dashboards, and analytics.',
          price: 18999,
          deliveryDays: 14,
          revisions: 6,
          features: ['Full Web App', 'Payment Integration', 'Role Dashboards', 'Live Notifications', 'Source Code', '30 Days Support']
        }
      },
      rating: 4.9,
      numReviews: 18
    });

    const service2 = await Service.create({
      freelancer: f2._id,
      title: 'I will design a timeless modern minimalist logo and complete brand identity',
      category: 'Logo Designing',
      description: 'Crafting memorable, distinct, and versatile logo designs that reflect your company essence. Every design is built from scratch with careful attention to vector precision.',
      images: ['/assets/images/service-logo-1.jpg'],
      deliveryDays: 3,
      requiredInfo: 'Please provide your business name, industry, tagline, preferred color palette, and any logos you admire.',
      packages: {
        basic: {
          name: 'Concept Logo Pack',
          description: '2 initial logo concepts in high-res PNG and transparent files.',
          price: 1499,
          deliveryDays: 2,
          revisions: 2,
          features: ['2 Initial Concepts', 'Transparent PNG', 'High-Res JPG']
        },
        standard: {
          name: 'Brand Identity Suite',
          description: '3 concepts + full vector source files (AI, SVG, PDF) + social media kit.',
          price: 3999,
          deliveryDays: 4,
          revisions: 5,
          features: ['3 Concepts', 'Vector Source Files (AI/EPS)', 'Social Media Kit', 'Stationery Mockups']
        },
        premium: {
          name: 'Complete Brand Guidelines',
          description: '5 concepts, full branding book, typography rules, packaging guide, and priority support.',
          price: 8999,
          deliveryDays: 6,
          revisions: 99,
          features: ['5 Concepts', 'Brand Style Guide (PDF)', 'Vector Assets', 'Social Kit', 'Unlimited Revisions']
        }
      },
      rating: 5.0,
      numReviews: 29
    });

    const service3 = await Service.create({
      freelancer: f3._id,
      title: 'I will create cinematic video edits and high-energy motion reels for your brand',
      category: 'Video Editing',
      description: 'Turn your raw footage into engaging videos with sound design, dynamic transitions, color grading, and subtitles optimized for Instagram, YouTube, and LinkedIn.',
      images: ['/assets/images/service-video-1.jpg'],
      deliveryDays: 2,
      packages: {
        basic: {
          name: 'Single Viral Reel / Short',
          description: 'Up to 60 seconds with viral pacing, captions, sound effects, and color grading.',
          price: 999,
          deliveryDays: 2,
          revisions: 2,
          features: ['60 Seconds Max', 'Sound Effects', 'Engaging Captions', 'Color Correction']
        },
        standard: {
          name: 'YouTube Standard Video',
          description: 'Up to 8 minutes of footage edited with B-roll, motion text, and royalty-free music.',
          price: 3499,
          deliveryDays: 4,
          revisions: 3,
          features: ['Up to 8 Minutes', 'Music & SFX', 'Motion Titles', 'Thumbnail Included']
        },
        premium: {
          name: 'Commercial & Brand Promo',
          description: 'Full commercial production, 3D motion elements, advanced sound design, and 4K master.',
          price: 7999,
          deliveryDays: 7,
          revisions: 5,
          features: ['4K Render', 'Custom 3D Animations', 'Sound Mixing', 'Fast Turnaround', 'Multi-format Exports']
        }
      },
      rating: 4.8,
      numReviews: 12
    });

    const service4 = await Service.create({
      freelancer: f4._id,
      title: 'I will provide 1-on-1 personalized STEM and Mathematics online tutoring sessions',
      category: 'Education and Online Tutoring',
      description: 'Master calculus, linear algebra, engineering mathematics, or physics with an interactive digital whiteboard and custom practice problem sets.',
      images: ['/assets/images/service-tutor-1.jpg'],
      deliveryDays: 1,
      packages: {
        basic: {
          name: '1-Hour Doubt Clearing',
          description: 'One 60-minute intensive live session focused on specific questions and exam concepts.',
          price: 799,
          deliveryDays: 1,
          revisions: 1,
          features: ['60-Minute Session', 'Digital Whiteboard Notes (PDF)', 'Formula Sheet']
        },
        standard: {
          name: 'Weekly Mastery Bundle',
          description: 'Four 60-minute sessions covering a comprehensive syllabus topic with homework reviews.',
          price: 2799,
          deliveryDays: 7,
          revisions: 2,
          features: ['4 Live Sessions', 'Curated Practice Questions', 'Session Recordings', 'Progress Assessment']
        },
        premium: {
          name: 'Monthly Academic Mentorship',
          description: 'Ten 60-minute sessions with personalized curriculum, mock tests, and 24/7 WhatsApp doubt support.',
          price: 5999,
          deliveryDays: 30,
          revisions: 3,
          features: ['10 Live Sessions', 'Full Mock Exam Series', 'Direct Doubt Support', 'Personalized Roadmap']
        }
      },
      rating: 5.0,
      numReviews: 33
    });

    console.log('Seeded services successfully.');

    // 7. Seed Sample Projects (Upwork-style)
    const project1 = await Project.create({
      client: client1._id,
      title: 'Full-Stack Freelancing & Service Marketplace Web Platform',
      description: 'Looking for a senior web developer to build a responsive multi-category freelancing marketplace using AngularJS, Node.js, and MongoDB. Must support both direct purchases and client project proposals, with escrow payment management.',
      category: 'Web Development',
      skills: ['AngularJS', 'Node.js', 'Express', 'MongoDB', 'Bootstrap 5', 'REST APIs'],
      budget: 15000,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      paymentType: 'fixed',
      status: 'In Progress',
      hiredFreelancer: f1._id,
      milestones: [
        { title: 'Milestone 1: Database Schema & Authentication API', amount: 5000, dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), status: 'Completed' },
        { title: 'Milestone 2: Service Listings & Direct Order Checkout', amount: 5000, dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), status: 'Funded' },
        { title: 'Milestone 3: Dashboards, Reviews & Testing', amount: 5000, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), status: 'Pending' }
      ]
    });

    const project2 = await Project.create({
      client: client2._id,
      title: 'Corporate Brand Identity, Logo & Social Media Style Guide',
      description: 'We are launching Singhania GreenTech and require a cohesive brand identity, vector logo, color palette, typography guidelines, and 10 ready-to-use social media templates.',
      category: 'Logo Designing',
      skills: ['Logo Designing', 'Graphic Designing', 'Figma', 'Illustrator', 'Branding'],
      budget: 8000,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      paymentType: 'fixed',
      status: 'Pending',
      milestones: [
        { title: 'Logo Concepts & Final Vector', amount: 4000, status: 'Pending' },
        { title: 'Brand Guidelines & Social Templates', amount: 4000, status: 'Pending' }
      ]
    });

    const project3 = await Project.create({
      client: client1._id,
      title: 'Explainer Video Production & Motion Graphics Animation for SaaS',
      description: 'Need a 90-second animated explainer video showcasing our SaaS product features. Requires script refining, voice-over sync, character motion graphics, and background score.',
      category: 'Animation',
      skills: ['Animation', 'Video Editing', 'Motion Graphics', 'After Effects', 'Sound Design'],
      budget: 12000,
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      paymentType: 'fixed',
      status: 'Pending'
    });

    console.log('Seeded projects.');

    // 8. Seed Proposals
    const proposal1 = await Proposal.create({
      project: project1._id,
      freelancer: f1._id,
      bidAmount: 15000,
      deliveryDays: 12,
      coverLetter: 'Hello Neha, I have deep expertise in building scalable marketplaces with AngularJS, Node.js, Express, and MongoDB. I have delivered similar platforms with dual Fiverr/Upwork functionality, escrow workflows, and clean responsive design. I am ready to start immediately.',
      status: 'accepted'
    });
    project1.acceptedProposal = proposal1._id;
    await project1.save();

    await Proposal.create({
      project: project2._id,
      freelancer: f2._id,
      bidAmount: 7500,
      deliveryDays: 7,
      coverLetter: 'Dear Rajesh, I am a senior brand designer with an NID background. Green tech and sustainable branding is one of my strongest domains. I will deliver 4 distinct logo concepts, full vector source assets, and an engaging social media toolkit.',
      status: 'pending'
    });

    // 9. Seed Orders (Fiverr-style)
    const order1 = await Order.create({
      orderNumber: 'FH-ORD-882194',
      service: service2._id,
      packageType: 'standard',
      client: client1._id,
      freelancer: f2._id,
      amount: 3999,
      platformCommission: 400,
      freelancerEarnings: 3599,
      requirements: 'Logo for Verma Ventures: Deep royal blue and gold colors, modern geometric emblem.',
      status: 'Completed',
      deliveryWork: {
        message: 'Hello Neha, please find the final vector logo pack, font files, and social media banners attached.',
        fileUrl: '/uploads/sample-logo-delivery.zip',
        fileName: 'verma_ventures_brand_kit.zip',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      paymentStatus: 'released'
    });

    const payment1 = await Payment.create({
      order: order1._id,
      payer: client1._id,
      payee: f2._id,
      amount: 3999,
      currency: 'INR',
      paymentMethod: 'UPI',
      status: 'released',
      platformFee: 400
    });
    order1.payment = payment1._id;
    await order1.save();

    // Active order in progress
    const order2 = await Order.create({
      orderNumber: 'FH-ORD-913402',
      service: service1._id,
      packageType: 'basic',
      client: client2._id,
      freelancer: f1._id,
      amount: 2499,
      platformCommission: 250,
      freelancerEarnings: 2249,
      requirements: 'Need a fast landing page for Singhania IoT pilot launch.',
      status: 'In Progress',
      paymentStatus: 'escrow_held'
    });

    const payment2 = await Payment.create({
      order: order2._id,
      payer: client2._id,
      payee: f1._id,
      amount: 2499,
      currency: 'INR',
      paymentMethod: 'Razorpay / UPI',
      status: 'held_in_escrow',
      platformFee: 250
    });
    order2.payment = payment2._id;
    await order2.save();

    // 10. Seed Reviews
    await Review.create({
      order: order1._id,
      reviewer: client1._id,
      reviewee: f2._id,
      rating: 5,
      comment: 'Priya exceeded all our expectations! The logo concepts were world-class and delivered ahead of schedule. Highly recommended!',
      role: 'client_to_freelancer'
    });

    await Review.create({
      order: order1._id,
      reviewer: f2._id,
      reviewee: client1._id,
      rating: 5,
      comment: 'Neha was a pleasure to work with. Clear requirements, prompt feedback, and instant milestone approval.',
      role: 'freelancer_to_client'
    });

    // 11. Seed Notifications
    await Notification.create({
      user: client1._id,
      title: 'Order Completed',
      message: 'Order #FH-ORD-882194 was marked as completed and reviewed.',
      type: 'order',
      isRead: true
    });

    await Notification.create({
      user: f1._id,
      title: 'New Order In Progress',
      message: 'Client Rajesh Singhania placed Order #FH-ORD-913402 for "Starter Landing Page". ₹2,499 held in escrow.',
      type: 'order',
      isRead: false
    });

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

module.exports = seedData;

if (require.main === module) {
  const { connectDB, closeDB } = require('./db');
  require('dotenv').config();
  (async () => {
    await connectDB();
    await seedData();
    await closeDB();
    process.exit(0);
  })();
}
