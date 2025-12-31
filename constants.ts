
export const GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'Country', 'R&B', 'Electronic', 'Jazz', 'Metal', 'Folk', 
  'Punk', 'Soul', 'Funk', 'Blues', 'Reggae', 'Synthwave', 'Lo-fi', 'Grunge', 'Latin', 
  'Indie', 'Alternative', 'Trap', 'House', 'Techno'
];

export const MOODS = [
  'Happy', 'Sad', 'Romantic', 'Energetic', 'Melancholic', 'Angry', 'Chill', 'Dark', 
  'Nostalgic', 'Hopeful', 'Ethereal', 'Aggressive', 'Lonely', 'Euphoric', 'Defiant', 
  'Anxious', 'Confident', 'Peaceful', 'Surreal'
];

export const VOCAL_STYLES = [
  'Auto (Best Suited)', 'Clean & Crisp', 'Raspy & Raw', 'Ethereal & Airy', 'Soulful & Deep', 'Aggressive & Gritty', 
  'Whispering', 'Auto-tuned/Vocaloid', 'Operatic', 'Spoken Word', 'Harmonized Choir'
];

export const INSTRUMENTAL_PROFILES = [
  'Auto (Best Suited)', 'Acoustic Minimalist', 'Heavy Analog Bass', 'Cinematic Orchestral', 'Lo-fi Chill Piano', 
  'Shredding Electric Guitars', 'Vintage 80s Synths', 'Industrial Glitch', 'Funky Brass Section',
  'Ambient Textures', 'Trap 808s'
];

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Portuguese', 'Italian', 'Russian'
];

export const FAMOUS_NORTH_AMERICAN_ARTISTS = [
  // Pop
  'Taylor Swift', 'The Weeknd', 'Justin Bieber', 'Ariana Grande', 'Billie Eilish', 'Katy Perry', 'Bruno Mars', 'Miley Cyrus', 'Olivia Rodrigo', 'Shawn Mendes', 'Camila Cabello', 'Lana Del Rey', 'Selena Gomez', 'Doja Cat', 'Halsey',
  // Hip Hop
  'Kendrick Lamar', 'Drake', 'Eminem', 'Jay-Z', 'Kanye West', 'J. Cole', 'Travis Scott', 'Lil Wayne', 'Future', 'Post Malone', 'Tyler, The Creator', 'Mac Miller', 'Nicki Minaj', 'Cardi B', 'Megan Thee Stallion', '21 Savage', 'A$AP Rocky', 'Nas', 'Snoop Dogg', 'Tupac Shakur', 'Notorious B.I.G.',
  // Rock & Indie
  'Nirvana', 'Bruce Springsteen', 'The Doors', 'Metallica', 'Pearl Jam', 'Guns N Roses', 'Green Day', 'Foo Fighters', 'The Killers', 'The Strokes', 'Vampire Weekend', 'Arcade Fire', 'Mac DeMarco', 'Tame Impala', 'LCD Soundsystem', 'Bon Iver', 'The White Stripes', 'Linkin Park', 'Red Hot Chili Peppers', 'Linkin Park', 'Fall Out Boy', 'Paramore', 'Metric', 'Rush', 'The Tragically Hip',
  // Country
  'Johnny Cash', 'Dolly Parton', 'Shania Twain', 'Garth Brooks', 'Morgan Wallen', 'Luke Combs', 'Carrie Underwood', 'Willie Nelson', 'Kenny Rogers', 'Taylor Swift (Country Era)', 'Tim McGraw', 'Chris Stapleton', 'Kacey Musgraves',
  // R&B & Soul
  'Beyoncé', 'SZA', 'Frank Ocean', 'Daniel Caesar', 'Alicia Keys', 'Usher', 'Marvin Gaye', 'Stevie Wonder', 'Aretha Franklin', 'Prince', 'Whitney Houston', 'Michael Jackson', 'Rihanna', 'Chris Brown', 'Summer Walker', 'H.E.R.', 'The Internet',
  // Folk & Singer-Songwriter
  'Bob Dylan', 'Joni Mitchell', 'Neil Young', 'Gordon Lightfoot', 'Leonard Cohen', 'James Taylor', 'Simon & Garfunkel', 'Phoebe Bridgers', 'Mitski', 'Clairo', 'Fiona Apple',
  // Electronic
  'Skrillex', 'Deadmau5', 'Porter Robinson', 'Odesza', 'Kaytranada', 'REZZ', 'Illenium', 'The Chainsmokers', 'Marshmello', 'ZHU', 'Kaskade', 'Steve Aoki'
];

export const GENRE_ARTISTS: Record<string, string[]> = {
  'Pop': ['Taylor Swift', 'The Weeknd', 'Justin Bieber', 'Ariana Grande', 'Billie Eilish'],
  'Rock': ['Bruce Springsteen', 'Nirvana', 'Rush', 'The Doors', 'Neil Young'],
  'Hip Hop': ['Kendrick Lamar', 'Drake', 'Eminem', 'Jay-Z', 'J. Cole'],
  'Country': ['Johnny Cash', 'Dolly Parton', 'Shania Twain', 'Garth Brooks', 'Morgan Wallen'],
  'R&B': ['Frank Ocean', 'Daniel Caesar', 'SZA', 'Beyoncé', 'Alicia Keys'],
  'Electronic': ['Deadmau5', 'Skrillex', 'Kaytranada', 'REZZ', 'Porter Robinson'],
  'Jazz': ['Louis Armstrong', 'Diana Krall', 'Miles Davis', 'Oscar Peterson', 'Ella Fitzgerald'],
  'Metal': ['Metallica', 'Pantera', 'Voivod', 'Megadeth', 'Devin Townsend'],
  'Folk': ['Bob Dylan', 'Joni Mitchell', 'Bon Iver', 'Gordon Lightfoot', 'Phoebe Bridgers'],
  'Punk': ['Ramones', 'Green Day', 'Blink-182', 'The Stooges', 'Bad Brains'],
  'Synthwave': ['The Midnight', 'Com Truise', 'Chromeo', 'Gunship', 'Home'],
  'Lo-fi': ['J Dilla', 'Flying Lotus', 'Knxwledge', 'Teebs', 'Madlib'],
  'Grunge': ['Nirvana', 'Pearl Jam', 'Soundgarden', 'Alice in Chains', 'Mudhoney'],
  'Latin': ['Bad Bunny', 'Selena', 'Jennifer Lopez', 'Marc Anthony', 'Kali Uchis'],
  'Indie': ['The Strokes', 'Vampire Weekend', 'Mac DeMarco', 'Arcade Fire', 'Mitski'],
  'Alternative': ['R.E.M.', 'Pixies', 'The Killers', 'Metric', 'Alanis Morissette'],
  'Trap': ['Travis Scott', 'Future', '21 Savage', 'Lil Uzi Vert', 'Migos'],
  'House': ['The Blessed Madonna', 'Kaskade', 'Tiga', 'Claude VonStroke', 'Green Velvet'],
  'Techno': ['Jeff Mills', 'Richie Hawtin', 'Carl Craig', 'Robert Hood', 'Kevin Saunderson']
};
