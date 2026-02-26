import { config } from '../config';

export async function generateSpeech(text: string): Promise<Blob> {
    const response = await fetch(`${config.apiUrl}/tts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `TTS failed: ${response.status}`);
    }

    return response.blob();
}
