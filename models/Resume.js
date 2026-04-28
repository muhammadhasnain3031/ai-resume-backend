const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Personal Info
  personalInfo: {
    fullName:    { type: String, default: '' },
    email:       { type: String, default: '' },
    phone:       { type: String, default: '' },
    location:    { type: String, default: '' },
    linkedin:    { type: String, default: '' },
    github:      { type: String, default: '' },
    portfolio:   { type: String, default: '' },
  },

  // Summary — AI generate karta hai
  summary: { type: String, default: '' },

  // Experience
  experience: [{
    company:     String,
    position:    String,
    startDate:   String,
    endDate:     String,
    current:     { type: Boolean, default: false },
    description: String,  // AI improve karta hai
  }],

  // Education
  education: [{
    institution: String,
    degree:      String,
    field:       String,
    startDate:   String,
    endDate:     String,
    grade:       String,
  }],

  // Skills
  skills: [{
    category: String,  // Frontend, Backend, Tools
    items:    [String],
  }],

  // Projects
  projects: [{
    name:        String,
    description: String,  // AI improve karta hai
    tech:        [String],
    link:        String,
    github:      String,
  }],

  // AI generated content
  aiEnhanced: { type: Boolean, default: false },
  template:   { type: String, default: 'modern', enum: ['modern', 'classic', 'minimal'] },
  title:      { type: String, default: 'My Resume' },

}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);