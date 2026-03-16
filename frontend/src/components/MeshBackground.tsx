import React from 'react';
import '../mesh-background.css';

const MeshBackground: React.FC = () => {
    return (
        <div className="mesh-container">
            <div className="mesh-circle mesh-1"></div>
            <div className="mesh-circle mesh-2"></div>
            <div className="mesh-circle mesh-3"></div>
            <div className="mesh-circle mesh-4"></div>
        </div>
    );
};

export default MeshBackground;
