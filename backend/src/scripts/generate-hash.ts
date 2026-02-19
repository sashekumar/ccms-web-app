import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'Password123!';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('');
    console.log('Password: ' + password);
    console.log('Bcrypt Hash: ' + hash);
    console.log('');
    console.log('Copy this hash and replace all instances of "$2b$10$YourBcryptHashHere" in users-seed-data.sql');
    console.log('');
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
