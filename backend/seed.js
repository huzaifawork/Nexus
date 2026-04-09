const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Collaboration = require('./models/Collaboration');
const Meeting = require('./models/Meeting');

dotenv.config();

const entrepreneurs = [
  {
    name: 'Sarah Johnson',
    email: 'sarah@techwave.io',
    password: 'password123',
    role: 'entrepreneur',
    avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    bio: 'Serial entrepreneur with 10+ years of experience in SaaS and fintech.',
    startupName: 'TechWave AI',
    pitchSummary: 'AI-powered financial analytics platform helping SMBs make data-driven decisions.',
    fundingNeeded: '$1.5M',
    industry: 'FinTech',
    location: 'San Francisco, CA',
    foundedYear: 2021,
    teamSize: 12,
    isOnline: true,
  },
  {
    name: 'David Chen',
    email: 'david@greenlife.co',
    password: 'password123',
    role: 'entrepreneur',
    avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
    bio: 'Environmental scientist turned entrepreneur. Passionate about sustainable solutions.',
    startupName: 'GreenLife Solutions',
    pitchSummary: 'Biodegradable packaging alternatives for consumer goods and food industry.',
    fundingNeeded: '$2M',
    industry: 'CleanTech',
    location: 'Portland, OR',
    foundedYear: 2020,
    teamSize: 8,
    isOnline: false,
  },
  {
    name: 'Maya Patel',
    email: 'maya@healthpulse.com',
    password: 'password123',
    role: 'entrepreneur',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    bio: 'Former healthcare professional with an MBA. Building tech to improve patient care.',
    startupName: 'HealthPulse',
    pitchSummary: 'Mobile platform connecting patients with mental health professionals in real-time.',
    fundingNeeded: '$800K',
    industry: 'HealthTech',
    location: 'Boston, MA',
    foundedYear: 2022,
    teamSize: 5,
    isOnline: true,
  },
  {
    name: 'James Wilson',
    email: 'james@urbanfarm.io',
    password: 'password123',
    role: 'entrepreneur',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    bio: 'Agricultural engineer focused on urban farming solutions and food security.',
    startupName: 'UrbanFarm',
    pitchSummary: 'IoT-enabled vertical farming systems for urban environments and food deserts.',
    fundingNeeded: '$3M',
    industry: 'AgTech',
    location: 'Chicago, IL',
    foundedYear: 2019,
    teamSize: 14,
    isOnline: false,
  },
];

const investors = [
  {
    name: 'Michael Rodriguez',
    email: 'michael@vcinnovate.com',
    password: 'password123',
    role: 'investor',
    avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
    bio: 'Early-stage investor with focus on B2B SaaS and fintech. Previously founded and exited two startups.',
    investmentInterests: ['FinTech', 'SaaS', 'AI/ML'],
    investmentStage: ['Seed', 'Series A'],
    portfolioCompanies: ['PayStream', 'DataSense', 'CloudSecure'],
    totalInvestments: 12,
    minimumInvestment: '$250K',
    maximumInvestment: '$1.5M',
    isOnline: true,
  },
  {
    name: 'Jennifer Lee',
    email: 'jennifer@impactvc.org',
    password: 'password123',
    role: 'investor',
    avatarUrl: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
    bio: 'Impact investor focused on climate tech, sustainable agriculture, and clean energy.',
    investmentInterests: ['CleanTech', 'AgTech', 'Sustainability'],
    investmentStage: ['Seed', 'Series A', 'Series B'],
    portfolioCompanies: ['SolarFlow', 'EcoPackage', 'CleanWater Solutions'],
    totalInvestments: 18,
    minimumInvestment: '$500K',
    maximumInvestment: '$3M',
    isOnline: false,
  },
  {
    name: 'Robert Torres',
    email: 'robert@healthventures.com',
    password: 'password123',
    role: 'investor',
    avatarUrl: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg',
    bio: 'Healthcare-focused investor with medical background. Looking for innovations in patient care and biotech.',
    investmentInterests: ['HealthTech', 'BioTech', 'Medical Devices'],
    investmentStage: ['Series A', 'Series B'],
    portfolioCompanies: ['MediTrack', 'BioGenics', 'Patient+'],
    totalInvestments: 9,
    minimumInvestment: '$1M',
    maximumInvestment: '$5M',
    isOnline: true,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Collaboration.deleteMany({});
    await Meeting.deleteMany({});
    console.log('Cleared existing data');

    // Create entrepreneurs
    const createdEntrepreneurs = await User.create(entrepreneurs);
    console.log(`Created ${createdEntrepreneurs.length} entrepreneurs`);

    // Create investors
    const createdInvestors = await User.create(investors);
    console.log(`Created ${createdInvestors.length} investors`);

    // Create sample collaboration requests
    const collaborations = [
      {
        investorId: createdInvestors[1]._id, // Jennifer -> David
        entrepreneurId: createdEntrepreneurs[1]._id,
        message: "GreenLife Solutions aligns perfectly with our impact investment thesis. Your biodegradable packaging solution addresses a critical market need. Let's explore a partnership.",
        status: 'pending',
      },
      {
        investorId: createdInvestors[2]._id, // Robert -> Maya
        entrepreneurId: createdEntrepreneurs[2]._id,
        message: "HealthPulse's mental health platform is exactly what the healthcare industry needs. I'd like to learn more about your growth strategy and discuss how we can support your Series A.",
        status: 'pending',
      },
    ];

    const createdCollaborations = await Collaboration.create(collaborations);
    console.log(`Created ${createdCollaborations.length} collaboration requests`);

    // Create sample meetings
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    const meetings = [
      {
        title: 'Initial Investment Discussion',
        description: 'Discuss TechWave AI funding requirements and growth strategy',
        organizerId: createdInvestors[0]._id, // Michael
        participantId: createdEntrepreneurs[0]._id, // Sarah
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
        status: 'accepted',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        location: 'Virtual',
        collaborationId: createdCollaborations[0]._id,
      },
      {
        title: 'Product Demo & Q&A',
        description: 'Live demo of HealthPulse platform and technical discussion',
        organizerId: createdEntrepreneurs[2]._id, // Maya
        participantId: createdInvestors[2]._id, // Robert
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 90 * 60 * 1000), // 1.5 hours later
        status: 'pending',
        meetingLink: 'https://zoom.us/j/123456789',
        location: 'Virtual',
        collaborationId: createdCollaborations[1]._id,
      },
    ];

    const createdMeetings = await Meeting.create(meetings);
    console.log(`Created ${createdMeetings.length} sample meetings`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample Login Credentials:');
    console.log('\nEntrepreneurs:');
    entrepreneurs.forEach(e => {
      console.log(`  Email: ${e.email} | Password: password123 | Role: entrepreneur`);
    });
    console.log('\nInvestors:');
    investors.forEach(i => {
      console.log(`  Email: ${i.email} | Password: password123 | Role: investor`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
