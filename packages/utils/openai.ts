import axios from 'axios';

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVibeSummary(
    displayName: string, 
    topArtists: string[], 
    topGenres: string[], 
    currentTrack?: { song: string; artist: string }
  ): Promise<string> {
    try {
      const prompt = this.buildVibePrompt(displayName, topArtists, topGenres, currentTrack);
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a poetic music curator who captures the emotional essence of someone\'s musical taste in beautiful, evocative language. Create short, soulful summaries that feel like glimpses into someone\'s inner world.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.8,
          presence_penalty: 0.3,
          frequency_penalty: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0]?.message?.content?.trim() || 
        `${displayName} moves through soundscapes of ${topGenres[0] || 'infinite possibility'}, finding beauty in every beat.`;
    } catch (error) {
      console.error('Error generating vibe summary:', error);
      return `${displayName} lives in the spaces between notes, where emotions find their voice through melody.`;
    }
  }

  private buildVibePrompt(
    displayName: string, 
    topArtists: string[], 
    topGenres: string[], 
    currentTrack?: { song: string; artist: string }
  ): string {
    let prompt = `Create a poetic, emotional summary for ${displayName}'s musical vibe. `;
    
    if (topArtists.length > 0) {
      prompt += `Their top artists include ${topArtists.slice(0, 3).join(', ')}. `;
    }
    
    if (topGenres.length > 0) {
      prompt += `They gravitate toward ${topGenres.slice(0, 2).join(' and ')} music. `;
    }
    
    if (currentTrack) {
      prompt += `Right now they're listening to "${currentTrack.song}" by ${currentTrack.artist}. `;
    }
    
    prompt += `Write 1-2 sentences that capture their musical soul - something beautiful, introspective, and emotionally resonant. Use poetic language that feels personal and authentic.`;
    
    return prompt;
  }

  async generatePlaylistDescription(tracks: string[], mood?: string): Promise<string> {
    try {
      const prompt = `Create a poetic description for a playlist containing these tracks: ${tracks.join(', ')}. ${mood ? `The mood is ${mood}.` : ''} Write something beautiful and evocative in 1-2 sentences.`;
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a poetic music curator. Create beautiful, emotional descriptions for playlists.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 80,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0]?.message?.content?.trim() || 
        'A collection of moments woven into melody, each song a chapter in an unspoken story.';
    } catch (error) {
      console.error('Error generating playlist description:', error);
      return 'Music that speaks to the spaces between heartbeats.';
    }
  }
}