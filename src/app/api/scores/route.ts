import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Score file path
const SCORES_FILE = path.join(process.cwd(), 'data', 'scores.json');

// Fallback scores when file operations fail
const FALLBACK_SCORES = [
  { name: 'Xx_NoScope_xX', score: 999999 },
  { name: 'ERROR_42', score: 888888 },
  { name: 'GLITCH_MASTER', score: 777777 },
  { name: 'SYSTEM_FAILURE', score: 666666 },
  { name: 'NULL_POINTER', score: 555555 },
  { name: 'SEGFAULT_99', score: 444444 },
  { name: 'YOU_TRIED', score: 1234 },
  { name: '404_NOT_FOUND', score: 111111 },
  { name: 'BUFFER_OVERFLOW', score: 99999 },
  { name: 'KERNEL_PANIC', score: 88888 },
];

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(SCORES_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Read scores from file
const readScores = (): Array<{ name: string; score: number }> => {
  try {
    ensureDataDir();
    if (!fs.existsSync(SCORES_FILE)) {
      return [...FALLBACK_SCORES];
    }
    const data = fs.readFileSync(SCORES_FILE, 'utf-8');
    const scores = JSON.parse(data);
    return Array.isArray(scores) ? scores : [...FALLBACK_SCORES];
  } catch (error) {
    console.error('Error reading scores:', error);
    return [...FALLBACK_SCORES];
  }
};

// Write scores to file
const writeScores = (scores: Array<{ name: string; score: number }>): boolean => {
  try {
    ensureDataDir();
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing scores:', error);
    return false;
  }
};

// Humorous error messages
const ERROR_MESSAGES = [
  "⚠ SCORE STORAGE FAILURE. Your achievement has been spiritually recorded.",
  "❌ ERROR: The score elves are on strike!",
  "🚫 Save failed. Your score exists in an alternate dimension.",
  "💾 Disk full... just kidding, we lost your score in a wormhole.",
  "⚡ High voltage destroyed your score! Try again!",
  "🦆 Your score was eaten by a duck. Quack!",
];

// Get random error message
const getRandomErrorMessage = (): string => {
  return ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
};

// GET - Fetch top scores
export async function GET() {
  try {
    const scores = readScores();
    const sortedScores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    return NextResponse.json({ scores: sortedScores, isFallback: false });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json({ 
      scores: FALLBACK_SCORES, 
      isFallback: true,
      message: getRandomErrorMessage()
    });
  }
}

// POST - Add new score
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, score } = body;
    
    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: 'Valid score is required' }, { status: 400 });
    }
    
    const scores = readScores();
    scores.push({ name: name.trim(), score: Math.floor(score) });
    
    // Sort and keep top 10
    const topScores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    const writeSuccess = writeScores(topScores);
    
    if (writeSuccess) {
      return NextResponse.json({
        success: true,
        scores: topScores,
        isFallback: false
      });
    } else {
      return NextResponse.json({
        success: false,
        message: getRandomErrorMessage(),
        scores: topScores,
        isFallback: true
      });
    }
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ 
      error: 'Failed to save score',
      scores: FALLBACK_SCORES,
      isFallback: true,
      message: getRandomErrorMessage()
    }, { status: 500 });
  }
}
