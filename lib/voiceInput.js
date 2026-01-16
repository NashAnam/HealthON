/**
 * Voice Input Utility for HealthON
 * Uses Web Speech API for voice-to-text conversion
 */

export class VoiceInput {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onResult = null;
        this.onError = null;
    }

    /**
     * Check if browser supports speech recognition
     */
    static isSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    /**
     * Initialize speech recognition
     */
    init(language = 'en-US') {
        if (!VoiceInput.isSupported()) {
            throw new Error('Speech recognition not supported in this browser');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = language;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            if (this.onResult) {
                this.onResult(transcript, event.results[0].isFinal);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;

            if (this.onError) {
                this.onError(event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };
    }

    /**
     * Start listening
     */
    start() {
        if (!this.recognition) {
            this.init();
        }

        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (error) {
            console.error('Failed to start recognition:', error);
            return false;
        }
    }

    /**
     * Stop listening
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    /**
     * Set result callback
     */
    setOnResult(callback) {
        this.onResult = callback;
    }

    /**
     * Set error callback
     */
    setOnError(callback) {
        this.onError = callback;
    }
}

/**
 * React hook for voice input
 */
export function useVoiceInput() {
    const [isListening, setIsListening] = React.useState(false);
    const [transcript, setTranscript] = React.useState('');
    const [error, setError] = React.useState(null);
    const voiceInputRef = React.useRef(null);

    React.useEffect(() => {
        if (!VoiceInput.isSupported()) {
            setError('Speech recognition not supported');
            return;
        }

        voiceInputRef.current = new VoiceInput();

        voiceInputRef.current.setOnResult((text, isFinal) => {
            setTranscript(text);
        });

        voiceInputRef.current.setOnError((err) => {
            setError(err);
            setIsListening(false);
        });

        return () => {
            if (voiceInputRef.current) {
                voiceInputRef.current.stop();
            }
        };
    }, []);

    const startListening = () => {
        setError(null);
        setTranscript('');
        if (voiceInputRef.current) {
            voiceInputRef.current.start();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (voiceInputRef.current) {
            voiceInputRef.current.stop();
            setIsListening(false);
        }
    };

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        isSupported: VoiceInput.isSupported()
    };
}
