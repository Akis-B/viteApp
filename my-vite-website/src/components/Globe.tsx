import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GlobeProps {
    color: string;
}

const Globe: React.FC<GlobeProps> = ({ color }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const materialRef = useRef<THREE.LineBasicMaterial | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        const size = 300;
        renderer.setSize(size, size);
        mountRef.current.appendChild(renderer.domElement);

        // Create globe
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const wireframe = new THREE.WireframeGeometry(geometry);
        const line = new THREE.LineSegments(wireframe);
        const material = line.material as THREE.LineBasicMaterial;
        material.color = new THREE.Color(color);
        material.linewidth = 1;
        materialRef.current = material;

        scene.add(line);
        camera.position.z = 2.5;

        // Mouse interaction
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotation = { x: 0, y: 0 };

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            rotation.y += deltaX * 0.01;
            rotation.x += deltaY * 0.01;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const element = renderer.domElement;
        element.addEventListener('mousedown', onMouseDown);
        element.addEventListener('mousemove', onMouseMove);
        element.addEventListener('mouseup', onMouseUp);
        element.addEventListener('mouseleave', onMouseUp);

        // Animation
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            if (!isDragging) {
                rotation.y += 0.002;
            }

            line.rotation.x = rotation.x;
            line.rotation.y = rotation.y;

            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
            element.removeEventListener('mousedown', onMouseDown);
            element.removeEventListener('mousemove', onMouseMove);
            element.removeEventListener('mouseup', onMouseUp);
            element.removeEventListener('mouseleave', onMouseUp);
            if (mountRef.current && element.parentNode === mountRef.current) {
                mountRef.current.removeChild(element);
            }
            geometry.dispose();
            wireframe.dispose();
            (line.material as THREE.LineBasicMaterial).dispose();
            renderer.dispose();
        };
    }, []);

    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.color = new THREE.Color(color);
        }
    }, [color]);

    return <div ref={mountRef} style={{ cursor: 'grab' }} />;
};

export default Globe;
