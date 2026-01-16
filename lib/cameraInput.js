/**
 * Camera Input Utility for HealthON
 * Handles camera access and image capture for food recognition
 */

export class CameraInput {
    constructor() {
        this.stream = null;
        this.videoElement = null;
    }

    /**
     * Check if browser supports camera access
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Request camera permission and start stream
     */
    async startCamera(videoElement, facingMode = 'environment') {
        if (!CameraInput.isSupported()) {
            throw new Error('Camera access not supported in this browser');
        }

        try {
            const constraints = {
                video: {
                    facingMode: facingMode, // 'user' for front camera, 'environment' for back
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement = videoElement;

            if (videoElement) {
                videoElement.srcObject = this.stream;
                await videoElement.play();
            }

            return this.stream;
        } catch (error) {
            console.error('Camera access error:', error);
            throw error;
        }
    }

    /**
     * Capture image from video stream
     */
    captureImage() {
        if (!this.videoElement) {
            throw new Error('Video element not initialized');
        }

        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        const context = canvas.getContext('2d');
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/jpeg', 0.8);
    }

    /**
     * Stop camera stream
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }
    }

    /**
     * Switch between front and back camera
     */
    async switchCamera() {
        const currentFacingMode = this.stream?.getVideoTracks()[0].getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        this.stopCamera();
        await this.startCamera(this.videoElement, newFacingMode);
    }
}

/**
 * React hook for camera input
 */
export function useCameraInput() {
    const [isActive, setIsActive] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [capturedImage, setCapturedImage] = React.useState(null);
    const cameraRef = React.useRef(null);
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        cameraRef.current = new CameraInput();

        return () => {
            if (cameraRef.current) {
                cameraRef.current.stopCamera();
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            await cameraRef.current.startCamera(videoRef.current);
            setIsActive(true);
        } catch (err) {
            setError(err.message);
            setIsActive(false);
        }
    };

    const stopCamera = () => {
        if (cameraRef.current) {
            cameraRef.current.stopCamera();
            setIsActive(false);
        }
    };

    const captureImage = () => {
        try {
            const image = cameraRef.current.captureImage();
            setCapturedImage(image);
            return image;
        } catch (err) {
            setError(err.message);
            return null;
        }
    };

    const switchCamera = async () => {
        try {
            await cameraRef.current.switchCamera();
        } catch (err) {
            setError(err.message);
        }
    };

    return {
        isActive,
        error,
        capturedImage,
        videoRef,
        startCamera,
        stopCamera,
        captureImage,
        switchCamera,
        isSupported: CameraInput.isSupported()
    };
}
