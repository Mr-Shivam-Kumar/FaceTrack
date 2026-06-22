import { useState, useEffect, useCallback, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { FACE_MATCH_THRESHOLD } from '../utils/constants';

const MODEL_URL = '/models';

/**
 * useFaceDetection - Custom hook for face-api.js operations
 * Loads models, provides face detection and descriptor extraction
 */
export const useFaceDetection = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState(null);
  const loadedRef = useRef(false);

  // Load face-api models
  const loadModels = useCallback(async () => {
    if (loadedRef.current || loadingModels) return;
    setLoadingModels(true);
    setModelError(null);
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      loadedRef.current = true;
      setModelsLoaded(true);
    } catch (err) {
      console.error('Failed to load face detection models:', err);
      setModelError(err.message || 'Failed to load models');
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  /**
   * Detect faces in a video/image element
   * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} input
   * @param {object} options
   * @returns {Promise<Array>} detections with landmarks and descriptors
   */
  const detectFaces = useCallback(
    async (input, options = {}) => {
      if (!modelsLoaded || !input) return [];
      try {
        const { useTiny = false, minConfidence = 0.5, inputSize = 416 } = options;
        const detectorOptions = useTiny
          ? new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: minConfidence })
          : new faceapi.SsdMobilenetv1Options({ minConfidence });

        const detections = await faceapi
          .detectAllFaces(input, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptors()
          .withFaceExpressions();

        return detections;
      } catch (err) {
        console.error('Face detection error:', err);
        return [];
      }
    },
    [modelsLoaded]
  );

  /**
   * Detect single face with highest confidence
   * @param {HTMLElement} input
   * @returns {Promise<object|null>}
   */
  const detectSingleFace = useCallback(
    async (input) => {
      if (!modelsLoaded || !input) return null;
      try {
        const detection = await faceapi
          .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor()
          .withFaceExpressions();
        return detection || null;
      } catch (err) {
        console.error('Single face detection error:', err);
        return null;
      }
    },
    [modelsLoaded]
  );

  /**
   * Extract face descriptors from a canvas/image
   * @param {HTMLElement} input
   * @returns {Promise<Float32Array[]>}
   */
  const extractDescriptors = useCallback(
    async (input) => {
      if (!modelsLoaded || !input) return [];
      try {
        const detections = await faceapi
          .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();
        return detections.map((d) => d.descriptor);
      } catch (err) {
        console.error('Descriptor extraction error:', err);
        return [];
      }
    },
    [modelsLoaded]
  );

  /**
   * Match a descriptor against known faces
   * @param {Float32Array} queryDescriptor
   * @param {Array} labeledDescriptors - [{ label, descriptors: [Float32Array] }]
   * @param {number} threshold
   * @returns {{ label: string, distance: number }}
   */
  const matchFace = useCallback((queryDescriptor, labeledDescriptors, threshold = FACE_MATCH_THRESHOLD) => {
    if (!queryDescriptor || !labeledDescriptors.length) return null;
    try {
      const labeledFaceDescriptors = labeledDescriptors.map(
        (ld) =>
          new faceapi.LabeledFaceDescriptors(
            ld.label,
            ld.descriptors.map((d) => (d instanceof Float32Array ? d : new Float32Array(d)))
          )
      );
      const matcher = new faceapi.FaceMatcher(labeledFaceDescriptors, threshold);
      const result = matcher.findBestMatch(queryDescriptor);
      return {
        label: result.label,
        distance: result.distance,
        confidence: Math.round((1 - result.distance) * 100),
      };
    } catch (err) {
      console.error('Face matching error:', err);
      return null;
    }
  }, []);

  /**
   * Calculate Eye Aspect Ratio for blink detection
   * @param {Array} landmarks - face landmarks points
   * @returns {number} EAR value
   */
  const calculateEAR = useCallback((landmarks) => {
    if (!landmarks) return 0;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const earLeft = getEAR(leftEye);
    const earRight = getEAR(rightEye);
    return (earLeft + earRight) / 2;
  }, []);

  return {
    modelsLoaded,
    loadingModels,
    modelError,
    loadModels,
    detectFaces,
    detectSingleFace,
    extractDescriptors,
    matchFace,
    calculateEAR,
    faceapi,
  };
};

// Helper: Calculate EAR for a single eye
function getEAR(eye) {
  const a = distance(eye[1], eye[5]);
  const b = distance(eye[2], eye[4]);
  const c = distance(eye[0], eye[3]);
  return (a + b) / (2.0 * c);
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
