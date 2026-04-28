const router = require('express').Router();
const Groq   = require('groq-sdk');
const Resume = require('../models/Resume');
const auth   = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper — Groq se text generate karo
async function generateWithAI(prompt) {
  const completion = await groq.chat.completions.create({
    model:       'llama3-8b-8192',
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  800,
    temperature: 0.7,
  });
  return completion.choices[0].message.content.trim();
}

// Sare resumes
router.get('/', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .select('title template aiEnhanced createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Single resume
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Not found' });
    res.json(resume);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Naya resume banao
router.post('/', auth, async (req, res) => {
  try {
    const resume = await Resume.create({
      user:  req.user.id,
      title: req.body.title || 'My Resume',
    });
    res.status(201).json(resume);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Resume update karo
router.put('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!resume) return res.status(404).json({ message: 'Not found' });
    res.json(resume);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ✅ AI — Summary generate karo
router.post('/:id/ai/summary', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Not found' });

    const { personalInfo, experience, skills } = resume;
    const skillsList = skills.map(s => s.items.join(', ')).join(', ');
    const expList    = experience.map(e =>
      `${e.position} at ${e.company}`).join(', ');

    const prompt = `
Write a professional resume summary (3-4 sentences) for:
Name: ${personalInfo.fullName}
Experience: ${expList || 'fresher/student'}
Skills: ${skillsList || 'web development'}

Requirements:
- Professional tone
- Highlight key strengths
- Mention relevant skills
- ATS friendly
- No placeholder text
- Direct, no intro like "Here is..."
`;

    const summary = await generateWithAI(prompt);
    resume.summary = summary;
    await resume.save();
    res.json({ summary });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ✅ AI — Experience description improve karo
router.post('/:id/ai/experience/:expIndex', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Not found' });

    const exp = resume.experience[req.params.expIndex];
    if (!exp) return res.status(404).json({ message: 'Experience not found' });

    const prompt = `
Improve this job experience description for a resume:
Position: ${exp.position}
Company: ${exp.company}
Current description: ${exp.description || 'basic responsibilities'}

Requirements:
- Use strong action verbs (Built, Developed, Implemented, Led)
- Add measurable impact where possible
- ATS friendly keywords
- 3-4 bullet points
- Professional tone
- Start each bullet with •
- No intro text, just bullets directly
`;

    const improved = await generateWithAI(prompt);
    resume.experience[req.params.expIndex].description = improved;
    resume.aiEnhanced = true;
    await resume.save();
    res.json({ description: improved });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ✅ AI — Project description improve karo
router.post('/:id/ai/project/:projIndex', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Not found' });

    const proj = resume.projects[req.params.projIndex];
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    const prompt = `
Write a professional project description for a resume:
Project: ${proj.name}
Tech Stack: ${proj.tech?.join(', ') || 'web technologies'}
Current description: ${proj.description || 'web application'}

Requirements:
- 2-3 sentences
- Mention tech stack naturally
- Highlight what problem it solves
- Professional tone
- No intro text, direct description only
`;

    const improved = await generateWithAI(prompt);
    resume.projects[proj].description = improved;
    resume.aiEnhanced = true;
    await resume.save();
    res.json({ description: improved });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ✅ AI — ATS Score check karo
router.post('/:id/ai/ats-score', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Not found' });

    const prompt = `
Analyze this resume and give an ATS (Applicant Tracking System) score:

Name: ${resume.personalInfo.fullName}
Summary: ${resume.summary}
Skills: ${resume.skills.map(s => s.items.join(', ')).join(' | ')}
Experience: ${resume.experience.map(e => `${e.position} at ${e.company}: ${e.description}`).join(' | ')}
Projects: ${resume.projects.map(p => p.name).join(', ')}

Respond in this EXACT JSON format only, no other text:
{
  "score": 75,
  "grade": "B",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "keywords_missing": ["keyword1", "keyword2", "keyword3"]
}
`;

    const result = await generateWithAI(prompt);
    const clean  = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: 'ATS analysis failed' });
  }
});

// Resume delete
router.delete('/:id', auth, async (req, res) => {
  try {
    await Resume.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;